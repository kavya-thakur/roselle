import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

// The database only keeps this hash of the cookie's token (see the Session model)
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Signs this browser in as the user: a session row, and the cookie that points to it
export async function startSession(userId: number) {
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await prisma.session.create({ data: { id: hashToken(token), userId, expiresAt } });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

export async function endSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (token) {
        await prisma.session.deleteMany({ where: { id: hashToken(token) } });
    }
    cookieStore.delete(SESSION_COOKIE);
}
