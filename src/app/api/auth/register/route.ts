import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { startSession } from "@/lib/auth/session";
import { sendVerifyEmail } from "@/lib/auth/tokens";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { registerSchema } from "@/lib/validations/auth";
import { starterPage } from "@/lib/pages/blocks";
import { Prisma } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, registerSchema);
        if (!parsed.success) return parsed.response;

        const { username, email, password } = parsed.data;

        // stops one script from claiming every good name
        if (tooManyAttempts(`register:${visitorOf(req.headers)}`, 10, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Too many sign-ups from here. Please try again in an hour." }, { status: 429 });
        }

        // the account and its page together: nobody ever has one without the other
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: await hashPassword(password),
                page: { create: { username, draft: starterPage(username) } },
            },
        });

        await startSession(user.id);
        // nothing waits for the email; settings can send it again if it gets lost
        after(() => sendVerifyEmail(user, req.nextUrl.origin).catch((error) => console.error("Verify email error:", error)));

        return NextResponse.json({ ok: true, data: { username } }, { status: 201 });
    } catch (error) {
        // P2002 = unique constraint: the email or the username already belongs to someone
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            const takenUsername = JSON.stringify(error.meta ?? {}).includes("username");
            return NextResponse.json(
                { ok: false, message: takenUsername ? "That name is taken" : "Email is already registered" },
                { status: 409 }
            );
        }
        return handleRouteError(error, "Register");
    }
}
