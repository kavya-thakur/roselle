import { cache } from "react";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/auth/session";

// How long a client has to use their review link
export const REVIEW_LINK_DAYS = 60;

export type PublicReview = { id: number; name: string; rating: number; text: string; service: string | null };

// The reviews a page shows: approved ones, newest first. cache(): one query per render.
export const getApprovedReviews = cache(
    async (pageId: number): Promise<PublicReview[]> =>
        prisma.review.findMany({
            where: { pageId, approvedAt: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 30,
            select: { id: true, name: true, rating: true, text: true, service: true },
        }),
);

// A new one-time review link for an enquiry: the token for the email, its hash for the database
export function newReviewToken() {
    const token = randomBytes(24).toString("base64url");
    return { token, hash: hashToken(token) };
}

// The enquiry a review link belongs to, if the link is still good: not used, not expired,
// and the page not taken down
export async function enquiryForReview(token: string) {
    const enquiry = await prisma.enquiry.findUnique({
        where: { reviewTokenHash: hashToken(token) },
        select: {
            id: true,
            pageId: true,
            name: true,
            service: true,
            reviewRequestedAt: true,
            page: { select: { username: true, suspendedAt: true, published: true, user: { select: { email: true } } } },
        },
    });
    const fresh = enquiry?.reviewRequestedAt && Date.now() - enquiry.reviewRequestedAt.getTime() < REVIEW_LINK_DAYS * 24 * 60 * 60 * 1000;
    return enquiry && fresh && !enquiry.page.suspendedAt ? enquiry : null;
}
