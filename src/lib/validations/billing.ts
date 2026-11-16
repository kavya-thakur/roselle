import { z } from "zod";

// Paying for Pro: a month or a year
export const orderSchema = z.object({ period: z.enum(["monthly", "yearly"]) });

// What Razorpay's checkout hands the browser after a payment, passed on to be checked
export const checkoutResultSchema = z.object({
    orderId: z.string().min(1).max(100),
    paymentId: z.string().min(1).max(100),
    signature: z.string().min(1).max(200),
});
