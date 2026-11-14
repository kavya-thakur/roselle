import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as requestReview } from "@/app/api/enquiry/[id]/review-request/route";
import { POST as requestPayment } from "@/app/api/enquiry/[id]/payment-request/route";
import { POST as leaveReview } from "@/app/api/review/route";
import { DELETE as deleteReview, PATCH as approveReview } from "@/app/api/reviews/[id]/route";
import { GET as dailyJob } from "@/app/api/cron/daily/route";
import { getApprovedReviews } from "@/lib/reviews";
import { EVENT_DAYS } from "@/lib/reports/daily";
import { pageStats } from "@/lib/analytics/stats";
import { createCreator, emails, params, read, request, settle, signInAs } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

// Lena, signed in, with one enquiry from Arjun at the given stage
async function lenaWithEnquiry(status: "NEW" | "BOOKED" | "PAID" = "PAID") {
    const lena = await createCreator("lena");
    await prisma.user.update({ where: { id: lena.user.id }, data: { currency: "INR" } });
    const enquiry = await prisma.enquiry.create({ data: { pageId: lena.page.id, name: "Arjun", email: "arjun@example.com", message: "Hi", service: "Brand shoot", status, amount: 25000 } });
    await signInAs(lena.user.id);
    return { lena, enquiry };
}

const askForReview = (id: number) => requestReview(request(`/api/enquiry/${id}/review-request`, { method: "POST" }), params({ id: String(id) }));
const reviewToken = () => emails.at(-1)!.text.match(/\/review\/([\w-]+)/)![1];
const review = { name: "Arjun", rating: 5, text: "Calm, quick, and the photos arrived early." };

describe("reviews", () => {
    it("hand the creator a working one-time link to send themselves, without emailing anyone", async () => {
        const { enquiry } = await lenaWithEnquiry("PAID");
        const res = await read(await requestReview(request(`/api/enquiry/${enquiry.id}/review-request`, { method: "POST", body: { via: "self" } }), params({ id: String(enquiry.id) })));
        await settle();
        expect(emails).toHaveLength(0);
        const token = res.body.data.link.match(/\/review\/([\w-]+)/)[1];
        expect((await leaveReview(request("/api/review", { method: "POST", body: { token, ...review } }))).status).toBe(201);
        expect((await leaveReview(request("/api/review", { method: "POST", body: { token, ...review } }))).status).toBe(410);
    });

    it("are only asked for once the work is paid", async () => {
        const { enquiry } = await lenaWithEnquiry("BOOKED");
        expect((await askForReview(enquiry.id)).status).toBe(409);
        expect(emails).toHaveLength(0);
    });

    it("go from a one-time link to the creator for approval, then onto the page", async () => {
        const { lena, enquiry } = await lenaWithEnquiry("PAID");
        expect((await askForReview(enquiry.id)).status).toBe(200);
        await settle();

        // the client's email comes "from" the creator, and replies go to them
        expect(emails[0]).toMatchObject({ to: "arjun@example.com", fromName: "lena via Roselle", replyTo: { email: "lena@example.com" } });
        const token = reviewToken();
        // only the hash is stored
        expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).reviewTokenHash).not.toBe(token);

        expect((await leaveReview(request("/api/review", { method: "POST", body: { token, ...review } }))).status).toBe(201);
        await settle();
        expect(emails.at(-1)).toMatchObject({ to: "lena@example.com", subject: "Arjun left you a 5-star review" });

        // waiting for approval: not on the page yet
        expect(await getApprovedReviews(lena.page.id)).toEqual([]);
        const saved = await prisma.review.findFirstOrThrow();
        expect(saved).toMatchObject({ service: "Brand shoot", enquiryId: enquiry.id, approvedAt: null });

        await approveReview(request(`/api/reviews/${saved.id}`, { method: "PATCH", body: { approved: true } }), params({ id: String(saved.id) }));
        expect(await getApprovedReviews(lena.page.id)).toMatchObject([{ name: "Arjun", rating: 5 }]);
    });

    it("can't be left twice with the same link", async () => {
        const { enquiry } = await lenaWithEnquiry("PAID");
        await askForReview(enquiry.id);
        await settle();
        const token = reviewToken();

        expect((await leaveReview(request("/api/review", { method: "POST", body: { token, ...review } }))).status).toBe(201);
        expect((await leaveReview(request("/api/review", { method: "POST", body: { token, ...review, text: "Second go at it" } }))).status).toBe(410);
        expect(await prisma.review.count()).toBe(1);
    });

    it("can't be asked for again once the client has reviewed", async () => {
        const { enquiry } = await lenaWithEnquiry("PAID");
        await askForReview(enquiry.id);
        await settle();
        await leaveReview(request("/api/review", { method: "POST", body: { token: reviewToken(), ...review } }));
        expect((await askForReview(enquiry.id)).status).toBe(409);
    });

    it("stop working after 60 days", async () => {
        const { enquiry } = await lenaWithEnquiry("PAID");
        await askForReview(enquiry.id);
        await settle();
        await prisma.enquiry.update({ where: { id: enquiry.id }, data: { reviewRequestedAt: new Date(Date.now() - 61 * DAY) } });
        expect((await leaveReview(request("/api/review", { method: "POST", body: { token: reviewToken(), ...review } }))).status).toBe(410);
    });

    it("refuse a made-up link", async () => {
        await lenaWithEnquiry("PAID");
        expect((await leaveReview(request("/api/review", { method: "POST", body: { token: "made-up-token", ...review } }))).status).toBe(410);
    });

    it("are 1 to 5 stars, enforced by the database itself", async () => {
        const { lena } = await lenaWithEnquiry("PAID");
        await expect(prisma.review.create({ data: { pageId: lena.page.id, name: "X", rating: 7, text: "Out of range" } })).rejects.toThrow();
    });

    it("can only be approved or deleted by the page's own creator", async () => {
        const { lena } = await lenaWithEnquiry("PAID");
        const saved = await prisma.review.create({ data: { pageId: lena.page.id, name: "Arjun", rating: 5, text: "Lovely work" } });
        const sam = await createCreator("sam");
        await signInAs(sam.user.id);

        expect((await approveReview(request(`/api/reviews/${saved.id}`, { method: "PATCH", body: { approved: true } }), params({ id: String(saved.id) }))).status).toBe(404);
        expect((await deleteReview(request(`/api/reviews/${saved.id}`, { method: "DELETE" }), params({ id: String(saved.id) }))).status).toBe(404);
        expect(await prisma.review.findUniqueOrThrow({ where: { id: saved.id } })).toMatchObject({ approvedAt: null });
    });
});

