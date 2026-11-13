import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { recordEvent } from "@/lib/analytics/track";
import { parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { viewSchema } from "@/lib/validations/analytics";

// A visit to a public page, sent by the page itself once it's loaded (TrackView.tsx). Counting
// from the browser, not when the page renders, leaves out link-preview bots and prefetches.
export async function POST(req: NextRequest) {
    const parsed = await parseBody(req, viewSchema);
    if (!parsed.success) return parsed.response;

    const { pageId, referrer, utmSource } = parsed.data;

    // a reload loop or a script shouldn't be able to inflate someone's numbers
    if (tooManyAttempts(`view:${visitorOf(req.headers)}:${pageId}`, 20, 60 * 60 * 1000)) {
        return NextResponse.json({ ok: true });
    }

    after(async () => {
        try {
            const page = await prisma.page.findUnique({ where: { id: pageId }, select: { published: true } });
            if (page?.published) await recordEvent(req.headers, { pageId, type: "VIEW", referrer, utmSource });
        } catch (error) {
            console.error("Record view error:", error);
        }
    });

    return NextResponse.json({ ok: true });
}
