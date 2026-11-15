import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { PUT as saveDraft } from "@/app/api/page/route";
import { POST as publish } from "@/app/api/page/publish/route";
import { GET as go } from "@/app/go/[pageId]/[blockId]/route";
import { POST as upload } from "@/app/api/media/route";
import { POST as recordView } from "@/app/api/public/views/route";
import { POST as report } from "@/app/api/report/route";
import { POST as admin } from "@/app/api/admin/route";
import { DELETE as deleteAccount } from "@/app/api/settings/account/route";
import { FEATURES } from "@/lib/plans";
import { getPublishedPage } from "@/lib/pages/publish";
import { starterPage } from "@/lib/pages/blocks";
import { block, cookieJar, createCreator, emails, params, PASSWORD, read, request, settle, signInAs } from "./helpers";

describe("saving and publishing", () => {
    it("saves the draft without changing what visitors see, until Publish", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        const draft = { ...starterPage("lena"), profile: { ...starterPage("lena").profile, name: "Lena Hart" } };

        expect((await saveDraft(request("/api/page", { method: "PUT", body: { draft } }))).status).toBe(200);
        expect((await getPublishedPage("lena"))?.doc.profile.name).toBe("lena");

        expect((await publish()).status).toBe(200);
        expect((await getPublishedPage("lena"))?.doc.profile.name).toBe("Lena Hart");
    });

    it("refuses a draft that doesn't fit the page schema", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        const broken = { ...starterPage("lena"), blocks: [{ id: "x", type: "not-a-block" }] };
        expect((await saveDraft(request("/api/page", { method: "PUT", body: { draft: broken } }))).status).toBe(400);
    });

    it("won't publish a Pro feature from a Free account, once that feature is Pro", async () => {
        const { user } = await createCreator("lena", { blocks: [block({ id: "m", type: "music", url: "https://open.spotify.com/track/abc" })] });
        await signInAs(user.id);
        const music = FEATURES.music as { pro: boolean };
        music.pro = true;
        try {
            const refused = await read(await publish());
            expect(refused.status).toBe(402);
            expect(refused.body.message).toContain("Music players");

            await prisma.user.update({ where: { id: user.id }, data: { plan: "PRO" } });
            expect((await publish()).status).toBe(200);
        } finally {
            music.pro = false;
        }
    });
});

describe("tapping a link", () => {
    const tap = (pageId: number, blockId: string) => go(request(`/go/${pageId}/${blockId}`), params({ pageId: String(pageId), blockId }));

    it("goes where the published page says, and counts the click", async () => {
        const { page } = await createCreator("lena", { blocks: [block({ id: "shop", type: "link", title: "Shop", url: "https://shop.example.com" })] });
        const res = await read(await tap(page.id, "shop"));
        await settle();
        expect(res.location).toBe("https://shop.example.com/");
        expect(await prisma.event.count({ where: { type: "CLICK", blockId: "shop" } })).toBe(1);
    });

    it("can't be used to send people anywhere else (no open redirect)", async () => {
        const { page } = await createCreator("lena");
        // a block that doesn't exist, or a page that doesn't: back to safety, never elsewhere
        expect((await read(await tap(page.id, "https://evil.example"))).location).toBe("http://localhost:3000/lena");
        expect((await read(await tap(999, "first"))).location).toBe("http://localhost:3000/");
    });

    it("opens a project's case study on Roselle", async () => {
        const { page } = await createCreator("lena", { blocks: [block({ id: "p1", type: "project", title: "Northern Light", body: "The brief…" })] });
        expect((await read(await tap(page.id, "p1"))).location).toBe("http://localhost:3000/lena/work/p1");
    });

    it("sends a tap on a pick to that pick's shop, counted against the Picks block", async () => {
        const items = [{ id: "cup", title: "Cup", label: "$40", image: "https://img.example/cup.jpg", url: "https://shop.example.com/cup" }];
        const { page } = await createCreator("lena", { blocks: [block({ id: "shelf", type: "picks", items })] });
        const res = await read(await go(request(`/go/${page.id}/shelf?item=cup`), params({ pageId: String(page.id), blockId: "shelf" })));
        await settle();
        expect(res.location).toBe("https://shop.example.com/cup");
        expect(await prisma.event.count({ where: { type: "CLICK", blockId: "shelf" } })).toBe(1);
        // no pick named: back to the page
        expect((await read(await tap(page.id, "shelf"))).location).toBe("http://localhost:3000/lena");
    });

    it("stops working on a page that's been taken down", async () => {
        const { page } = await createCreator("lena", { blocks: [block({ id: "shop", type: "link", title: "Shop", url: "https://scam.example" })] });
        await prisma.page.update({ where: { id: page.id }, data: { suspendedAt: new Date() } });
        expect((await read(await tap(page.id, "shop"))).location).toBe("http://localhost:3000/lena");
    });
});

