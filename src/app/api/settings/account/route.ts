import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { verifyPassword } from "@/lib/auth/password";
import { endSession } from "@/lib/auth/session";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { refreshPublicPage } from "@/lib/pages/publish";
import { deleteAccountSchema } from "@/lib/validations/settings";
import { deleteImagesOf } from "@/lib/media/cloudinary";

// Deletes the account and everything in it: the page, its analytics, uploaded images and
// sessions all go with the user (onDelete: Cascade), and their photos on Cloudinary right after.
// The username is free again straight away.
export async function DELETE(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, deleteAccountSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`delete:${user.id}`, 10, 15 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Too many attempts. Please wait 15 minutes." }, { status: 429 });
        }

        const { passwordHash } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
        if (!(await verifyPassword(parsed.data.password, passwordHash))) {
            return NextResponse.json({ ok: false, errors: { password: ["That's not your password"] } }, { status: 400 });
        }

        await endSession();
        await prisma.user.delete({ where: { id: user.id } });
        refreshPublicPage(user.page.username);
        after(() => deleteImagesOf(user.id).catch((error) => console.error("[Delete account] photos left on Cloudinary", user.id, error)));

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Delete account");
    }
}
