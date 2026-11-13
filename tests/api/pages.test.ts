import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { PUT as saveDraft } from "@/app/api/page/route";
import { POST as publish } from "@/app/api/page/publish/route";
import { GET as go } from "@/app/go/[pageId]/[blockId]/route";
import { POST as upload } from "@/app/api/media/route";
import { POST as recordView } from "@/app/api/public/views/route";
import { POST as report } from "@/app/api/report/route";
import { POST as admin } from "@/app/api/admin/route";
import { FEATURES } from "@/lib/plans";
import { getPublishedPage } from "@/lib/pages/publish";
import { starterPage } from "@/lib/pages/blocks";
import { block, cookieJar, createCreator, emails, params, read, request, settle, signInAs } from "./helpers";

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

    it("stops working on a page that's been taken down", async () => {
        const { page } = await createCreator("lena", { blocks: [block({ id: "shop", type: "link", title: "Shop", url: "https://scam.example" })] });
        await prisma.page.update({ where: { id: page.id }, data: { suspendedAt: new Date() } });
        expect((await read(await tap(page.id, "shop"))).location).toBe("http://localhost:3000/lena");
    });
});

describe("uploading an image", () => {
    const send = (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return upload(new NextRequest("http://localhost:3000/api/media", { method: "POST", body: form, headers: { cookie: `session=${cookieJar.get("session")}` } }));
    };

    it("stores a photo and answers with its address", async () => {
        const { user } = await createCreator("lena");
        await signInAs(user.id);
        const res = await read(await send(new File([new Uint8Array([1, 2, 3])], "photo.webp", { type: "image/webp" })));
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
