import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { hashToken, SESSION_COOKIE } from "@/lib/auth/session";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { passwordChangeSchema } from "@/lib/validations/settings";

// A new password, given the current one. Other browsers are signed out; this one stays in.
export async function PUT(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, passwordChangeSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`password:${user.id}`, 10, 15 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Too many attempts. Please wait 15 minutes." }, { status: 429 });
        }

        const { passwordHash } = await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
        if (!(await verifyPassword(parsed.data.current, passwordHash))) {
            return NextResponse.json({ ok: false, errors: { current: ["That's not your current password"] } }, { status: 400 });
        }

        const thisSession = hashToken(req.cookies.get(SESSION_COOKIE)?.value ?? "");
        await prisma.$transaction([
            prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.password) } }),
            prisma.session.deleteMany({ where: { userId: user.id, NOT: { id: thisSession } } }),
        ]);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Change password");
    }
}
