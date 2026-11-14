import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as enquire } from "@/app/api/enquiry/route";
import { DELETE as deleteEnquiry, PATCH as updateEnquiry } from "@/app/api/enquiry/[id]/route";
import { block, createCreator, emails, params, read, request, settle, signInAs, signOut } from "./helpers";

const services = block({
    id: "sv",
    type: "services",
    items: [
        { id: "s1", name: "Portrait session", price: "from ₹8,000", description: "" },
        { id: "s2", name: "Brand shoot", price: "from ₹25,000", description: "" },
    ],
});
const contact = block({ id: "ct", type: "contact" });

const message = { name: "Priya", email: "priya@example.com", message: "Could you shoot my headshots?" };
const send = (pageId: number, body: object, ip?: string) => enquire(request("/api/enquiry", { method: "POST", ip, body: { pageId, ...message, ...body } }));

describe("a visitor enquires", () => {
    it("about a service: saved with the service's real name, the date and where they came from, and emailed", async () => {
        const { page } = await createCreator("lena", { blocks: [services] });
        const res = await send(page.id, { blockId: "sv", serviceId: "s2", wantedOn: "2026-12-05", referrer: "https://www.instagram.com/lena" });
        await settle();

        expect(res.status).toBe(201);
        const saved = await prisma.enquiry.findFirstOrThrow();
        expect(saved).toMatchObject({ pageId: page.id, service: "Brand shoot", wantedOn: "2026-12-05", source: "instagram.com", status: "NEW" });
        expect(emails).toHaveLength(1);
        expect(emails[0]).toMatchObject({ to: "lena@example.com", replyTo: { email: "priya@example.com", name: "Priya" } });
        expect(emails[0].text).toContain("About: Brand shoot (from ₹25,000)");
    });

    it("through the contact form, with no service", async () => {
        const { page } = await createCreator("lena", { blocks: [contact] });
        expect((await send(page.id, { blockId: "ct" })).status).toBe(201);
        expect(await prisma.enquiry.findFirstOrThrow()).toMatchObject({ service: null, source: "direct" });
    });

    it("can't invent a service, or write to a block that isn't a form", async () => {
        const { page } = await createCreator("lena", { blocks: [services] });
        expect((await send(page.id, { blockId: "sv", serviceId: "made-up" })).status).toBe(404);
        // the starter page's link block takes no messages
        expect((await send(page.id, { blockId: "first" })).status).toBe(404);
        expect(await prisma.enquiry.count()).toBe(0);
    });

    it("only reaches what's published: not a block still in the draft, not an unpublished page", async () => {
        const { page } = await createCreator("lena");
        await prisma.page.update({ where: { id: page.id }, data: { draft: { ...(page.draft as object), blocks: [contact] } } });
        expect((await send(page.id, { blockId: "ct" })).status).toBe(404);

        const { page: unpublished } = await createCreator("sam", { blocks: [contact], publish: false });
        expect((await send(unpublished.id, { blockId: "ct" })).status).toBe(404);
    });

    it("can't reach a page that's been taken down", async () => {
        const { page } = await createCreator("lena", { blocks: [contact] });
        await prisma.page.update({ where: { id: page.id }, data: { suspendedAt: new Date() } });
        expect((await send(page.id, { blockId: "ct" })).status).toBe(404);
    });

    it("quietly drops what a spam robot sends (the hidden field is filled in)", async () => {
        const { page } = await createCreator("lena", { blocks: [contact] });
        const res = await send(page.id, { blockId: "ct", website: "cheap-pills.example" });
        await settle();
        // it looks like it worked, so the robot learns nothing
        expect(res.status).toBe(201);
        expect(await prisma.enquiry.count()).toBe(0);
        expect(emails).toHaveLength(0);
    });

    it("takes at most 5 messages an hour from one place", async () => {
        const { page } = await createCreator("lena", { blocks: [contact] });
        for (let i = 0; i < 5; i++) expect((await send(page.id, { blockId: "ct" }, "198.51.100.7")).status).toBe(201);
        expect((await send(page.id, { blockId: "ct" }, "198.51.100.7")).status).toBe(429);
    });

    it("keeps a WhatsApp number when they give one, and refuses one that isn't", async () => {
        const { page } = await createCreator("lena", { blocks: [contact] });
        expect((await send(page.id, { blockId: "ct", phone: "+91 98765 43210" })).status).toBe(201);
        await settle();
        expect(await prisma.enquiry.findFirstOrThrow()).toMatchObject({ phone: "+91 98765 43210" });
        expect(emails[0].text).toContain("WhatsApp: +91 98765 43210");
        expect((await send(page.id, { blockId: "ct", phone: "call me maybe" })).status).toBe(400);
    });

    it("refuses a missing name, a bad email or a date that isn't one", async () => {
        const { page } = await createCreator("lena", { blocks: [services] });
        expect((await send(page.id, { blockId: "sv", serviceId: "s1", name: " " })).status).toBe(400);
        expect((await send(page.id, { blockId: "sv", serviceId: "s1", email: "not-an-email" })).status).toBe(400);
        expect((await send(page.id, { blockId: "sv", serviceId: "s1", wantedOn: "next tuesday" })).status).toBe(400);
    });
});

describe("the creator works the inbox", () => {
    async function setUp() {
        const lena = await createCreator("lena", { blocks: [services] });
        const enquiry = await prisma.enquiry.create({ data: { pageId: lena.page.id, ...message, service: "Brand shoot" } });
        return { lena, enquiry };
    }
    const update = (id: number, body: object) => updateEnquiry(request(`/api/enquiry/${id}`, { method: "PATCH", body }), params({ id: String(id) }));

    it("moves an enquiry to Booked: the booking and the first reply are both dated", async () => {
        const { lena, enquiry } = await setUp();
        await signInAs(lena.user.id);

        const booked = await read(await update(enquiry.id, { status: "BOOKED", amount: 25000 }));
        expect(booked.status).toBe(200);
        const saved = await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } });
        expect(saved).toMatchObject({ status: "BOOKED", amount: 25000 });
        expect(saved.bookedAt).not.toBeNull();
        expect(saved.repliedAt).not.toBeNull();
    });

    it("keeps the booking date when it's paid, and drops it if the work falls through", async () => {
        const { lena, enquiry } = await setUp();
        await signInAs(lena.user.id);
        await update(enquiry.id, { status: "BOOKED" });
        const { bookedAt } = await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } });

        await update(enquiry.id, { status: "PAID" });
        expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).bookedAt).toEqual(bookedAt);

        await update(enquiry.id, { status: "CLOSED" });
        expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).bookedAt).toBeNull();
    });

    it("refuses a negative or fractional amount", async () => {
        const { lena, enquiry } = await setUp();
        await signInAs(lena.user.id);
        expect((await update(enquiry.id, { amount: -5 })).status).toBe(400);
        expect((await update(enquiry.id, { amount: 10.5 })).status).toBe(400);
    });

    it("never lets one creator see or change another's enquiries", async () => {
        const { enquiry } = await setUp();
        const sam = await createCreator("sam");
        await signInAs(sam.user.id);

        expect((await update(enquiry.id, { status: "CLOSED" })).status).toBe(404);
        expect((await deleteEnquiry(request(`/api/enquiry/${enquiry.id}`, { method: "DELETE" }), params({ id: String(enquiry.id) }))).status).toBe(404);
        expect(await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).toMatchObject({ status: "NEW" });
    });

    it("turns away anyone not signed in", async () => {
        const { enquiry } = await setUp();
        signOut();
        expect((await update(enquiry.id, { status: "BOOKED" })).status).toBe(401);
    });
});
