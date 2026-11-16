import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { sourceOf } from "@/lib/analytics/track";
import { sendEmail } from "@/lib/email/send";
import { isLive } from "@/lib/pages/links";
import { SITE_URL } from "@/lib/site";
import { enquirySchema } from "@/lib/validations/enquiry";
import { pageSchema } from "@/lib/validations/page";
import { ENQUIRY_EMAILS_A_DAY } from "@/lib/email/limits";

// A visitor's message from a "Work with me" or Services block: kept in the creator's inbox, where
// it can become a booking, and emailed to them with Reply going straight back to the visitor
//
// Everything about the block is read from the published page, never trusted from the browser:
// that the block exists and is live, and what the chosen service is called.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, enquirySchema);
        if (!parsed.success) return parsed.response;
        const { pageId, blockId, serviceId, name, email, phone, message, wantedOn, referrer, utmSource, website } = parsed.data;

        // the hidden trap field was filled in: a robot. Answer as if it worked, so it doesn't learn.
        if (website) return NextResponse.json({ ok: true }, { status: 201 });

        if (tooManyAttempts(`enquiry:${visitorOf(req.headers)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "You've sent a few messages already. Please try again in an hour." }, { status: 429 });
        }

        // only a live contact or services block on a live page takes messages
        const page = await prisma.page.findUnique({ where: { id: pageId }, select: { username: true, published: true, suspendedAt: true, user: { select: { email: true } } } });
        const published = pageSchema.safeParse(page?.published);
        const block = published.success ? published.data.blocks.find((candidate) => candidate.id === blockId) : undefined;
        const service = block?.type === "services" ? block.items.find((item) => item.id === serviceId) : undefined;
        const takesMessages = block?.type === "contact" || (block?.type === "services" && service);
        if (!page || page.suspendedAt || !block || !takesMessages || !isLive(block)) {
            return NextResponse.json({ ok: false, message: "This form isn't taking messages any more" }, { status: 404 });
        }

        await prisma.enquiry.create({
            data: { pageId, name, email, phone: phone || null, message, service: service?.name || null, wantedOn: wantedOn || null, source: sourceOf(referrer, utmSource, req.headers.get("user-agent") ?? "") },
        });

        // saved either way; emailed only up to the day's limit (counted in the database, so it
        // holds however many servers or addresses the messages come from)
        const lastDay = await prisma.enquiry.count({ where: { pageId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
        if (lastDay > ENQUIRY_EMAILS_A_DAY) return NextResponse.json({ ok: true }, { status: 201 });

        const about = [service && `About: ${service.name}${service.price ? ` (${service.price})` : ""}`, wantedOn && `For: ${wantedOn}`, phone && `WhatsApp: ${phone}`].filter(Boolean).join("\n");

        after(() =>
            sendEmail({
                to: page.user.email,
                replyTo: { email, name },
                subject: service ? `${name} asked about ${service.name}` : `${name} sent you a message on Roselle`,
                text: `${name} (${email}) wrote to you through ${SITE_URL}/${page.username}:\n\n${about ? `${about}\n\n` : ""}${message}\n\nReply to this email to answer them. Track it in your inbox: ${SITE_URL}/inbox`,
            }).catch((error) => console.error("Enquiry email error:", error)),
        );

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Enquiry");
    }
}
