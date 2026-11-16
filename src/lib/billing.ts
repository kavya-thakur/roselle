import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { sendEmail } from "@/lib/email/send";
import { refreshPublicPage } from "@/lib/pages/publish";
import { BILLING_PERIODS, PRO_PLANS, proUntilAfter, type BillingPeriod } from "@/lib/plans";
import { SITE_URL } from "@/lib/site";
import { formatMoney } from "@/lib/utils/format";

// Paying for Pro with Razorpay Standard Checkout, a month or a year at a time (no automatic
// renewal, so no Razorpay Subscriptions to switch on), the way the crm project does it:
//  1. Upgrade makes a Razorpay order for the price, noting whose it is and for how long (createOrder)
//  2. the browser opens Razorpay's payment window with it
//  3. Razorpay hands the browser a payment id and a signature, checked here with the secret; then
//     the order and payment are read back from Razorpay itself (settlePayment), so the price and
//     period come from Razorpay, never from the browser, and only then is the account Pro.
// Razorpay's webhook (payment.captured, order.paid) does step 3 too, so Pro still starts when the
// payer's browser closed first. Whichever arrives first counts the payment; the other finds it done.
// A few days before Pro ends, an email reminds them to pay again (remindEndingPro).
//
// Needs RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test keys start rzp_test_), and for the webhook
// RAZORPAY_WEBHOOK_SECRET. Without the keys, Settings says Pro is coming soon.

export const billingEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// Razorpay didn't answer, or refused: worth trying again
export class RazorpayProblem extends Error {}
// The payment isn't one that makes this account Pro: not worth trying again
export class PaymentProblem extends Error {}

async function razorpay<T>(path: string, init: { method?: "GET" | "POST"; body?: object } = {}): Promise<T> {
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const res = await fetch(`https://api.razorpay.com/v1${path}`, {
        method: init.method ?? "GET",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: init.body ? JSON.stringify(init.body) : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        // 401: the keys are wrong; anything else: Razorpay's own reason
        throw new RazorpayProblem(res.status === 401 ? "Razorpay didn't accept the keys (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)" : (data?.error?.description ?? `Razorpay answered ${res.status}`));
    }
    return data as T;
}

interface Order {
    id: string;
    amount: number;
    currency: string;
    notes: Record<string, string> | [];
}

interface Payment {
    id: string;
    order_id: string | null;
    amount: number;
    currency: string;
    // "authorized" (the bank said yes, money not taken yet), "captured" (taken), "failed", "refunded"
    status: string;
}

// An order for a period of Pro, at its price in paise, noting whose it is
export function createOrder(userId: number, period: BillingPeriod) {
    return razorpay<Order>("/orders", {
        method: "POST",
        body: { amount: PRO_PLANS[period].price * 100, currency: "INR", receipt: `roselle-${userId}-${Date.now()}`, notes: { userId: String(userId), period } },
    });
}

// Checkout's proof of payment: an HMAC of "<order id>|<payment id>" with the key secret
export function checkoutSignatureValid(orderId: string, paymentId: string, signature: string) {
    return sameHex(createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "").update(`${orderId}|${paymentId}`).digest("hex"), signature);
}

// A webhook's proof it came from Razorpay: an HMAC of the exact body with the webhook secret
export function webhookSignatureValid(rawBody: string, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    return !!secret && sameHex(createHmac("sha256", secret).update(rawBody).digest("hex"), signature);
}

function sameHex(expected: string, given: string) {
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
}

