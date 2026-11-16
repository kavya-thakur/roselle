import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts } from "@/lib/api/rateLimit";
import { billingEnabled, createOrder, RazorpayProblem } from "@/lib/billing";
import { PRO_PLANS } from "@/lib/plans";
import { orderSchema } from "@/lib/validations/billing";

// Step 1 of paying for Pro (or renewing it early, which adds on): a Razorpay order for the price,
// which the browser opens Razorpay's payment window with
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");
        if (!billingEnabled()) return NextResponse.json({ ok: false, message: "Pro isn't open yet. Check back soon." }, { status: 503 });

        const parsed = await parseBody(req, orderSchema);
        if (!parsed.success) return parsed.response;

        if (tooManyAttempts(`pay:${user.id}`, 20, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "That's a lot of payment attempts. Please wait a little and try again." }, { status: 429 });
        }

        const { period } = parsed.data;
        const order = await createOrder(user.id, period);
        return NextResponse.json({
            ok: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                // the public half of the keys, for the payment window; the secret stays here
                keyId: process.env.RAZORPAY_KEY_ID,
                description: `Pro for a ${period === "monthly" ? "month" : "year"} (${PRO_PLANS[period].days} days)`,
                email: user.email,
            },
        });
    } catch (error) {
        if (error instanceof RazorpayProblem) {
            console.error("Razorpay order:", error.message);
            return NextResponse.json({ ok: false, message: "Couldn't start the payment. Please try again in a minute." }, { status: 502 });
        }
        return handleRouteError(error, "Create payment order");
    }
}
