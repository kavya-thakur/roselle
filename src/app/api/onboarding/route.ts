import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { starterFor } from "@/lib/pages/starters";
import { onboardingSchema } from "@/lib/validations/onboarding";

// The answers from /welcome become the creator's first draft: blocks that fit what they do, the
// look they picked, prices in their currency. Nothing is published; the editor takes it from here.
// Answering twice is refused, so a second visit can never wipe a page they've since worked on.
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");
        if (user.onboardedAt) return NextResponse.json({ ok: false, message: "Your page is already set up" }, { status: 409 });

        const parsed = await parseBody(req, onboardingSchema);
        if (!parsed.success) return parsed.response;
        const answers = parsed.data;

        const onboardedAt = new Date();
        if ("skip" in answers) {
            await prisma.user.update({ where: { id: user.id }, data: { onboardedAt } });
        } else {
            const { craft, currency, ...profile } = answers;
            await prisma.user.update({
                where: { id: user.id },
                data: { onboardedAt, currency, page: { update: { draft: starterFor(craft, { ...profile, currency }) } } },
            });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Onboarding");
    }
}
