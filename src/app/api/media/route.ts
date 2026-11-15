import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { cloudinary, uploadImage } from "@/lib/media/cloudinary";

const MAX_BYTES = 4 * 1024 * 1024;

// Photos only. SVG is left out on purpose: it can carry scripts, and we serve these from our
// own domain.
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// What the file's first bytes say it is. The type the browser sends is only the file's name
// talking, so a renamed or broken file would otherwise be stored and show as a broken picture.
function sniff(bytes: Uint8Array) {
    const ascii = (from: number, to: number) => String.fromCharCode(...bytes.subarray(from, to));
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
    if (ascii(1, 4) === "PNG") return "image/png";
    if (ascii(0, 4) === "GIF8") return "image/gif";
    if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "image/webp";
    if (ascii(4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(8, 12))) return "image/avif";
    return null;
}

// An avatar or gallery picture from the editor. Answers with the address to put in the page:
// a Cloudinary address when CLOUDINARY_URL is set (the live site), else /media/<id> with the
// picture kept in the database (your own computer, the tests).
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
            return NextResponse.json({ ok: false, message: "That kind of file can't be used. Choose a JPG, PNG, WebP, GIF or AVIF image." }, { status: 400 });
        }
        if (file.size > MAX_BYTES) {
            return NextResponse.json({ ok: false, message: "That photo is over 4 MB. Try a smaller one." }, { status: 413 });
        }

        const bytes = new Uint8Array(await file.arrayBuffer());
        const type = sniff(bytes);
        if (!type) {
            return NextResponse.json({ ok: false, message: "This file looks damaged or isn't really a photo. Try exporting it again." }, { status: 400 });
        }

        const storage = cloudinary();
        if (storage) {
            try {
                return NextResponse.json({ ok: true, data: { url: await uploadImage(storage, file, user.id) } }, { status: 201 });
            } catch (error) {
                // the photo was fine, the photo store wasn't: say so, so people retry instead of re-exporting
                console.error("Cloudinary upload error:", error);
                return NextResponse.json({ ok: false, message: "Couldn't store the photo just now. Please try again in a moment." }, { status: 502 });
            }
        }

        const media = await prisma.media.create({
            data: { userId: user.id, mimeType: type, data: bytes },
            select: { id: true },
        });

        return NextResponse.json({ ok: true, data: { url: `/media/${media.id}` } }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Upload image");
    }
}
