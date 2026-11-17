import type { PageDoc } from "@/lib/validations/page";
import { hasCaseStudy, safeHref, socialHref } from "./links";

// The first-run checklist in the sidebar: what a page needs before it's worth sharing.
// Worked out from the saved page itself, so there's nothing extra to store or keep in sync.
export function setupChecklist(page: PageDoc, published: boolean) {
    const { blocks } = page;
    // the work itself: photos in a gallery, a picture, or a project with a cover or a story
    const showsWork = blocks.some(
        (block) =>
            (block.type === "gallery" && block.images.some((image) => safeHref(image.src))) ||
            (block.type === "image" && safeHref(block.src)) ||
            (block.type === "project" && (safeHref(block.image) || hasCaseStudy(block))),
    );
    // a way to become a client: a service to enquire about, the contact form, or a working link
    const canBeHired = blocks.some(
        (block) => block.type === "contact" || (block.type === "services" && block.items.some((item) => item.name.trim())) || (block.type === "link" && safeHref(block.url)),
    );

    const steps = [
        { label: "Add a photo of you", done: !!safeHref(page.profile.avatar) },
        { label: "Write a short bio", done: page.profile.bio.trim().length > 0 },
        { label: "Show your work", done: showsWork },
        { label: "Say how to hire you", done: canBeHired },
        { label: "Add a social profile", done: page.profile.socials.some((social) => socialHref(social.platform, social.url)) },
        { label: "Publish your page", done: published },
    ];

    return { steps, done: steps.filter((step) => step.done).length };
}
