import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { ReviewsView } from "./ReviewsView";

export const metadata: Metadata = { title: "Reviews" };

// What clients wrote: waiting for approval first, then what's on the page
export default async function ReviewsPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const reviews = await prisma.review.findMany({
        where: { pageId: user.page.id },
        orderBy: [{ approvedAt: { sort: "desc", nulls: "first" } }, { createdAt: "desc" }],
        select: { id: true, name: true, rating: true, text: true, service: true, createdAt: true, approvedAt: true },
    });

    return <ReviewsView reviews={reviews.map(({ createdAt, approvedAt, ...review }) => ({ ...review, createdAt: createdAt.toISOString(), approved: !!approvedAt }))} />;
}