// Turns a Razorpay payment into Pro, once. Everything is checked with Razorpay itself: the order is
// one of Roselle's, for this account (`forUser`, from the verify route), the payment is for that
// order, of its amount, in rupees, and the money is taken (an authorised one is captured now; left
// uncaptured, Razorpay would give it back while the account kept Pro).
export async function settlePayment(orderId: string, paymentId: string, forUser?: number) {
    const [order, found] = await Promise.all([razorpay<Order>(`/orders/${encodeURIComponent(orderId)}`), razorpay<Payment>(`/payments/${encodeURIComponent(paymentId)}`)]);

    const notes = Array.isArray(order.notes) ? {} : order.notes;
    const userId = Number(notes.userId);
    const period = notes.period as BillingPeriod;
    if (!userId || !BILLING_PERIODS.includes(period)) throw new PaymentProblem("This order isn't for Roselle Pro");
    if (forUser !== undefined && userId !== forUser) throw new PaymentProblem("This payment is for another account");
    if (found.order_id !== order.id || found.amount !== order.amount || found.currency !== "INR") throw new PaymentProblem("The payment doesn't match its order");

    // captured at the same moment by the other way in (the browser and the webhook together): look again
    const payment = found.status === "authorized" ? await razorpay<Payment>(`/payments/${found.id}/capture`, { method: "POST", body: { amount: found.amount, currency: found.currency } }).catch(() => razorpay<Payment>(`/payments/${found.id}`)) : found;
    if (payment.status !== "captured") throw new PaymentProblem(`The payment wasn't completed (${payment.status})`);

    try {
        const user = await prisma.$transaction(async (tx) => {
            const current = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, proUntil: true } });
            const proUntil = proUntilAfter(period, current.plan === "PRO" ? current.proUntil : null);
            // the payment id is unique: a second arrival of the same payment stops here, before adding time
            await tx.payment.create({ data: { userId, razorpayOrderId: order.id, razorpayPaymentId: payment.id, period, amount: payment.amount, paidUntil: proUntil } });
            return tx.user.update({ where: { id: userId }, data: { plan: "PRO", proUntil, billingReminderKey: null }, select: { email: true, proUntil: true, page: { select: { username: true } } } });
        });
        // the badge leaves their page straight away
        if (user.page) refreshPublicPage(user.page.username);
        // only here, where the payment was first counted, so a receipt never goes twice
        await sendEmail({
            to: user.email,
            subject: `Payment received: Roselle Pro, ${formatMoney(payment.amount / 100, "INR")}`,
            text: `Thank you! We've received ${formatMoney(payment.amount / 100, "INR")} for Roselle Pro (${period}).\n\nYour page has no Roselle badge until ${dateOf(user.proUntil!)}. We'll email you a few days before then.\n\nPayment: ${payment.id}\nOrder: ${order.id}\n\n${SITE_URL}/settings#plan`,
        }).catch((error) => console.error("Pro receipt email:", error));
        return { proUntil: user.proUntil, alreadyCounted: false };
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { proUntil: null, alreadyCounted: true };
        throw error;
    }
}

const dateOf = (date: Date) => date.toLocaleDateString("en-IN", { dateStyle: "long", timeZone: "Asia/Kolkata" });

// days before the end when a reminder goes; 0 is "it has ended"
const REMINDER_DAYS = [7, 1] as const;
const DAY = 24 * 60 * 60 * 1000;

// For the daily job: "Your Pro ends in 7 days" / "...tomorrow" / "...has ended", each once. The
// account keeps the last one sent (billingReminderKey); a new payment starts a fresh set.
export async function remindEndingPro(now = new Date()) {
    const accounts = await prisma.user.findMany({
        // ending in the next week, or ended in the last two days
        where: { plan: "PRO", proUntil: { gt: new Date(now.getTime() - 2 * DAY), lt: new Date(now.getTime() + REMINDER_DAYS[0] * DAY) } },
        select: { id: true, email: true, proUntil: true, billingReminderKey: true },
    });

    let sent = 0;
    for (const account of accounts) {
        const daysLeft = Math.max(0, Math.ceil((account.proUntil!.getTime() - now.getTime()) / DAY));
        // the closest step not passed yet: 5 days left is the 7-day reminder, 1 day left the 1-day one
        const step = daysLeft === 0 ? 0 : [...REMINDER_DAYS].reverse().find((days) => daysLeft <= days);
        if (step === undefined) continue;

        const key = `${account.proUntil!.toISOString().slice(0, 10)}:${step}`;
        if (key === account.billingReminderKey) continue;
        // claimed first, so two runs overlapping never send it twice
        const { count } = await prisma.user.updateMany({ where: { id: account.id, billingReminderKey: account.billingReminderKey }, data: { billingReminderKey: key } });
        if (count === 0) continue;

        const subject = step === 0 ? "Your Roselle Pro has ended" : `Your Roselle Pro ends ${daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`}`;
        const body =
            step === 0
                ? "The Roselle badge is back at the foot of your page. Everything else is just as you left it."
                : `On ${dateOf(account.proUntil!)} the Roselle badge comes back to your page. Renew to keep it off; paying early adds on to the time you have left.`;
        await sendEmail({ to: account.email, subject, text: `Hi,\n\n${body}\n\n${step === 0 ? "Go Pro again" : "Renew"}: ${SITE_URL}/settings#plan\n\nRoselle` }).catch((error) =>
            console.error("Pro reminder email:", error),
        );
        sent += 1;
    }
    return sent;
}
