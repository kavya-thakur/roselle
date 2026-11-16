"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck, IconCrown } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { LocalTime } from "@/components/LocalTime";
import { toast } from "@/components/Toast";
import { api } from "@/lib/api/client";
import { PRO_PLANS, type BillingPeriod, type Plan } from "@/lib/plans";
import { formatMoney } from "@/lib/utils/format";

export interface Billing {
    // the plan right now: Pro that has run out is already Free here
    plan: Plan;
    // false until the Razorpay keys are set: Pro shows as coming soon
    enabled: boolean;
    // when paid Pro ends (or ended); null for Pro given by hand, or never paid
    proUntil: string | null;
    payments: { id: number; createdAt: string; amount: number; period: string; razorpayPaymentId: string }[];
}

// What Razorpay's checkout script puts on window
type Checkout = new (options: object) => { open: () => void; on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void };
declare global {
    interface Window {
        Razorpay?: Checkout;
    }
}

// Razorpay's checkout, loaded the first time someone presses Pay rather than on every visit
function loadCheckout() {
    return new Promise<Checkout>((resolve, reject) => {
        if (window.Razorpay) return resolve(window.Razorpay);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("The payment window didn't load. Please try again.")));
        script.onerror = () => reject(new Error("Couldn't load the payment window. Check your connection, or turn off an ad blocker for this page."));
        document.body.appendChild(script);
    });
}

const rupees = (amount: number) => formatMoney(amount, "INR");
// dates go through LocalTime: the server and the browser can be in different time zones and languages
const day = (iso: string) => <LocalTime iso={iso} format="date" />;
const DAY = 24 * 60 * 60 * 1000;
// what a year saves, against twelve months
const YEARLY_SAVING = Math.round((1 - PRO_PLANS.yearly.price / (PRO_PLANS.monthly.price * 12)) * 100);

