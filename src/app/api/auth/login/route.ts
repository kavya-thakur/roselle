import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, loginSchema);
        if (!parsed.success) return parsed.response;

        const { email, password } = parsed.data;

        // password guessing: 10 tries per 15 minutes from one place for one account. Per place
        // and account together, so nobody can lock a real person out from somewhere else.
        if (tooManyAttempts(`login:${visitorOf(req.headers)}:${email}`, 10, 15 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." }, { status: 429 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        // the same answer for a wrong email and a wrong password, so it can't be used to find accounts
        if (!user || !(await verifyPassword(password, user.passwordHash))) {
            return NextResponse.json({ ok: false, message: "Invalid email or password" }, { status: 401 });
        }

        await startSession(user.id);

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Login");
    }
}
