import type { PageDoc } from "@/lib/validations/page";
import { hasCaseStudy } from "@/lib/pages/links";

export type Plan = "FREE" | "PRO";

// What Pro costs, in whole rupees, and how long each payment lasts. Paid once per period through
// Razorpay (src/lib/billing.ts), in INR only for now. Change prices here.
export const PRO_PLANS = {
    monthly: { price: 249, days: 30 },
    yearly: { price: 1999, days: 365 },
} as const;
export type BillingPeriod = keyof typeof PRO_PLANS;
export const BILLING_PERIODS = Object.keys(PRO_PLANS) as BillingPeriod[];

const DAY = 24 * 60 * 60 * 1000;

// The plan an account is on right now: Pro runs out at proUntil (none: made Pro by hand, no end)
export const planNow = (plan: Plan, proUntil: Date | null, now = new Date()): Plan => (plan === "PRO" && (!proUntil || proUntil > now) ? "PRO" : "FREE");

// Pro paid for a period: from when the current one ends if it's still running, otherwise from now,
// so paying early never loses days
export function proUntilAfter(period: BillingPeriod, current: Date | null, now = new Date()) {
    const from = current && current > now ? current : now;
    return new Date(from.getTime() + PRO_PLANS[period].days * DAY);
}

// Everything that could become a Pro feature, and whether it is one. Only the badge is, for now:
// the rest stays free while Roselle is new. Deciding later is flipping `pro` here; publishing, the analytics
// screen and the pricing section on the landing page all read this list.
// `usedBy` says whether a page uses it, which is how publishing checks a free page.
export const FEATURES = {
    // the "Composed with Roselle" line at the foot of the page. Nothing to remove before publishing:
    // a free page just shows it (PageRenderer's `badge`).
    noBadge: { label: "No Roselle badge on your page", pro: true, usedBy: () => false },
    photoBackground: { label: "Photo backgrounds", pro: false, usedBy: (page: PageDoc) => page.theme.background.kind === "image" },
    patterns: { label: "Printed pattern backgrounds", pro: false, usedBy: (page: PageDoc) => page.theme.background.kind === "pattern" },
    scheduling: { label: "Scheduled links", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.startsAt || block.endsAt) },
    seo: { label: "SEO & share cards", pro: false, usedBy: (page: PageDoc) => !!(page.seo.title || page.seo.description) },
    music: { label: "Music players", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "music") },
    maps: { label: "Maps", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "map") },
    tips: { label: "Tips & payments", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "tip") },
    caseStudies: { label: "Project case studies", pro: false, usedBy: (page: PageDoc) => page.blocks.some(hasCaseStudy) },
    services: { label: "Services with Enquire buttons", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "services") },
    reviews: { label: "Verified client reviews", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "reviews") },
    contactForm: { label: "Contact form & booking inbox", pro: false, usedBy: (page: PageDoc) => page.blocks.some((block) => block.type === "contact") },
    longAnalytics: { label: "90-day analytics", pro: false, usedBy: () => false },
} as const;

export type Feature = keyof typeof FEATURES;

export const can = (plan: Plan, feature: Feature) => plan === "PRO" || !FEATURES[feature].pro;

// The Pro features this page uses that this plan doesn't have, by name, for the "can't publish" message
export function lockedFeatures(page: PageDoc, plan: Plan) {
    return (Object.keys(FEATURES) as Feature[]).filter((key) => !can(plan, key) && FEATURES[key].usedBy(page)).map((key) => FEATURES[key].label);
}

// What the pricing section lists under each plan
export const featuresOf = (pro: boolean) => Object.values(FEATURES).filter((feature) => feature.pro === pro).map((feature) => feature.label);
