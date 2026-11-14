import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { getPublishedPage } from "@/lib/pages/publish";
import { newReviewToken, REVIEW_LINK_DAYS } from "@/lib/reviews";
import { SITE_URL } from "@/lib/site";
import { reviewMessage } from "@/lib/messages";

// Makes a paid client's one-time review link and hands it back, for the creator to send from their
// own WhatsApp or email; with { via: "roselle" }, Roselle emails it for them. Asking again makes a
// fresh link and the old one stops working.
export async function POST(req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]/review-request">) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        if (tooManyAttempts(`review-request:${user.id}`, 30, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of requests. Please try again in an hour." }, { status: 429 });
        }

        const enquiry = await prisma.enquiry.findFirst({
            where: { id: Number((await params).id) || 0, pageId: user.page.id },
            select: { id: true, name: true, email: true, service: true, status: true, review: { select: { id: true } } },
        });
        if (!enquiry) return NextResponse.json({ ok: false, message: "That enquiry is gone" }, { status: 404 });
        // only finished, paid work: that's what makes every review a real client's
        if (enquiry.status !== "PAID") return NextResponse.json({ ok: false, message: "Mark it Paid first: reviews are for finished work" }, { status: 409 });
        if (enquiry.review) return NextResponse.json({ ok: false, message: `${enquiry.name} has already left a review` }, { status: 409 });

        const { token, hash } = newReviewToken();
        const reviewRequestedAt = new Date();
        await prisma.enquiry.update({ where: { id: enquiry.id }, data: { reviewTokenHash: hash, reviewRequestedAt } });

        const link = `${SITE_URL}/review/${token}`;
        // the body is optional: no body, or anything but "self", means Roselle emails it
        const via = (await req.json().catch(() => null))?.via === "self" ? "self" : "roselle";
        if (via === "roselle") {
            const creator = (await getPublishedPage(user.page.username))?.doc.profile.name || user.page.username;
            const { subject, text } = reviewMessage({ creator, client: enquiry.name, service: enquiry.service, link, days: REVIEW_LINK_DAYS }, "roselle");
            after(() =>
                sendEmail({ to: enquiry.email, fromName: `${creator} via Roselle`, replyTo: { email: user.email, name: creator }, subject, text }).catch((error) =>
                    console.error("Review request email error:", error),
                ),
            );
        }

        return NextResponse.json({ ok: true, data: { reviewRequestedAt, link } });
    } catch (error) {
        return handleRouteError(error, "Request review");
    }
}
