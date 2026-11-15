import { afterAll, beforeEach, vi } from "vitest";
import { testDatabaseUrl } from "./test-database";

// Runs before each API test file, before the app's code is imported, so the app connects to the
// test database and sees these settings.
process.env.DATABASE_URL = testDatabaseUrl();
process.env.APP_URL = "http://localhost:3000";
process.env.SITE_URL = "http://localhost:3000";
process.env.VISITOR_SALT = "test-salt";
process.env.CRON_SECRET = "test-cron-secret";
process.env.ADMIN_EMAILS = "admin@example.com";
// never the real outside services, even when .env has their keys: photos are kept in the test
// database (a test that wants Cloudinary sets its own fake address), and emails are kept below
process.env.CLOUDINARY_URL = "";
process.env.BREVO_API_KEY = "";

// Only the outside world is replaced; the route handlers, validation, sessions and database
// queries are the real ones.

// The browser's cookie: a jar in memory (signInAs in helpers.ts fills it)
vi.mock("next/headers", async () => {
    const { cookieJar } = await import("./recorded");
    return {
        cookies: async () => ({
            get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined),
            has: (name: string) => cookieJar.has(name),
            set: (name: string, value: string) => cookieJar.set(name, value),
            delete: (name: string) => cookieJar.delete(name),
        }),
    };
});

// Work Next does after answering (emails, analytics): collected, so a test can wait for it
vi.mock("next/server", async (importOriginal) => {
    const { pending } = await import("./recorded");
    return {
        ...(await importOriginal<typeof import("next/server")>()),
        after: (task: (() => unknown) | Promise<unknown>) => pending.push(Promise.resolve().then(() => (typeof task === "function" ? task() : task))),
    };
});

// Refreshing cached pages: nothing to refresh outside Next
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Emails are kept for the test to read instead of sent
vi.mock("@/lib/email/send", async () => {
    const { emails } = await import("./recorded");
    return { sendEmail: async (email: (typeof emails)[number]) => void emails.push(email) };
});

beforeEach(async () => (await import("./helpers")).resetAll());
afterAll(async () => (await import("@/lib/db/prisma")).prisma.$disconnect());
