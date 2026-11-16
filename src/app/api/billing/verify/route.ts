import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { checkoutSignatureValid, PaymentProblem, RazorpayProblem, settlePayment } from "@/lib/billing";
import { checkoutResultSchema } from "@/lib/validations/billing";

// Razorpay's payment window succeeded and handed the browser these. The signature (made with the
// secret, so it can't be invented) must match; then the payment is checked with Razorpay itself and
// Pro switched on. A payment counts once, however often it's sent.
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");

        const parsed = await parseBody(req, checkoutResultSchema);
        if (!parsed.success) return parsed.response;
        const { orderId, paymentId, signature } = parsed.data;

        if (!checkoutSignatureValid(orderId, paymentId, signature)) {
            return NextResponse.json({ ok: false, message: "We couldn't confirm this payment. If money left your account, write to us and we'll sort it out." }, { status: 400 });
        }

        const { proUntil } = await settlePayment(orderId, paymentId, user.id);
        return NextResponse.json({ ok: true, data: { proUntil } });
    } catch (error) {
        if (error instanceof PaymentProblem) return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
        if (error instanceof RazorpayProblem) {
            console.error("Razorpay verify:", error.message);
            return NextResponse.json({ ok: false, message: "We couldn't reach Razorpay to confirm the payment. If it went through, Pro switches on by itself within a few minutes." }, { status: 502 });
        }
        return handleRouteError(error, "Verify payment");
    }
}
