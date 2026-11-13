import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { paymentTarget } from "@/lib/pages/links";
import { getPublishedPage } from "@/lib/pages/publish";
import { formatMoney } from "@/lib/utils/format";
import { paymentRequestSchema } from "@/lib/validations/enquiry";

// Emails a booked client what to pay and where: the creator's own payment page or UPI id.
// The money goes straight to the creator; Roselle only sends the email and remembers that it did.
export async function POST(req: NextRequest, { params }: RouteContext<"/api/enquiry/[id]/payment-request">) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, paymentRequestSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`payment-request:${user.id}`, 30, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of requests. Please try again in an hour." }, { status: 429 });
        }

        const { amount, link, note } = parsed.data;
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

        const creator = (await getPublishedPage(user.page.username))?.doc.profile.name || user.page.username;
        const due = formatMoney(amount, user.currency);
        const howToPay = target.kind === "url" ? `Pay here: ${target.href}` : `Pay by UPI to: ${target.id}\n(open any UPI app, choose "Pay to UPI ID" and enter it)`;
        after(() =>
            sendEmail({
                to: enquiry.email,
                fromName: `${creator} via Roselle`,
                replyTo: { email: user.email, name: creator },
                subject: `${creator}: ${due}${enquiry.service ? ` for ${enquiry.service}` : ""}`,
                text: [`Hi ${enquiry.name},`, "", `${creator} has asked for ${due}${enquiry.service ? ` for ${enquiry.service}` : ""}.`, ...(note ? ["", note] : []), "", howToPay, "", `Questions? Just reply to this email to reach ${creator}.`].join("\n"),
            }).catch((error) => console.error("Payment request email error:", error)),
        );

        return NextResponse.json({ ok: true, data: { paymentRequestedAt, paymentRequestedAmount: amount } });
    } catch (error) {
        return handleRouteError(error, "Request payment");
    }
}
