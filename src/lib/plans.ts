import type { PageDoc } from "@/lib/validations/page";
import { hasCaseStudy } from "@/lib/pages/links";

export type Plan = "FREE" | "PRO";

// Everything that could become a Pro feature, and whether it is one. None are yet: Roselle is
// free while it's new. Deciding later is flipping `pro` to true here; publishing, the analytics
// screen and the pricing section on the landing page all read this list.
// `usedBy` says whether a page uses it, which is how publishing checks a free page.
export const FEATURES = {
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
