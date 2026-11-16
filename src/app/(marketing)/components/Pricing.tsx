import { IconCheck } from "@tabler/icons-react";

import { Pill } from "./Pill";
import { featuresOf, PRO_PLANS } from "@/lib/plans";
import { formatMoney } from "@/lib/utils/format";

// Read from src/lib/plans.ts (features and prices), so this never promises what the app doesn't do. While nothing is
// Pro yet, the Pro card says so instead of a price, and both buttons just start a free page.
const proFeatures = featuresOf(true);
const PLANS = [
    {
        name: "Free",
        price: "₹0",
        per: "forever",
        blurb: "Everything to get a good page live.",
        features: ["One page", "Unlimited links & blocks", "Every template", "A QR code for your page", ...featuresOf(false)],
        cta: "Start free",
    },
    {
        name: "Pro",
        price: proFeatures.length ? formatMoney(PRO_PLANS.monthly.price, "INR") : "Soon",
        per: proFeatures.length ? `a month, or ${formatMoney(PRO_PLANS.yearly.price, "INR")} a year` : "",
        blurb: proFeatures.length ? "Only your name on your page." : "Extras for pages that do real work are on the way. Until then, it's all free.",
        features: ["Everything in Free", ...(proFeatures.length ? proFeatures : ["More on the way"])],
        cta: proFeatures.length ? "Go Pro" : "Start free",
        highlight: true,
    },
];

export function Pricing() {
    return (
        <section id="pricing" aria-labelledby="pricing-title" className="bg-shell pb-28 text-forest lg:pb-44">
            <div className="mx-auto max-w-[1360px] px-5 lg:px-10">
                <div className="grid gap-8 border-t border-forest/15 pt-28 lg:grid-cols-12 lg:items-end lg:gap-6 lg:pt-44">
                    <h2 id="pricing-title" data-heading className="font-(family-name:--font-anton) text-[clamp(3.25rem,1.5rem+5vw,7.5rem)] leading-[0.9] uppercase lg:col-span-8">
                        <span className="block">Free to start.</span>
                        <span className="block text-pink">Simple to grow.</span>
                    </h2>
                    <p data-rise className="max-w-sm text-[18px] leading-relaxed text-ink/70 lg:col-span-4 lg:pb-3">
                        No trials, no card to get going. Upgrade when your page starts working harder than you do.
                    </p>
                </div>

                <div className="mt-16 grid max-w-[980px] grid-cols-1 items-start gap-5 lg:mt-24 lg:grid-cols-2">
                    {PLANS.map((plan) => (
                        <article
                            key={plan.name}
                            data-rise
                            className={`flex flex-col rounded-[2rem] p-8 sm:p-10 ${plan.highlight ? "bg-forest text-white [--focus:var(--color-rose)]" : "bg-paper text-ink"}`}
                        >
                            <h3 className="flex items-center justify-between text-[18px] font-bold">
                                {plan.name}
                                {plan.highlight && <span className="rounded-full bg-rose px-3 py-1 text-[12px] text-forest">{proFeatures.length ? "Most popular" : "Coming soon"}</span>}
                            </h3>
                            <p className="mt-8 flex items-baseline gap-2">
                                <span className="font-(family-name:--font-anton) text-[72px] leading-none">{plan.price}</span>
                                <span className={`text-[15px] ${plan.highlight ? "text-white/70" : "text-ink/60"}`}>{plan.per}</span>
                            </p>
                            <p className={`mt-3 text-[15px] ${plan.highlight ? "text-white/80" : "text-ink/70"}`}>{plan.blurb}</p>
                            <ul className={`mt-8 flex flex-col gap-3.5 border-t pt-8 text-[15px] ${plan.highlight ? "border-white/15" : "border-ink/10"}`}>
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center gap-3">
                                        <IconCheck size={17} className={plan.highlight ? "text-rose" : "text-pink"} />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <Pill href="/register" tone={plan.highlight ? "pink" : "forest"} className="mt-10 w-full">
                                {plan.cta}
                            </Pill>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}
