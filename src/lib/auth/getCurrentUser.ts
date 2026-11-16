import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { planNow } from "@/lib/plans";
import { hashToken, SESSION_COOKIE } from "./session";

// Who's signed in, with their page; null when nobody is.
// cache(): the layout and the page both ask, but the database is hit once per request
export const getCurrentUser = cache(async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;

    if (!token) {
        return null;
    }

    const session = await prisma.session.findUnique({
        where: { id: hashToken(token) },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    plan: true,
                    proUntil: true,
                    onboardedAt: true,
                    currency: true,
                    monthlyGoal: true,
                    weeklyEmail: true,
                    paymentLink: true,
                    emailVerifiedAt: true,
                    page: { select: { id: true, username: true } },
                },
            },
        },
    });

    if (!session || session.expiresAt < new Date() || !session.user.page) {
        return null;
    }

    // the plan right now: paid Pro that has run out is Free again, without anything having to change it
    return { ...session.user, plan: planNow(session.user.plan, session.user.proUntil), page: session.user.page };
});
