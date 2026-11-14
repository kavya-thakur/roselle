import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { paymentTarget } from "@/lib/pages/links";
import { getPublishedPage } from "@/lib/pages/publish";
import { paymentRequestSchema } from "@/lib/validations/enquiry";
import { paymentMessage } from "@/lib/messages";

// Records that a booked client was asked to pay, and how much. Usually the creator sends the message
// themselves (WhatsApp, their own email: "self"), and this only records it; or Roselle emails it for
// them ("roselle"). Either way the money goes straight to the creator, never through Roselle.
export async function POST(req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]/payment-request">) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, paymentRequestSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`payment-request:${user.id}`, 30, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of requests. Please try again in an hour." }, { status: 429 });
        }

        const { amount, link, note, via } = parsed.data;
        const target = paymentTarget(link);
        if (!target) {
            return NextResponse.json({ ok: false, errors: { link: ["Use a payment page address starting with https://, or a UPI ID like name@okbank"] } }, { status: 400 });
        }

        const enquiry = await prisma.enquiry.findFirst({
            where: { id: Number((await params).id) || 0, pageId: user.page.id },
            select: { id: true, name: true, email: true, service: true, status: true },
        });
        if (!enquiry) return NextResponse.json({ ok: false, message: "That enquiry is gone" }, { status: 404 });
        if (enquiry.status !== "BOOKED") return NextResponse.json({ ok: false, message: "Payment requests are for booked work" }, { status: 409 });

        const paymentRequestedAt = new Date();
        await prisma.$transaction([
            prisma.enquiry.update({ where: { id: enquiry.id }, data: { paymentRequestedAt, paymentRequestedAmount: amount } }),
            // remembered for next time, so it's typed once
            prisma.user.update({ where: { id: user.id }, data: { paymentLink: link } }),
        ]);

        if (via === "roselle") {
            const creator = (await getPublishedPage(user.page.username))?.doc.profile.name || user.page.username;
            const { subject, text } = paymentMessage({ creator, client: enquiry.name, amount, currency: user.currency, service: enquiry.service, note, target }, "roselle");
            after(() =>
                sendEmail({ to: enquiry.email, fromName: `${creator} via Roselle`, replyTo: { email: user.email, name: creator }, subject, text }).catch((error) =>
                    console.error("Payment request email error:", error),
                ),
            );
        }

        return NextResponse.json({ ok: true, data: { paymentRequestedAt, paymentRequestedAmount: amount } });
    } catch (error) {
        return handleRouteError(error, "Request payment");
    }
}
