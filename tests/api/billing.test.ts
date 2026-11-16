import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { POST as order } from "@/app/api/billing/order/route";
import { POST as verify } from "@/app/api/billing/verify/route";
import { POST as webhook } from "@/app/api/billing/webhook/route";
import { GET as dailyJob } from "@/app/api/cron/daily/route";
import { getPublishedPage } from "@/lib/pages/publish";
import { NextRequest } from "next/server";
import { createCreator, emails, read, request, settle, signInAs, signOut } from "./helpers";

// A pretend Razorpay: orders and payments kept in memory, answering the calls billing.ts makes.
// Everything on our side (routes, signatures, database) is real.
const SECRET = "test-key-secret";
const HOOK_SECRET = "test-webhook-secret";
const DAY = 24 * 60 * 60 * 1000;

type FakeOrder = { id: string; amount: number; currency: string; notes: Record<string, string> };
type FakePayment = { id: string; order_id: string; amount: number; currency: string; status: string };
let orders: Map<string, FakeOrder>;
let payments: Map<string, FakePayment>;
let count = 0;

function fakeRazorpay(url: string, init: RequestInit = {}) {
    const path = url.replace("https://api.razorpay.com/v1", "");
    const body = init.body ? JSON.parse(String(init.body)) : {};
    const json = (data: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(data), { status }));

    if (path === "/orders" && init.method === "POST") {
        const created = { id: `order_${++count}`, amount: body.amount, currency: body.currency, notes: body.notes };
        orders.set(created.id, created);
        return json(created);
    }
    const [, kind, id, action] = path.split("/");
    const found = kind === "orders" ? orders.get(id) : payments.get(id);
    if (!found) return json({ error: { description: "The id provided does not exist" } }, 400);
    if (action === "capture") Object.assign(found, { status: "captured" });
    return json(found);
}

// the customer paying an order in Razorpay's window
function customerPays(orderId: string, { status = "captured", amount }: { status?: string; amount?: number } = {}) {
    const paid = { id: `pay_${++count}`, order_id: orderId, amount: amount ?? orders.get(orderId)!.amount, currency: "INR", status };
    payments.set(paid.id, paid);
    return { paymentId: paid.id, signature: createHmac("sha256", SECRET).update(`${orderId}|${paid.id}`).digest("hex") };
}

beforeEach(() => {
    process.env.RAZORPAY_KEY_ID = "rzp_test_key";
    process.env.RAZORPAY_KEY_SECRET = SECRET;
    process.env.RAZORPAY_WEBHOOK_SECRET = HOOK_SECRET;
    orders = new Map();
    payments = new Map();
    vi.stubGlobal("fetch", vi.fn(fakeRazorpay));
});
afterEach(() => {
    vi.unstubAllGlobals();
    process.env.RAZORPAY_KEY_ID = "";
    process.env.RAZORPAY_KEY_SECRET = "";
    process.env.RAZORPAY_WEBHOOK_SECRET = "";
});

const startPaying = async (period = "monthly") => read(await order(request("/api/billing/order", { method: "POST", body: { period } })));
const confirm = (orderId: string, paid: { paymentId: string; signature: string }) => verify(request("/api/billing/verify", { method: "POST", body: { orderId, ...paid } }));
const hook = (event: string, orderId: string, paymentId: string, signature?: string) => {
    const body = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId } } } });
    return webhook(new NextRequest("http://localhost:3000/api/billing/webhook", { method: "POST", body, headers: { "x-razorpay-signature": signature ?? createHmac("sha256", HOOK_SECRET).update(body).digest("hex") } }));
};
const userOf = (id: number) => prisma.user.findUniqueOrThrow({ where: { id } });
const daysFromNow = (date: Date | null) => Math.round((date!.getTime() - Date.now()) / DAY);

async function lenaSignedIn() {
    const lena = await createCreator("lena");
    await signInAs(lena.user.id);
    return lena;
}

