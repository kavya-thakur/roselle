import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { pageSchema } from "@/lib/validations/page";
import { InboxView } from "./InboxView";

export const metadata: Metadata = { title: "Inbox" };

// Enquiries from the page, newest first, and where each one stands. Opening the inbox marks them
// read (the sidebar's count); the ones that were new still say so this once.
export default async function InboxPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const enquiries = await prisma.enquiry.findMany({
        where: { pageId: user.page.id },
        orderBy: { createdAt: "desc" },
        // ponytail: the newest 500, all filtered in the browser; page through them on the server past that
        take: 500,
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            message: true,
            service: true,
            wantedOn: true,
            source: true,
            status: true,
            amount: true,
            bookedAt: true,
            createdAt: true,
            readAt: true,
            reviewRequestedAt: true,
            paymentRequestedAt: true,
            paymentRequestedAmount: true,
            quoteToken: true,
            quoteDetails: true,
            quoteAmount: true,
            quoteDeposit: true,
            quoteSentAt: true,
            quoteAcceptedAt: true,
            review: { select: { id: true } },
        },
    });
    await prisma.enquiry.updateMany({ where: { pageId: user.page.id, readAt: null }, data: { readAt: new Date() } });

    // the name the creator signs their messages with: the one on their page
    const draft = pageSchema.safeParse((await prisma.page.findUniqueOrThrow({ where: { id: user.page.id }, select: { draft: true } })).draft);
    const creatorName = (draft.success && draft.data.profile.name.trim()) || user.page.username;

    return (
        <InboxView
            currency={user.currency}
            creatorName={creatorName}
            monthlyGoal={user.monthlyGoal}
            paymentLink={user.paymentLink ?? ""}
            enquiries={enquiries.map(({ readAt, createdAt, bookedAt, reviewRequestedAt, paymentRequestedAt, quoteSentAt, quoteAcceptedAt, review, ...enquiry }) => ({
                ...enquiry,
                unread: !readAt,
                createdAt: createdAt.toISOString(),
                bookedAt: bookedAt?.toISOString() ?? null,
                reviewRequestedAt: reviewRequestedAt?.toISOString() ?? null,
                reviewed: !!review,
                paymentRequestedAt: paymentRequestedAt?.toISOString() ?? null,
                quoteSentAt: quoteSentAt?.toISOString() ?? null,
                quoteAcceptedAt: quoteAcceptedAt?.toISOString() ?? null,
            }))}
        />
    );
}
