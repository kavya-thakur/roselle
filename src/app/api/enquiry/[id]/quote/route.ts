import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { SENT_FOR_YOU_LIMIT_MESSAGE, sentTooManyFor } from "@/lib/email/limits";
import { repliedAtFor } from "@/lib/bookings";
import { quoteMessage } from "@/lib/messages";
import { paymentTarget } from "@/lib/pages/links";
import { getPublishedPage } from "@/lib/pages/publish";
import { newQuoteToken } from "@/lib/quotes";
import { SITE_URL } from "@/lib/site";
import { quoteSchema } from "@/lib/validations/enquiry";

// Saves the quote for an enquiry and hands back its link, for the creator to send from their own
// WhatsApp or email; with { via: "roselle" }, Roselle emails it. Changing a quote keeps its link,
// so the client always sees the latest one. A quote that was accepted can't be changed: that's
// what the client agreed to.
export async function POST(req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]/quote">) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, quoteSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`quote:${user.id}`, 30, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of quotes. Please try again in an hour." }, { status: 429 });
        }

        const { details, amount, deposit, link, via } = parsed.data;
        if (via === "roselle" && sentTooManyFor(user.id)) {
            return NextResponse.json({ ok: false, message: SENT_FOR_YOU_LIMIT_MESSAGE }, { status: 429 });
        }
        if (deposit > 0 && !paymentTarget(link)) {
            return NextResponse.json({ ok: false, errors: { link: ["Use a payment page address starting with https://, or a UPI ID like name@okbank"] } }, { status: 400 });
        }

        const enquiry = await prisma.enquiry.findFirst({
            where: { id: Number((await params).id) || 0, pageId: user.page.id },
            select: { id: true, name: true, email: true, service: true, status: true, repliedAt: true, quoteToken: true, quoteAcceptedAt: true },
        });
        if (!enquiry) return NextResponse.json({ ok: false, message: "That enquiry is gone" }, { status: 404 });
        if (enquiry.quoteAcceptedAt) return NextResponse.json({ ok: false, message: `${enquiry.name} has already accepted this quote` }, { status: 409 });
        if (enquiry.status === "CLOSED") return NextResponse.json({ ok: false, message: "This enquiry is marked Not going ahead. Move it back first." }, { status: 409 });

        const quoteToken = enquiry.quoteToken ?? newQuoteToken();
        const quoteSentAt = new Date();
        // sending a quote is replying: a new enquiry moves on by itself
        const status = enquiry.status === "NEW" ? "REPLIED" : enquiry.status;
        await prisma.$transaction([
            prisma.enquiry.update({
                where: { id: enquiry.id },
                data: { quoteToken, quoteDetails: details, quoteAmount: amount, quoteDeposit: deposit, quoteSentAt, status, repliedAt: repliedAtFor(status, enquiry.repliedAt) },
            }),
            // remembered for next time, like a payment request's
            ...(deposit > 0 ? [prisma.user.update({ where: { id: user.id }, data: { paymentLink: link } })] : []),
        ]);

        const quoteLink = `${SITE_URL}/quote/${quoteToken}`;
        if (via === "roselle") {
            const creator = (await getPublishedPage(user.page.username))?.doc.profile.name || user.page.username;
            const { subject, text } = quoteMessage({ creator, client: enquiry.name, amount, deposit, currency: user.currency, service: enquiry.service, link: quoteLink }, "roselle");
            after(() =>
                sendEmail({ to: enquiry.email, fromName: `${creator} via Roselle`, replyTo: { email: user.email, name: creator }, subject, text }).catch((error) =>
                    console.error("Quote email error:", error),
                ),
            );
        }

        return NextResponse.json({ ok: true, data: { link: quoteLink, quoteToken, quoteSentAt, quoteDetails: details, quoteAmount: amount, quoteDeposit: deposit, status } });
    } catch (error) {
        return handleRouteError(error, "Send quote");
    }
}
