import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";

// An uploaded image, for anyone: creator pages are public. An id never points to a different
// picture, so browsers and CDNs may keep it forever.
export async function GET(_req: NextRequest, { params }: RouteContext<"/media/[id]">) {
    const { id } = await params;

    const media = await prisma.media.findUnique({ where: { id }, select: { mimeType: true, data: true } });
    if (!media) {
        return new Response("Not found", { status: 404 });
    }

    return new Response(media.data, {
        headers: {
            "Content-Type": media.mimeType,
            "Cache-Control": "public, max-age=31536000, immutable",
            // the browser must treat it as the image type above, never guess it's a page
            "X-Content-Type-Options": "nosniff",
        },
    });
}
