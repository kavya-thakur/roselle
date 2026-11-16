import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { bookedAtFor, repliedAtFor } from "@/lib/bookings";
import { quoteFor } from "@/lib/quotes";
import { SITE_URL } from "@/lib/site";
import { formatMoney } from "@/lib/utils/format";
import { quoteAcceptSchema } from "@/lib/validations/enquiry";

// A client accepting a quote from its link. The work is booked at the quoted price, the deposit
// (if any) counts as asked for, and the creator is told. Accepting twice is fine: nothing changes.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, quoteAcceptSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`quote-accept:${visitorOf(req.headers)}`, 20, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "Please try again in an hour." }, { status: 429 });
        }

        const quote = await quoteFor(parsed.data.token);
        if (!quote) return NextResponse.json({ ok: false, message: "This quote is no longer available. Please get in touch with them directly." }, { status: 410 });
        if (quote.quoteAcceptedAt) return NextResponse.json({ ok: true });

        const now = new Date();
        const current = await prisma.enquiry.findUniqueOrThrow({ where: { id: quote.id }, select: { bookedAt: true, repliedAt: true } });
        // already marked Paid by hand: leave it there
        const status = quote.status === "PAID" ? "PAID" : "BOOKED";
        // only one accept wins, however many taps come in at once
        const { count } = await prisma.enquiry.updateMany({
            where: { id: quote.id, quoteAcceptedAt: null },
            data: {
                quoteAcceptedAt: now,
                status,
                amount: quote.amount,
                bookedAt: bookedAtFor(status, current.bookedAt, now),
                repliedAt: repliedAtFor(status, current.repliedAt, now),
                ...(quote.deposit > 0 && { paymentRequestedAt: now, paymentRequestedAmount: quote.deposit }),
            },
        });

        if (count === 1) {
            const money = (value: number) => formatMoney(value, quote.currency);
            after(() =>
                sendEmail({
                    to: quote.creatorEmail,
                    subject: `${quote.name} accepted your quote: ${money(quote.amount)}`,
                    text: [
                        `${quote.name} accepted your quote${quote.service ? ` for ${quote.service}` : ""}, so it's marked Booked in your inbox.`,
                        quote.deposit > 0 ? `They were shown how to pay the ${money(quote.deposit)} deposit. Mark it Paid when the money arrives.` : "",
                        `${SITE_URL}/inbox`,
                    ].filter(Boolean).join("\n\n"),
                }).catch((error) => console.error("Quote accepted email error:", error)),
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Accept quote");
    }
}
