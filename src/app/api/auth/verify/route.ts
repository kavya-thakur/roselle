import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { sendVerifyEmail } from "@/lib/auth/tokens";
import { handleRouteError } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";

// "Send it again", from settings
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");
        if (user.emailVerifiedAt) return NextResponse.json({ ok: true });

        if (tooManyAttempts(`verify:${user.id}`, 3, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "We've sent a few already. Check your spam folder, or try again in an hour." }, { status: 429 });
        }

        await sendVerifyEmail(user, req.nextUrl.origin);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Resend verification");
    }
}
