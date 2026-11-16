import { cache } from "react";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { pageSchema } from "@/lib/validations/page";
import { planNow } from "@/lib/plans";

// Public pages are rendered once and kept (see src/app/[username]/page.tsx); after anything a
// visitor would see changes, this makes the next visit render it fresh
export function refreshPublicPage(username: string) {
    revalidatePath(`/${username}`);
    revalidatePath(`/${username}/opengraph-image`);
    // and its case studies. Next.js can only refresh a pattern of pages, so this refreshes every
    // case study (each re-renders on its next visit), which is cheap at this size.
    // ponytail: per-page refresh via revalidateTag if there are ever thousands of case studies
    revalidatePath("/[username]/work/[id]", "page");
}

// A page as visitors see it: the published version, or null when there's no such page or it
// was never published. cache(): the page, its metadata and its share image all ask for it.
export const getPublishedPage = cache(async (username: string) => {
    const page = await prisma.page.findUnique({
        where: { username: username.toLowerCase() },
        select: { id: true, username: true, published: true, suspendedAt: true, user: { select: { plan: true, proUntil: true } } },
    });

    // a page an admin took down is gone for visitors, as if it never existed
    const published = pageSchema.safeParse(page?.published);
    if (!page || !published.success || page.suspendedAt) return null;

    // pro: no Roselle badge on it
    return { id: page.id, username: page.username, doc: published.data, pro: planNow(page.user.plan, page.user.proUntil) === "PRO" };
});
