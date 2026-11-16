import { formatMoney } from "@/lib/utils/format";
import type { paymentTarget } from "@/lib/pages/links";

// The messages a creator sends a client: asking for a payment, asking for a review. Written once,
// here, in two voices: the creator's own (sent from their WhatsApp or email) and Roselle's (when
// they let Roselle email it for them). The inbox shows and shares the first; the server emails the second.

type Voice = "me" | "roselle";

// How long a client has to use their review link (lib/reviews.ts checks it)
export const REVIEW_LINK_DAYS = 60;
type PaymentTarget = NonNullable<ReturnType<typeof paymentTarget>>;

export interface PaymentRequest {
    creator: string;
    client: string;
    amount: number;
    currency: string;
    service: string | null;
    note: string;
    target: PaymentTarget;
}

const firstName = (name: string) => name.trim().split(/\s+/)[0];

const howToPay = (target: PaymentTarget) => (target.kind === "url" ? `Pay here: ${target.href}` : `Pay by UPI to: ${target.id}\n(open any UPI app, choose "Pay to UPI ID" and enter it)`);

export function paymentMessage(request: PaymentRequest, voice: Voice = "me") {
    const { creator, client, amount, currency, service, note, target } = request;
    const due = formatMoney(amount, currency);
    const forWhat = service ? ` for ${service}` : "";

    const opening =
        voice === "me"
            ? [`Hi ${firstName(client)},`, "", `Thank you for booking me${forWhat}. Here are the details for the payment of ${due}:`]
            : [`Hi ${client},`, "", `${creator} has asked for ${due}${forWhat}.`];
    const closing = voice === "me" ? ["", "Thank you!", firstName(creator)] : ["", `Questions? Just reply to this email to reach ${creator}.`];

    return {
        subject: voice === "me" ? `Payment${forWhat}: ${due}` : `${creator}: ${due}${forWhat}`,
        text: [...opening, ...(note ? ["", note] : []), "", howToPay(target), ...closing].join("\n"),
    };
}

export interface QuoteRequest {
    creator: string;
    client: string;
    amount: number;
    deposit: number;
    currency: string;
    service: string | null;
    link: string;
}

export function quoteMessage({ creator, client, amount, deposit, currency, service, link }: QuoteRequest, voice: Voice = "me") {
    const forWhat = service ? ` for ${service}` : "";
    const price = formatMoney(amount, currency);
    const toBook = deposit > 0 ? ` A deposit of ${formatMoney(deposit, currency)} books the date.` : "";

    if (voice === "me") {
        return {
            subject: `Quote${forWhat}: ${price}`,
            text: [`Hi ${firstName(client)},`, "", `Thank you for your message! Here's my quote${forWhat}: ${price}.${toBook}`, "", "You can see everything that's included and accept it here:", link, "", firstName(creator)].join("\n"),
        };
    }
    return {
        subject: `${creator} sent you a quote${forWhat}: ${price}`,
        text: [`Hi ${client},`, "", `${creator} has sent you a quote${forWhat}: ${price}.${toBook}`, "", "See what's included and accept it here:", link, "", `Questions? Just reply to this email to reach ${creator}.`].join("\n"),
    };
}

export interface ReviewRequest {
    creator: string;
    client: string;
    service: string | null;
    link: string;
    days: number;
}

export function reviewMessage({ creator, client, service, link, days }: ReviewRequest, voice: Voice = "me") {
    const onWhat = service ? ` on ${service}` : "";

    if (voice === "me") {
        return {
            subject: "How did it go?",
            text: [`Hi ${firstName(client)},`, "", `Thank you for working with me${onWhat}! Would you share a few words about how it went? It takes a minute and really helps.`, "", link, "", firstName(creator)].join("\n"),
        };
    }
    return {
        subject: `How did it go? ${creator} would love your thoughts`,
        text: `Hi ${client},\n\nThank you for working with ${creator}${onWhat}. Would you share a few words about how it went? It takes a minute and helps others find good work.\n\n${link}\n\nThe link works for ${days} days.`,
    };
}

// Where each "send it yourself" button goes. WhatsApp opens the client's chat when we have their
// number (with its country code); without one it opens WhatsApp to pick the chat.
export function whatsappLink(text: string, phone: string | null) {
    const digits = phone?.replace(/\D/g, "") ?? "";
    const number = digits.length >= 10 && phone?.trim().startsWith("+") ? digits : "";
    return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const emailLink = (to: string, { subject, text }: { subject: string; text: string }) =>
    `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
