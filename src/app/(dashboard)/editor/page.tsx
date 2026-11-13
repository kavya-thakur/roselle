import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { pageSchema } from "@/lib/validations/page";
import { starterPage } from "@/lib/pages/blocks";
import { getApprovedReviews } from "@/lib/reviews";
import { EditorView } from "./EditorView";

export const metadata: Metadata = {
    title: "Editor",
};

export default async function EditorPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const [page, clicks, reviews] = await Promise.all([
        prisma.page.findUniqueOrThrow({
            where: { id: user.page.id },
            select: { draft: true, published: true, publishedAt: true },
        }),
        // every click each link has had, shown on its card like a small receipt
        prisma.event.groupBy({ by: ["blockId"], where: { pageId: user.page.id, type: "CLICK" }, _count: true }),
        // so a Reviews block shows the real ones in the preview
        getApprovedReviews(user.page.id),
    ]);

    // Saved drafts always passed the schema, but parsing also fills in defaults for fields
    // added since; a draft that somehow doesn't fit starts over rather than breaking the editor
    const draft = pageSchema.safeParse(page.draft);
    const published = pageSchema.safeParse(page.published);

    return (
        <EditorView
            username={user.page.username}
            initialDraft={draft.success ? draft.data : starterPage(user.page.username)}
            initialPublished={published.success ? published.data : null}
            initialPublishedAt={page.publishedAt?.toISOString() ?? null}
            clicks={Object.fromEntries(clicks.map((row) => [row.blockId ?? "", row._count]))}
            reviews={reviews}
        />
    );
}