describe("paying for Pro", () => {
    it("makes an order for the price; once the payment checks out with Razorpay, Pro runs a month, the badge goes and a receipt is emailed", async () => {
        const lena = await lenaSignedIn();
        expect((await getPublishedPage("lena"))!.pro).toBe(false);

        const started = await startPaying();
        expect(started.status).toBe(200);
        expect(started.body.data).toMatchObject({ amount: 24900, keyId: "rzp_test_key" });
        expect(orders.get(started.body.data.orderId)!.notes).toEqual({ userId: String(lena.user.id), period: "monthly" });

        // a card payment the bank authorised: Roselle captures it, or Razorpay would hand it back
        const paid = customerPays(started.body.data.orderId, { status: "authorized" });
        expect((await confirm(started.body.data.orderId, paid)).status).toBe(200);
        expect(payments.get(paid.paymentId)!.status).toBe("captured");

        const after = await userOf(lena.user.id);
        expect(after.plan).toBe("PRO");
        expect(daysFromNow(after.proUntil)).toBe(30);
        expect(await prisma.payment.findMany()).toMatchObject([{ userId: lena.user.id, amount: 24900, period: "monthly" }]);
        expect((await getPublishedPage("lena"))!.pro).toBe(true);
        expect(emails).toHaveLength(1);
        expect(emails[0]).toMatchObject({ to: "lena@example.com", subject: "Payment received: Roselle Pro, ₹249" });
    });

    it("refuses a made-up result: a wrong signature, someone else's order, or less than the price", async () => {
        const lena = await lenaSignedIn();
        const mine = (await startPaying()).body.data.orderId;

        const forged = await read(await confirm(mine, { paymentId: "pay_x", signature: "0".repeat(64) }));
        expect(forged.status).toBe(400);
        expect(forged.body.message).toContain("couldn't confirm");

        // paid less than the order (a tampered checkout)
        expect((await confirm(mine, customerPays(mine, { amount: 100 }))).status).toBe(400);

        // a real payment, for another account's order
        const arjun = await createCreator("arjun");
        await signInAs(arjun.user.id);
        const theirs = (await startPaying()).body.data.orderId;
        const paid = customerPays(theirs);
        await signInAs(lena.user.id);
        expect((await confirm(theirs, paid)).status).toBe(400);

        expect((await userOf(lena.user.id)).plan).toBe("FREE");
        expect(await prisma.payment.count()).toBe(0);
    });

    it("counts a payment once when both the browser and the webhook report it", async () => {
        const lena = await lenaSignedIn();
        const orderId = (await startPaying("yearly")).body.data.orderId;
        const paid = customerPays(orderId);

        await confirm(orderId, paid);
        const first = (await userOf(lena.user.id)).proUntil;
        expect(daysFromNow(first)).toBe(365);
        expect((await read(await hook("payment.captured", orderId, paid.paymentId))).body).toMatchObject({ ok: true, alreadyCounted: true });
        await settle();

        expect((await userOf(lena.user.id)).proUntil).toEqual(first);
        expect(await prisma.payment.count()).toBe(1);
        expect(emails).toHaveLength(1);
    });

    it("the webhook alone switches Pro on when the payer's browser closed first; a forged one is refused", async () => {
        const lena = await lenaSignedIn();
        const orderId = (await startPaying()).body.data.orderId;
        const paid = customerPays(orderId);
        signOut();

        expect((await hook("order.paid", orderId, paid.paymentId, "forged")).status).toBe(400);
        expect((await userOf(lena.user.id)).plan).toBe("FREE");

        expect((await hook("order.paid", orderId, paid.paymentId)).status).toBe(200);
        expect((await userOf(lena.user.id)).plan).toBe("PRO");

        // another app's payment on the same Razorpay account: acknowledged, nothing done
        orders.set("order_other", { id: "order_other", amount: 50000, currency: "INR", notes: { invoice: "42" } });
        const other = customerPays("order_other");
        expect((await read(await hook("payment.captured", "order_other", other.paymentId))).body.ignored).toContain("isn't for Roselle Pro");
    });

    it("paying again while on Pro adds on, so no days are lost", async () => {
        const lena = await lenaSignedIn();
        let orderId = (await startPaying()).body.data.orderId;
        await confirm(orderId, customerPays(orderId));
        orderId = (await startPaying("yearly")).body.data.orderId;
        await confirm(orderId, customerPays(orderId));
        expect(daysFromNow((await userOf(lena.user.id)).proUntil)).toBe(395);
    });

    it("says Pro is coming soon while there are no Razorpay keys", async () => {
        process.env.RAZORPAY_KEY_ID = "";
        await lenaSignedIn();
        expect((await startPaying()).status).toBe(503);
    });
});

describe("when Pro runs out", () => {
    const runDailyJob = () => dailyJob(request("/api/cron/daily", { headers: { authorization: "Bearer test-cron-secret" } }));

    it("the page gets its badge back on its own; Pro given by hand (no end date) never runs out", async () => {
        const lena = await createCreator("lena");
        await prisma.user.update({ where: { id: lena.user.id }, data: { plan: "PRO", proUntil: new Date(Date.now() - 1000) } });
        expect((await getPublishedPage("lena"))!.pro).toBe(false);

        const arjun = await createCreator("arjun");
        await prisma.user.update({ where: { id: arjun.user.id }, data: { plan: "PRO", proUntil: null } });
        expect((await getPublishedPage("arjun"))!.pro).toBe(true);
    });

    it("emails a week before, the day before and when it ends, each once", async () => {
        const lena = await createCreator("lena");
        // the daily job sends other emails too (on Mondays, the weekly one)
        const proEmails = () => emails.filter((email) => email.subject.includes("Roselle Pro"));
        const endsIn = (days: number) => prisma.user.update({ where: { id: lena.user.id }, data: { plan: "PRO", proUntil: new Date(Date.now() + days * DAY - 60_000) } });

        await endsIn(5);
        await runDailyJob();
        await runDailyJob();
        expect(proEmails().map((email) => email.subject)).toEqual(["Your Roselle Pro ends in 5 days"]);

        await endsIn(1);
        await runDailyJob();
        expect(proEmails().at(-1)!.subject).toBe("Your Roselle Pro ends tomorrow");

        await endsIn(0);
        await runDailyJob();
        expect(proEmails().at(-1)!.subject).toBe("Your Roselle Pro has ended");
        expect(proEmails().at(-1)!.text).toContain("/settings#plan");
        await runDailyJob();
        expect(proEmails()).toHaveLength(3);
    });
});