describe("payment requests", () => {
    const ask = (id: number, body: object) => requestPayment(request(`/api/enquiry/${id}/payment-request`, { method: "POST", body }), params({ id: String(id) }));

    it("are only recorded when the creator sends them from their own WhatsApp or email", async () => {
        const { enquiry } = await lenaWithEnquiry("BOOKED");
        expect((await ask(enquiry.id, { amount: 10000, link: "lena@okhdfcbank", via: "self" })).status).toBe(200);
        await settle();
        expect(emails).toHaveLength(0);
        expect(await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).toMatchObject({ paymentRequestedAmount: 10000 });
    });

    it("email a booked client what's due and their UPI id, and remember where they pay", async () => {
        const { lena, enquiry } = await lenaWithEnquiry("BOOKED");
        const res = await read(await ask(enquiry.id, { amount: 10000, link: "lena@okhdfcbank", note: "50% deposit to hold your date." }));
        await settle();

        expect(res.status).toBe(200);
        expect(emails[0]).toMatchObject({ to: "arjun@example.com", subject: "lena: ₹10,000 for Brand shoot", replyTo: { email: "lena@example.com" } });
        expect(emails[0].text).toContain("Pay by UPI to: lena@okhdfcbank");
        expect(emails[0].text).toContain("50% deposit to hold your date.");
        expect(await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiry.id } })).toMatchObject({ paymentRequestedAmount: 10000 });
        expect(await prisma.user.findUniqueOrThrow({ where: { id: lena.user.id } })).toMatchObject({ paymentLink: "lena@okhdfcbank" });
    });

    it("send a payment page address as a link", async () => {
        const { enquiry } = await lenaWithEnquiry("BOOKED");
        await ask(enquiry.id, { amount: 25000, link: "https://buy.stripe.com/test_123" });
        await settle();
        expect(emails[0].text).toContain("Pay here: https://buy.stripe.com/test_123");
    });

    it("refuse an email address, a plain http link or a script as where to pay", async () => {
        const { enquiry } = await lenaWithEnquiry("BOOKED");
        for (const link of ["lena@gmail.com", "http://pay.example.com", "javascript:alert(1)"]) {
            expect((await ask(enquiry.id, { amount: 100, link })).status).toBe(400);
        }
        expect(emails).toHaveLength(0);
    });

    it("are only for booked work", async () => {
        const { enquiry } = await lenaWithEnquiry("NEW");
        expect((await ask(enquiry.id, { amount: 100, link: "lena@okhdfcbank" })).status).toBe(409);
    });
});