// Free or Pro, and paying for it: a month or a year at a time, no automatic renewal. Paying while
// on Pro adds on to the time left. Pro, for now, is one thing: no Roselle badge on the page.
export function PlanSection({ billing, email }: { billing: Billing; email: string }) {
    const router = useRouter();
    const [period, setPeriod] = useState<BillingPeriod>("yearly");
    const [busy, setBusy] = useState(false);
    const { plan, enabled, proUntil, payments } = billing;
    // read once, when the section first draws
    const [now] = useState(() => Date.now());
    const pro = plan === "PRO";
    const daysLeft = pro && proUntil ? Math.max(0, Math.ceil((new Date(proUntil).getTime() - now) / DAY)) : null;
    const ended = !pro && proUntil ? proUntil : null;

    async function pay() {
        setBusy(true);
        try {
            const [Razorpay, order] = await Promise.all([loadCheckout(), api<{ orderId: string; amount: number; keyId: string; description: string; email: string }>("/billing/order", { method: "POST", body: { period } })]);
            const checkout = new Razorpay({
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: "INR",
                name: "Roselle Pro",
                description: order.description,
                prefill: { email },
                theme: { color: "#0b4d2c" },
                // paid: checked on our server before anything changes
                handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    try {
                        await api("/billing/verify", { method: "POST", body: { orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature } });
                        toast(pro ? "Pro renewed" : "Welcome to Pro", { detail: pro ? "The new time is added to what you had left." : "The Roselle badge is gone from your page. A receipt is on its way to your email." });
                        router.refresh();
                    } catch (error) {
                        toast.error("Payment not confirmed yet", (error as Error).message);
                    } finally {
                        setBusy(false);
                    }
                },
                modal: { ondismiss: () => setBusy(false) },
            });
            checkout.on("payment.failed", (response) => toast.error("The payment didn't go through", response.error?.description || "Nothing was charged. Try again, or use another card or UPI app."));
            checkout.open();
        } catch (error) {
            toast.error("Couldn't start the payment", (error as Error).message);
            setBusy(false);
        }
    }

    const periods = (
        <div role="radiogroup" aria-label="How long to pay for" className="grid gap-2 sm:grid-cols-2">
            {(["yearly", "monthly"] as const).map((option) => (
                <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={period === option}
                    onClick={() => setPeriod(option)}
                    className={`relative rounded-xl border-2 p-4 text-left transition ${period === option ? "border-ink bg-sand/40" : "border-line hover:border-line-strong"}`}
                >
                    <span className="block text-sm font-semibold">{option === "yearly" ? "A year" : "A month"}</span>
                    <span className="mt-1 block font-display text-2xl">
                        {rupees(PRO_PLANS[option].price)}
                        <span className="ml-1 font-sans text-sm text-muted">/{option === "yearly" ? "year" : "month"}</span>
                    </span>
                    {option === "yearly" && <span className="absolute top-3 right-3 rounded-full bg-pink px-2 py-0.5 text-[11px] font-semibold text-white">Save {YEARLY_SAVING}%</span>}
                    {period === option && <IconCheck size={16} className="absolute right-3 bottom-3 text-ink" />}
                </button>
            ))}
        </div>
    );

    const history = payments.length > 0 && (
        <details className="mt-5 border-t border-line pt-4 text-sm">
            <summary className="cursor-pointer font-semibold text-muted hover:text-ink">Payments</summary>
            <ul className="mt-3 divide-y divide-line">
                {payments.map((payment) => (
                    <li key={payment.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 py-2">
                        <span>
                            {day(payment.createdAt)} · Pro for a {payment.period === "yearly" ? "year" : "month"}
                        </span>
                        <span className="font-semibold tabular-nums">{rupees(payment.amount / 100)}</span>
                        <span className="w-full text-xs text-muted">{payment.razorpayPaymentId}</span>
                    </li>
                ))}
            </ul>
        </details>
    );

    if (pro) {
        return (
            <section id="plan" className="mt-6 scroll-mt-6 rounded-2xl border border-line bg-paper p-6 shadow-soft">
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <IconCrown size={20} className="text-pink" /> You&apos;re on Pro
                </h2>
                <p className="mt-1 text-sm text-muted">Your page has no Roselle badge. Thank you for supporting Roselle.</p>

                {proUntil && daysLeft !== null && (
                    <>
                        <p className={`mt-4 rounded-xl px-3.5 py-2.5 text-sm ${daysLeft <= 7 ? "bg-blush text-pink" : "bg-sand/60"}`}>
                            Pro until <span className="font-semibold">{day(proUntil)}</span> ({daysLeft === 1 ? "1 day" : `${daysLeft} days`} left). It doesn&apos;t renew by itself: we&apos;ll email you a week before.
                        </p>
                        {enabled && (
                            <div className="mt-5">
                                <p className="mb-2 text-sm font-semibold">Renew now</p>
                                {periods}
                                <Button busy={busy} onClick={pay} className="mt-3 w-full sm:w-auto">
                                    Add a {period === "yearly" ? "year" : "month"} for {rupees(PRO_PLANS[period].price)}
                                </Button>
                                <p className="mt-2 text-xs text-muted">Added on after {day(proUntil)}, so no days are lost.</p>
                            </div>
                        )}
                    </>
                )}
                {history}
            </section>
        );
    }

    return (
        <section id="plan" className="mt-6 scroll-mt-6 overflow-hidden rounded-2xl border border-line bg-paper shadow-soft">
            <div className="bg-forest p-6 text-white">
                <p className="flex items-center gap-2 text-sm font-semibold text-rose">
                    <IconCrown size={18} /> Roselle Pro
                </p>
                <h2 className="mt-2 font-display text-3xl">Make the page all yours</h2>
                <p className="mt-2 text-sm text-white/75">Pro takes the &ldquo;Composed with Roselle&rdquo; badge off the foot of your page and its case studies, so it&apos;s only your name on it.</p>
            </div>

            <div className="p-6">
                {ended && (
                    <p role="status" className="mb-4 rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        Your Pro ended on {day(ended)}, so the badge is back. Pay again to take it off.
                    </p>
                )}

                {enabled ? (
                    <>
                        {periods}
                        <Button size="large" busy={busy} onClick={pay} className="mt-4 w-full">
                            Pay {rupees(PRO_PLANS[period].price)} and go Pro
                        </Button>
                        <p className="mt-3 text-center text-xs text-muted">One payment by UPI, card or netbanking, through Razorpay. Nothing renews by itself.</p>
                    </>
                ) : (
                    <p className="text-sm text-muted">Pro opens soon, at {rupees(PRO_PLANS.monthly.price)} a month. Until then, everything else on Roselle is free.</p>
                )}
                {history}
            </div>
        </section>
    );
}
