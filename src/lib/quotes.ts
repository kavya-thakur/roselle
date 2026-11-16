import { cache } from "react";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { paymentTarget } from "@/lib/pages/links";
import { pageSchema } from "@/lib/validations/page";

// A link for a new quote, long enough that it can't be guessed
export const newQuoteToken = () => randomBytes(18).toString("base64url");

// A quote as its client sees it, at /quote/<token>; null when there's no such quote, the
// enquiry was closed (the creator called it off), or the page was taken down.
// cache(): the page and its title ask once between them.
export const quoteFor = cache(async (token: string) => {
    const enquiry = await prisma.enquiry.findUnique({
        where: { quoteToken: token },
        select: {
            id: true,
            name: true,
            service: true,
            wantedOn: true,
            status: true,
            quoteDetails: true,
            quoteAmount: true,
            quoteDeposit: true,
            quoteSentAt: true,
            quoteAcceptedAt: true,
            page: { select: { username: true, published: true, suspendedAt: true, user: { select: { email: true, currency: true, paymentLink: true } } } },
        },
    });
    if (!enquiry || enquiry.status === "CLOSED" || enquiry.page.suspendedAt || enquiry.quoteAmount === null || !enquiry.quoteSentAt) return null;

    const profile = pageSchema.safeParse(enquiry.page.published).data?.profile;
    const { page, ...quote } = enquiry;
    return {
        ...quote,
        amount: enquiry.quoteAmount,
        deposit: enquiry.quoteDeposit ?? 0,
        currency: page.user.currency,
        creator: profile?.name || page.username,
        avatar: profile?.avatar ?? "",
        username: page.username,
        creatorEmail: page.user.email,
        // where the deposit goes: the creator's payment page or UPI id, as last saved
        payTo: paymentTarget(page.user.paymentLink ?? ""),
    };
});

// Tapping this on a phone opens the client's UPI app with the amount filled in. Only in rupees:
// UPI doesn't take anything else.
export function upiPayLink(id: string, amount: number, currency: string, payee: string, note: string) {
    if (currency !== "INR") return undefined;
    const params = new URLSearchParams({ pa: id, pn: payee, am: String(amount), cu: "INR", tn: note.slice(0, 50) });
    return `upi://pay?${params}`;
}
