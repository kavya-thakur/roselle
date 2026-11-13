import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";

const MAX_BYTES = 4 * 1024 * 1024;

// Photos only. SVG is left out on purpose: it can carry scripts, and we serve these from our
// own domain.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// An avatar or gallery picture from the editor. Answers with the address to put in the page.
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        if (tooManyAttempts(`upload:${user.id}`, 60, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of uploads. Please try again in an hour." }, { status: 429 });
        }

        const form = await req.formData().catch(() => null);
        const file = form?.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ ok: false, message: "Choose an image to upload" }, { status: 400 });
        }
        if (!IMAGE_TYPES.includes(file.type)) {
            return NextResponse.json({ ok: false, message: "Use a JPG, PNG, WebP, GIF or AVIF image" }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ ok: false, message: "Images can be up to 4 MB" }, { status: 413 });
        }

        const media = await prisma.media.create({
            data: { userId: user.id, mimeType: file.type, data: new Uint8Array(await file.arrayBuffer()) },
            select: { id: true },
        });

        return NextResponse.json({ ok: true, data: { url: `/media/${media.id}` } }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Upload image");
    }
}
