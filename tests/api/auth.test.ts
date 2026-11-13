import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as forgot } from "@/app/api/auth/forgot/route";
import { POST as reset } from "@/app/api/auth/reset/route";
import { GET as verify } from "@/app/verify/route";
import { PUT as changePassword } from "@/app/api/settings/password/route";
import { DELETE as deleteAccount } from "@/app/api/settings/account/route";
import { cookieJar, createCreator, emails, PASSWORD, read, request, settle, signInAs } from "./helpers";

// the token at the end of the link in the last email
const linkToken = () => emails.at(-1)!.text.match(/token=([\w-]+)/)![1];

describe("signing up", () => {
    it("creates the account and its page together, signs in, and emails a confirmation link", async () => {
        const res = await read(await register(request("/api/auth/register", { method: "POST", body: { username: "Ada", email: "Ada@Example.com", password: PASSWORD } })));
        await settle();

        expect(res.status).toBe(201);
        const user = await prisma.user.findUniqueOrThrow({ where: { email: "ada@example.com" }, include: { page: true } });
        expect(user.page?.username).toBe("ada");
        expect(user.passwordHash).not.toContain(PASSWORD);
        // the cookie holds a token; the database only its hash
        const session = await prisma.session.findFirstOrThrow({ where: { userId: user.id } });
        expect(cookieJar.get("session")).toBeTruthy();
        expect(session.id).not.toBe(cookieJar.get("session"));
        expect(emails).toHaveLength(1);
        expect(emails[0].text).toContain("/verify?token=");
    });

    it("refuses a taken name or email", async () => {
        await createCreator("ada");
        const takenName = await read(await register(request("/api/auth/register", { method: "POST", body: { username: "ada", email: "other@example.com", password: PASSWORD } })));
        const takenEmail = await read(await register(request("/api/auth/register", { method: "POST", body: { username: "other", email: "ada@example.com", password: PASSWORD } })));
        expect([takenName.status, takenName.body.message]).toEqual([409, "That name is taken"]);
        expect([takenEmail.status, takenEmail.body.message]).toEqual([409, "Email is already registered"]);
    });
});

describe("signing in", () => {
    it("gives the same answer for a wrong password and an unknown email", async () => {
        await createCreator("ada");
        const wrongPassword = await read(await login(request("/api/auth/login", { method: "POST", body: { email: "ada@example.com", password: "nope-nope" } })));
        const unknown = await read(await login(request("/api/auth/login", { method: "POST", body: { email: "nobody@example.com", password: "nope-nope" } })));
        expect(wrongPassword).toEqual(unknown);
        expect(wrongPassword.status).toBe(401);
    });

    it("stops password guessing after 10 tries from one place", async () => {
        await createCreator("ada");
        const attempt = () => login(request("/api/auth/login", { method: "POST", ip: "203.0.113.9", body: { email: "ada@example.com", password: "wrong-guess" } }));
        for (let i = 0; i < 10; i++) expect((await attempt()).status).toBe(401);
        expect((await attempt()).status).toBe(429);
        // the real owner, somewhere else, can still get in
        expect((await login(request("/api/auth/login", { method: "POST", body: { email: "ada@example.com", password: PASSWORD } }))).status).toBe(200);
    });
});

describe("forgotten passwords", () => {
    it("answers the same whether or not the account exists, and only emails a real one", async () => {
        await createCreator("ada");
        const known = await read(await forgot(request("/api/auth/forgot", { method: "POST", body: { email: "ada@example.com" } })));
        const unknown = await read(await forgot(request("/api/auth/forgot", { method: "POST", body: { email: "nobody@example.com" } })));
        await settle();
        expect(known).toEqual(unknown);
        expect(emails.map((email) => email.to)).toEqual(["ada@example.com"]);
    });

    it("resets with the emailed link once, and signs out every other browser", async () => {
        const { user } = await createCreator("ada");
        await signInAs(user.id); // some other browser, signed in
        await forgot(request("/api/auth/forgot", { method: "POST", body: { email: "ada@example.com" } }));
        await settle();
        const token = linkToken();

        const first = await reset(request("/api/auth/reset", { method: "POST", body: { token, password: "a-new-password" } }));
        expect(first.status).toBe(200);
        // only the session this reset just started is left
        expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
        expect((await login(request("/api/auth/login", { method: "POST", body: { email: "ada@example.com", password: "a-new-password" } }))).status).toBe(200);

        const again = await read(await reset(request("/api/auth/reset", { method: "POST", body: { token, password: "another-password" } })));
        expect(again.status).toBe(400);
    });
});

describe("confirming an email address", () => {
    it("works once", async () => {
        await register(request("/api/auth/register", { method: "POST", body: { username: "ada", email: "ada@example.com", password: PASSWORD } }));
        await settle();
        const link = `/verify?token=${linkToken()}`;

        expect((await read(await verify(request(link)))).location).toContain("verified=1");
        expect((await prisma.user.findUniqueOrThrow({ where: { email: "ada@example.com" } })).emailVerifiedAt).not.toBeNull();
        expect((await read(await verify(request(link)))).location).toContain("verified=0");
    });
});

describe("account settings", () => {
    it("changes the password only with the current one, keeping this browser signed in", async () => {
        const { user } = await createCreator("ada");
        await signInAs(user.id);
        const wrong = await read(await changePassword(request("/api/settings/password", { method: "PUT", body: { current: "not-it", password: "brand-new-pass" } })));
        expect(wrong.status).toBe(400);

        const right = await changePassword(request("/api/settings/password", { method: "PUT", body: { current: PASSWORD, password: "brand-new-pass" } }));
        expect(right.status).toBe(200);
        expect(await prisma.session.count({ where: { userId: user.id } })).toBe(1);
    });

    it("deletes the account and everything in it, given the password", async () => {
        const { user, page } = await createCreator("ada");
        await prisma.enquiry.create({ data: { pageId: page.id, name: "Sam", email: "sam@example.com", message: "Hi" } });
        await signInAs(user.id);

        expect((await deleteAccount(request("/api/settings/account", { method: "DELETE", body: { password: "wrong" } }))).status).toBe(400);
        expect((await deleteAccount(request("/api/settings/account", { method: "DELETE", body: { password: PASSWORD } }))).status).toBe(200);

        expect(await prisma.user.count()).toBe(0);
        expect(await prisma.page.count()).toBe(0);
        expect(await prisma.enquiry.count()).toBe(0);
        expect(cookieJar.has("session")).toBe(false);
    });

    it("turns away anyone not signed in", async () => {
        const res = await read(await changePassword(request("/api/settings/password", { method: "PUT", body: { current: PASSWORD, password: "brand-new-pass" } })));
        expect(res.status).toBe(401);
    });
});
