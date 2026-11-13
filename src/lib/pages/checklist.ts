import type { PageDoc } from "@/lib/validations/page";
import { safeHref } from "./links";
import { STARTER_THEME } from "./blocks";

// The first-run checklist in the sidebar: what a page needs before it's worth sharing.
// Worked out from the saved page itself, so there's nothing extra to store or keep in sync.
export function setupChecklist(page: PageDoc, published: boolean) {
    const links = page.blocks.filter((block) => block.type === "link" && safeHref(block.url));

    const steps = [
        { label: "Add a photo", done: !!safeHref(page.profile.avatar) },
        { label: "Write a short bio", done: page.profile.bio.trim().length > 0 },
        { label: "Add three links", done: links.length >= 3 },
        { label: "Add a social profile", done: page.profile.socials.some((social) => safeHref(social.url)) },
        // anything other than the look every new page starts with
        { label: "Make the look yours", done: JSON.stringify(page.theme) !== JSON.stringify(STARTER_THEME) },
        { label: "Publish your page", done: published },
    ];

    return { steps, done: steps.filter((step) => step.done).length };
}
