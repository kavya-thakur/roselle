import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
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

    return { ...session.user, page: session.user.page };
});
