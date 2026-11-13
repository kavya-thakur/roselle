import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { enquiryForReview } from "@/lib/reviews";
import { SITE_URL } from "@/lib/site";
import { reviewSchema } from "@/lib/validations/enquiry";

// A client's review, from their one-time link. Saved as waiting for approval; the link stops
// working; the creator is told.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, reviewSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`review:${visitorOf(req.headers)}`, 10, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Please try again in an hour." }, { status: 429 });
        }

        const { token, name, rating, text } = parsed.data;
        const enquiry = await enquiryForReview(token);
        if (!enquiry) return NextResponse.json({ ok: false, message: "This link has already been used or has expired." }, { status: 410 });

        // the review and the end of the link happen together, so one link can't leave two reviews
        await prisma.$transaction([
            prisma.review.create({ data: { pageId: enquiry.pageId, enquiryId: enquiry.id, name, rating, text, service: enquiry.service } }),
            prisma.enquiry.update({ where: { id: enquiry.id }, data: { reviewTokenHash: null } }),
        ]);

        after(() =>
            sendEmail({
                to: enquiry.page.user.email,
                subject: `${name} left you a ${rating}-star review`,
                text: `"${text}"\n\n${name}${enquiry.service ? `, ${enquiry.service}` : ""}\n\nIt shows on your page once you approve it: ${SITE_URL}/reviews`,
            }).catch((error) => console.error("New review email error:", error)),
        );

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Review");
    }
}
