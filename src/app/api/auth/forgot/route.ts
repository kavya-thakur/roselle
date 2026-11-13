import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { sendResetEmail } from "@/lib/auth/tokens";
import { forgotSchema } from "@/lib/validations/auth";

// Emails a reset link. Answers the same whether or not the address has an account, so this
// can't be used to find out who's signed up.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, forgotSchema);
        if (!parsed.success) return parsed.response;

        const { email } = parsed.data;

        // one inbox can't be flooded, and one place can't try every address
        if (tooManyAttempts(`forgot:${email}`, 3, 60 * 60 * 1000) || tooManyAttempts(`forgot:${visitorOf(req.headers)}`, 10, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Too many reset emails. Please try again in an hour." }, { status: 429 });
        }

        const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
        // sent after answering, so how long it takes says nothing about whether the account exists
        if (user) after(() => sendResetEmail(user, req.nextUrl.origin).catch((error) => console.error("Reset email error:", error)));

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Forgot password");
    }
}
