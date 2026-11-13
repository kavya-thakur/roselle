import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordEvent } from "@/lib/analytics/track";
import { hasCaseStudy, isLive, targetOf } from "@/lib/pages/links";
import { pageSchema } from "@/lib/validations/page";

// Every link on a public page points here first: count the click, then send the visitor on.
// The address comes from the published page, never from the URL, so this can't be used to
// bounce people to some other site.
export async function GET(req: NextRequest, { params }: RouteContext<"/go/[pageId]/[blockId]">) {
    const { pageId, blockId } = await params;
    const id = Number(pageId);

    const page = Number.isInteger(id) && id > 0 ? await prisma.page.findUnique({ where: { id }, select: { username: true, published: true, suspendedAt: true } }) : null;
    const published = pageSchema.safeParse(page?.published);

    // a taken-down page's links stop working too, so a scam can't keep using them
    const block = published.success && !page?.suspendedAt ? published.data.blocks.find((block) => block.id === blockId) : undefined;
    // a project with a case study goes to its page on Roselle; anything else to its own address
    const target = block && isLive(block) ? (hasCaseStudy(block) ? `/${page!.username}/work/${block.id}` : targetOf(block)) : undefined;

    if (!page || !target) {
        // an old or edited link: back to the page rather than an error
        return NextResponse.redirect(new URL(page ? `/${page.username}` : "/", req.url));
    }

    // saved after the visitor is already on their way, so counting never slows the click down
    after(() => recordEvent(req.headers, { pageId: id, type: "CLICK", blockId }).catch((error) => console.error("Record click error:", error)));

    return NextResponse.redirect(new URL(target, req.url));
}