describe("uploading an image", () => {
    // the first bytes of a WebP file: enough for the server to know it's one
    const WEBP = new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 ");
    const send = (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return upload(new NextRequest("http://localhost:3000/api/media", { method: "POST", body: form, headers: { cookie: `session=${cookieJar.get("session")}` } }));
    };

    it("stores a photo and answers with its address", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        const res = await read(await send(new File([WEBP], "photo.webp", { type: "image/webp" })));
        expect(res.status).toBe(201);
        expect(res.body.data.url).toMatch(/^\/media\/\w+$/);
    });

    it("refuses SVG (it can carry scripts) and anything over 4 MB", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        expect((await send(new File(["<svg onload=alert(1)>"], "x.svg", { type: "image/svg+xml" }))).status).toBe(400);
        expect((await send(new File([new Uint8Array(4 * 1024 * 1024 + 1)], "huge.jpg", { type: "image/jpeg" }))).status).toBe(413);
        expect(await prisma.media.count()).toBe(0);
    });

    it("refuses a file that only claims to be a photo, with a reason people can act on", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        const res = await read(await send(new File(["not a photo"], "renamed.jpg", { type: "image/jpeg" })));
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/damaged or isn't really a photo/);
        expect(await prisma.media.count()).toBe(0);
    });

    describe("on the live site, with Cloudinary", () => {
        // what the app sends to Cloudinary, answered as Cloudinary would
        let calls: { url: string; method: string; body: FormData | null; auth: string | null }[] = [];
        beforeEach(() => {
            calls = [];
            vi.stubEnv("CLOUDINARY_URL", "cloudinary://123456:s3cret@roselle-demo");
            vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
                calls.push({ url: String(input), method: init?.method ?? "GET", body: init?.body instanceof FormData ? init.body : null, auth: new Headers(init?.headers).get("authorization") });
                return Response.json({ secure_url: "https://res.cloudinary.com/roselle-demo/image/upload/v1/roselle/localhost/u1/photo.webp" });
            });
        });
        afterEach(() => {
            vi.unstubAllEnvs();
            vi.restoreAllMocks();
        });

        it("sends the photo to Cloudinary, signed, into the person's own folder, and keeps only its address", async () => {
            const { user } = await createCreator("lena");
            await signInAs(user.id);
            const res = await read(await send(new File([WEBP], "photo.webp", { type: "image/webp" })));

            expect(res.status).toBe(201);
            expect(res.body.data.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
            expect(await prisma.media.count()).toBe(0);
            const [call] = calls;
            expect(call.url).toBe("https://api.cloudinary.com/v1_1/roselle-demo/image/upload");
            expect(call.body?.get("folder")).toBe(`roselle/localhost/u${user.id}`);
            expect(call.body?.get("api_key")).toBe("123456");
            // signed with the secret, which itself never leaves the server
            expect(call.body?.get("signature")).toMatch(/^[0-9a-f]{40}$/);
            expect([...call.body!.values()].join()).not.toContain("s3cret");
        });

        it("deletes the person's photos when they delete their account", async () => {
            const { user } = await createCreator("lena");
            await signInAs(user.id);
            expect((await deleteAccount(request("/api/settings/account", { method: "DELETE", body: { password: PASSWORD } }))).status).toBe(200);
            await settle();

            const removal = calls.find((call) => call.method === "DELETE");
            expect(removal?.url).toBe(`https://api.cloudinary.com/v1_1/roselle-demo/resources/image/upload?prefix=${encodeURIComponent(`roselle/localhost/u${user.id}/`)}`);
            expect(removal?.auth).toBe(`Basic ${Buffer.from("123456:s3cret").toString("base64")}`);
        });
    });
});

describe("counting visits", () => {
    const visit = (pageId: number, headers: Record<string, string> = {}) => recordView(request("/api/public/views", { method: "POST", body: { pageId, referrer: "https://www.instagram.com/" }, headers }));

    it("records where the visitor came from, never their IP address", async () => {
        const { page } = await createCreator("lena");
        await visit(page.id);
        await settle();
        const event = await prisma.event.findFirstOrThrow();
        expect(event).toMatchObject({ type: "VIEW", source: "instagram.com", device: "desktop" });
        expect(JSON.stringify(event)).not.toMatch(/\d+\.\d+\.\d+\.\d+/);
    });

    it("ignores bots and link previews", async () => {
        const { page } = await createCreator("lena");
        await visit(page.id, { "user-agent": "facebookexternalhit/1.1" });
        await settle();
        expect(await prisma.event.count()).toBe(0);
    });
});

describe("reports and take-downs", () => {
    it("saves a report and tells the admins", async () => {
        const { page } = await createCreator("scammer");
        const res = await report(request("/api/report", { method: "POST", body: { pageId: page.id, reason: "scam", details: "Fake giveaway", email: "" } }));
        await settle();
        expect(res.status).toBe(201);
        expect(await prisma.report.count()).toBe(1);
        expect(emails[0]).toMatchObject({ to: "admin@example.com" });
    });

    it("lets an admin take a page down: gone for visitors, owner told, open reports settled", async () => {
        const { page } = await createCreator("scammer");
        await prisma.report.create({ data: { pageId: page.id, reason: "scam", details: "" } });
        const { user: adminUser } = await createCreator("boss", { email: "admin@example.com" });
        await signInAs(adminUser.id);

        const res = await admin(request("/api/admin", { method: "POST", body: { action: "suspend", username: "scammer", reason: "Fake giveaway" } }));
        await settle();
        expect(res.status).toBe(200);
        expect(await getPublishedPage("scammer")).toBeNull();
        expect(await prisma.report.count({ where: { resolvedAt: null } })).toBe(0);
        expect(emails.at(-1)).toMatchObject({ to: "scammer@example.com", subject: "Your Roselle page has been taken down" });
    });

    it("stops a taken-down page from being published again", async () => {
        const { user, page } = await createCreator("scammer");
        await prisma.page.update({ where: { id: page.id }, data: { suspendedAt: new Date(), suspendedReason: "Fake giveaway" } });
        await signInAs(user.id);
        const res = await read(await publish());
        expect(res.status).toBe(403);
        expect(res.body.message).toContain("Fake giveaway");
    });

    it("doesn't let anyone who isn't an admin take pages down", async () => {
        await createCreator("lena");
        const { user } = await createCreator("sam");
        await signInAs(user.id);
        expect((await admin(request("/api/admin", { method: "POST", body: { action: "suspend", username: "lena", reason: "Because I can" } }))).status).toBe(404);
        expect(await getPublishedPage("lena")).not.toBeNull();
    });
});
