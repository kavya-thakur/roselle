import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { redeemToken } from "@/lib/auth/tokens";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { resetSchema } from "@/lib/validations/auth";

// A new password from the emailed link. Every browser signed in to the account is signed out
// (whoever had the old password is out), then this one is signed in.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, resetSchema);
        if (!parsed.success) return parsed.response;

        const userId = await redeemToken(parsed.data.token, "RESET_PASSWORD");
        if (!userId) {
            return NextResponse.json({ ok: false, message: "This link has expired or was already used. Ask for a new one." }, { status: 400 });
        }

        await prisma.$transaction([
            // they clicked a link sent to the address, so it's theirs: that verifies it too
            prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsed.data.password), emailVerifiedAt: new Date() } }),
            prisma.session.deleteMany({ where: { userId } }),
        ]);
        await startSession(userId);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Reset password");
    }
}
