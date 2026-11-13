import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { starterPage } from "@/lib/pages/blocks";
import { blockSchema, type Block, type PageDoc } from "@/lib/validations/page";

import { cookieJar, emails, pending } from "./recorded";

export { cookieJar, emails };

// Wait for everything the last requests queued with after() (emails, analytics writes)
export async function settle() {
    while (pending.length) await pending.shift();
}

// A clean slate before every test: no rows, no cookie, no emails
export async function resetAll() {
    await settle().catch(() => {});
    await prisma.$executeRawUnsafe(`TRUNCATE "User", "Session", "Token", "Page", "Event", "Media", "Enquiry", "Report", "Review" RESTART IDENTITY CASCADE`);
    cookieJar.clear();
    emails.length = 0;
}

// Every request comes from its own address unless a test says otherwise, so the per-IP rate
// limits (kept in memory for the whole run) only trip when a test means them to
let nextIp = 0;
export const freshIp = () => `10.${Math.floor(++nextIp / 250)}.${nextIp % 250}.1`;

export function request(path: string, { method = "GET", body, ip = freshIp(), headers = {} }: { method?: string; body?: unknown; ip?: string; headers?: Record<string, string> } = {}) {
    return new NextRequest(new URL(path, "http://localhost:3000"), {
        method,
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
            "content-type": "application/json",
            "x-forwarded-for": ip,
            "user-agent": "Mozilla/5.0 (Macintosh) test",
            // like a browser, every request carries the signed-in cookie
            ...(cookieJar.size && { cookie: [...cookieJar].map(([name, value]) => `${name}=${value}`).join("; ") }),
            ...headers,
        },
    });
}

// A route's answer, read once: status, JSON body and where a redirect goes
export async function read(response: Response) {
    return { status: response.status, body: await response.json().catch(() => null), location: response.headers.get("location") };
}

// The second argument of a dynamic route handler
export const params = <T extends Record<string, string>>(values: T) => ({ params: Promise.resolve(values) });

export const PASSWORD = "password123";

// A creator with a page; published unless told otherwise. Extra blocks go on the page.
export async function createCreator(username: string, { blocks = [] as Block[], publish = true, email = `${username}@example.com` } = {}) {
    const doc: PageDoc = { ...starterPage(username), blocks: [...starterPage(username).blocks, ...blocks] };
    const user = await prisma.user.create({
        data: { email, passwordHash: await hashPassword(PASSWORD), page: { create: { username, draft: doc, ...(publish && { published: doc, publishedAt: new Date() }) } } },
        include: { page: true },
    });
    return { user, page: user.page! };
}

// Signs this "browser" in as the user (the real session code, writing into the cookie jar)
export async function signInAs(userId: number) {
    cookieJar.clear();
    await startSession(userId);
}

export const signOut = () => cookieJar.clear();

// A block as the editor would save it, defaults filled in
export const block = (raw: object) => blockSchema.parse(raw);