describe("the daily job", () => {
    const run = (query = "", secret = "test-cron-secret") => dailyJob(request(`/api/cron/daily${query}`, { headers: { authorization: `Bearer ${secret}` } }));

    it("clears out expired sign-ins and email links, and visits older than it keeps", async () => {
        const lena = await createCreator("lena");
        const userId = lena.user.id;
        await prisma.session.createMany({
            data: [
                { id: "expired", userId, expiresAt: new Date(Date.now() - DAY) },
                { id: "live", userId, expiresAt: new Date(Date.now() + DAY) },
            ],
        });
        await prisma.token.create({ data: { id: "used-up", userId, kind: "RESET_PASSWORD", expiresAt: new Date(Date.now() - DAY) } });
        const visit = { pageId: lena.page.id, type: "VIEW" as const, visitorId: "v", source: "direct", device: "mobile" };
        await prisma.event.createMany({ data: [{ ...visit, createdAt: new Date(Date.now() - (EVENT_DAYS + 1) * DAY) }, { ...visit, createdAt: new Date(Date.now() - 100 * DAY) }] });

        expect((await read(await run())).body.data.removed).toEqual({ sessions: 1, tokens: 1, events: 1 });
        expect(await prisma.session.findMany({ select: { id: true } })).toEqual([{ id: "live" }]);
        expect(await prisma.event.count()).toBe(1);
    });

    it("refuses to run without the secret", async () => {
        expect((await run("", "wrong")).status).toBe(401);
        expect((await dailyJob(request("/api/cron/daily"))).status).toBe(401);
    });

    it("reminds a creator about enquiries waiting over a day, once", async () => {
        const lena = await createCreator("lena");
        const old = new Date(Date.now() - 2 * DAY);
        await prisma.enquiry.createMany({
            data: [
                { pageId: lena.page.id, name: "Priya", email: "p@example.com", message: "Hi", createdAt: old },
                { pageId: lena.page.id, name: "Arjun", email: "a@example.com", message: "Hi", createdAt: old },
                // an hour old: too soon to nag
                { pageId: lena.page.id, name: "Meera", email: "m@example.com", message: "Hi", createdAt: new Date(Date.now() - 60 * 60 * 1000) },
                // already answered
                { pageId: lena.page.id, name: "Dev", email: "d@example.com", message: "Hi", createdAt: old, status: "REPLIED" },
            ],
        });

        expect((await read(await run())).body.data.reminded).toBe(1);
        expect(emails).toHaveLength(1);
        expect(emails[0]).toMatchObject({ to: "lena@example.com", subject: "2 people are waiting to hear from you" });
        expect(emails[0].text).toContain("Priya");
        expect(emails[0].text).not.toContain("Meera");
        expect(emails[0].text).toContain("waiting 2 days");

        // the next morning: nothing new to say
        expect((await read(await run())).body.data.reminded).toBe(0);
        expect(emails).toHaveLength(1);
    });

    it("sends the weekly email to creators with news, and skips quiet weeks and those who turned it off", async () => {
        const busy = await createCreator("lena");
        await prisma.enquiry.create({ data: { pageId: busy.page.id, name: "Priya", email: "p@example.com", message: "Hi", service: "Portraits" } });
        await createCreator("quiet");
        const off = await createCreator("off");
        await prisma.user.update({ where: { id: off.user.id }, data: { weeklyEmail: false } });
        await prisma.enquiry.create({ data: { pageId: off.page.id, name: "Sam", email: "s@example.com", message: "Hi" } });

        expect((await read(await run("?weekly=1"))).body.data.weekly).toBe(1);
        expect(emails.map((email) => email.to)).toEqual(["lena@example.com"]);
        expect(emails[0].subject).toBe("Your week: 0 visitors, 1 enquiry, 0 booked");
        expect(emails[0].text).toContain("1 enquiry is still open.");
    });
});

describe("analytics", () => {
    it("counts views, clicks and different visitors in the range, and the range before it apart", async () => {
        const lena = await createCreator("lena");
        const at = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY);
        const event = (type: "VIEW" | "CLICK", visitorId: string, daysAgo: number) => ({ pageId: lena.page.id, type, visitorId, source: "direct", device: "mobile", createdAt: at(daysAgo) });
        await prisma.event.createMany({
            data: [
                // this week: three views from two people, one click
                event("VIEW", "a", 1),
                event("VIEW", "a", 1),
                event("VIEW", "b", 2),
                event("CLICK", "a", 1),
                // the week before
                event("VIEW", "c", 9),
            ],
        });

        const stats = await pageStats(lena.page.id, 7);
        expect(stats.current).toMatchObject({ views: 3, visitors: 2, clicks: 1 });
        expect(stats.previous).toMatchObject({ views: 1, visitors: 1, clicks: 0 });
    });
});
