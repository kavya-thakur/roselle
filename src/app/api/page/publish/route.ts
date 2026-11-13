import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";
import { refreshPublicPage } from "@/lib/pages/publish";
import { lockedFeatures } from "@/lib/plans";
import { pageSchema } from "@/lib/validations/page";

// Makes the draft what visitors see. It copies what's already saved, not what the browser
// sends, so the page that goes live is exactly the one that passed validation.
export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const page = await prisma.page.findUniqueOrThrow({ where: { id: user.page.id }, select: { draft: true, suspendedAt: true, suspendedReason: true } });

        if (page.suspendedAt) {
            return NextResponse.json({ ok: false, message: `Your page was taken down: ${page.suspendedReason ?? "it broke our rules"}. Contact us if you think this is a mistake.` }, { status: 403 });
        }

        // a free page can try Pro features in the editor, but can't put them live
        const draft = pageSchema.safeParse(page.draft);
        const locked = draft.success ? lockedFeatures(draft.data, user.plan) : [];
        if (locked.length) {
            return NextResponse.json({ ok: false, message: `${locked.join(", ")} ${locked.length === 1 ? "is" : "are"} part of Pro. Remove ${locked.length === 1 ? "it" : "them"} to publish.` }, { status: 402 });
        }

        const published = await prisma.page.update({
            where: { id: user.page.id },
            data: { published: page.draft ?? undefined, publishedAt: new Date() },
            select: { publishedAt: true },
        });

        refreshPublicPage(user.page.username);

        return NextResponse.json({ ok: true, data: published });
    } catch (error) {
        return handleRouteError(error, "Publish");
    }
}
