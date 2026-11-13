import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { isLive } from "@/lib/pages/links";
import { SITE_URL } from "@/lib/site";
import { enquirySchema } from "@/lib/validations/enquiry";
import { pageSchema } from "@/lib/validations/page";

// A visitor's message from a "Work with me" block: kept in the creator's inbox and emailed to
// them, with Reply going straight back to the visitor
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, enquirySchema);
        if (!parsed.success) return parsed.response;
        const { pageId, blockId, name, email, message, website } = parsed.data;

        // the hidden trap field was filled in: a robot. Answer as if it worked, so it doesn't learn.
        if (website) return NextResponse.json({ ok: true }, { status: 201 });

        if (tooManyAttempts(`enquiry:${visitorOf(req.headers)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "You've sent a few messages already. Please try again in an hour." }, { status: 429 });
        }

        // only a live contact block on a live page takes messages
        const page = await prisma.page.findUnique({ where: { id: pageId }, select: { username: true, published: true, suspendedAt: true, user: { select: { email: true } } } });
        const published = pageSchema.safeParse(page?.published);
        const block = published.success ? published.data.blocks.find((candidate) => candidate.id === blockId) : undefined;
        if (!page || page.suspendedAt || block?.type !== "contact" || !isLive(block)) {
            return NextResponse.json({ ok: false, message: "This form isn't taking messages any more" }, { status: 404 });
        }

        await prisma.enquiry.create({ data: { pageId, name, email, message } });

        after(() =>
            sendEmail({
                to: page.user.email,
                replyTo: { email, name },
                subject: `${name} sent you a message on Roselle`,
                text: `${name} (${email}) wrote to you through ${SITE_URL}/${page.username}:\n\n${message}\n\nReply to this email to answer them. All your messages: ${SITE_URL}/inbox`,
            }).catch((error) => console.error("Enquiry email error:", error)),
        );

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Enquiry");
    }
}
