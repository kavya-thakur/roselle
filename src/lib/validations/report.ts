import { z } from "zod";
import { emailSchema } from "./common";

// What a visitor can report a page for
export const REPORT_REASONS = {
    scam: "Scam, phishing or fake giveaway",
    impersonation: "Pretending to be someone else",
    spam: "Spam or misleading links",
    hate: "Hate, harassment or threats",
    sexual: "Sexual or violent content",
    illegal: "Selling illegal goods or services",
    copyright: "Uses my work, brand or trademark",
    other: "Something else",
} as const;

export type ReportReason = keyof typeof REPORT_REASONS;

export const reportSchema = z.object({
    pageId: z.number().int().positive(),
    reason: z.enum(Object.keys(REPORT_REASONS) as [ReportReason, ...ReportReason[]], "Choose what's wrong"),
    details: z.string().trim().max(1000, "Must be at most 1000 characters").default(""),
    // optional: an empty box is fine, a typed one must be a real address
    email: z.union([z.literal(""), emailSchema]).default(""),
});

// What an admin can do from /admin
export const adminActionSchema = z.discriminatedUnion("action", [
    // the reason is shown to the page's owner, so it says what rule was broken
    z.object({ action: z.literal("suspend"), username: z.string().trim().toLowerCase().min(1).max(30), reason: z.string().trim().min(3, "Say why, the owner will see it").max(300) }),
    z.object({ action: z.literal("restore"), username: z.string().trim().toLowerCase().min(1).max(30) }),
    z.object({ action: z.literal("dismiss"), reportId: z.number().int().positive() }),
    // Pro by hand, without a payment (a friend, a refund made good, a bank transfer): for a number
    // of days, added on to Pro still running, or with no end (days: null)
    z.object({ action: z.literal("grantPro"), userId: z.number().int().positive(), days: z.number().int().min(1).max(3660).nullable() }),
    z.object({ action: z.literal("endPro"), userId: z.number().int().positive() }),
]);

export type ReportFormValues = z.input<typeof reportSchema>;
export type AdminAction = z.infer<typeof adminActionSchema>;
