"use client";

import { useState, type ReactNode } from "react";
import { IconBrandWhatsapp, IconCalendarEvent, IconCash, IconClock, IconCopy, IconLoader2, IconMail, IconStar, IconTrash } from "@tabler/icons-react";

import { Dropdown } from "@/components/Dropdown";
import { LocalTime } from "@/components/LocalTime";
import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";
import { paymentTarget } from "@/lib/pages/links";
import { emailLink, paymentMessage, REVIEW_LINK_DAYS, reviewMessage, whatsappLink } from "@/lib/messages";
import { isWon, STATUS_LABELS } from "@/lib/bookings";
import { currencySymbol, formatMoney } from "@/lib/utils/format";
import { ENQUIRY_STATUSES, type EnquiryStatus, type EnquiryUpdate } from "@/lib/validations/enquiry";

export interface Enquiry {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    message: string;
    service: string | null;
    wantedOn: string | null;
    source: string;
    status: EnquiryStatus;
    amount: number | null;
    bookedAt: string | null;
    createdAt: string;
    unread: boolean;
    reviewRequestedAt: string | null;
    reviewed: boolean;
    paymentRequestedAt: string | null;
    paymentRequestedAmount: number | null;
}

interface EnquiryCardProps {
    enquiry: Enquiry;
    currency: string;
    // the creator's own name, for signing the messages they send
    creatorName: string;
    // the payment page or UPI id used last time, so it's typed once
    paymentLink: string;
    onUpdate: (change: EnquiryUpdate) => void;
    // after a review or payment request went out: what to show on the card now
    onSent: (change: Partial<Enquiry>, paymentLink?: string) => void;
    onRemove: () => void;
}

// Each stage as a coloured dot and a line saying what it means, in the status dropdown
const STATUS_LOOK: Record<EnquiryStatus, { dot: string; hint: string }> = {
    NEW: { dot: "#e0408f", hint: "Not answered yet" },
    REPLIED: { dot: "#f0a35e", hint: "You've written back" },
    BOOKED: { dot: "#0b4d2c", hint: "The work is confirmed" },
    PAID: { dot: "#22a06b", hint: "The money is in" },
    CLOSED: { dot: "#b5b5b0", hint: "It didn't go ahead" },
};
const STATUS_OPTIONS = ENQUIRY_STATUSES.map((status) => ({ value: status, label: STATUS_LABELS[status], ...STATUS_LOOK[status] }));

const DAY = 24 * 60 * 60 * 1000;

export function EnquiryCard({ enquiry, currency, creatorName, paymentLink, onUpdate, onSent, onRemove }: EnquiryCardProps) {
    // what's typed in the amount box, saved when it loses focus
    const [amount, setAmount] = useState(enquiry.amount?.toString() ?? "");
    const [asking, setAsking] = useState(false);
    const [requesting, setRequesting] = useState(false);
    // the review link, once made, while the creator sends it
    const [reviewLink, setReviewLink] = useState<string | null>(null);
    const money = (value: number) => formatMoney(value, currency);
    // the creator's clock, worked out once when the card first draws (not on every render)
    const [now] = useState(() => Date.now());
    const waitingDays = enquiry.status === "NEW" ? Math.floor((now - new Date(enquiry.createdAt).getTime()) / DAY) : 0;

    function saveAmount() {
        const value = amount.trim() === "" ? null : Math.round(Number(amount));
        if (value === enquiry.amount || (value !== null && (!Number.isFinite(value) || value < 0))) return;
        onUpdate({ amount: value });
    }

    // Makes the client's one-time review link; the creator then sends it themselves (or has Roselle email it)
    async function askForReview(via: "self" | "roselle" = "self") {
        setAsking(true);
        try {
            const { reviewRequestedAt, link } = await api<{ reviewRequestedAt: string; link: string }>(`/enquiry/${enquiry.id}/review-request`, { method: "POST", body: { via } });
            onSent({ reviewRequestedAt });
            if (via === "roselle") {
                setReviewLink(null);
                toast(`Review request emailed to ${enquiry.name}`, { detail: "From \"you via Roselle\". You'll be emailed when they write." });
            } else {
                setReviewLink(link);
            }
        } catch (failure) {
            toast.error("Couldn't make the review link", (failure as Error).message);
        } finally {
            setAsking(false);
        }
    }

    return (
        <li className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {enquiry.unread && <span className="size-2 rounded-full bg-pink" aria-label="New" />}
                <span className="font-semibold">{enquiry.name}</span>
                <span className="text-sm text-muted">{enquiry.email}</span>
                <span className="ml-auto text-xs text-muted"><LocalTime iso={enquiry.createdAt} /></span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-semibold empty:hidden">
                {/* the longer someone waits, the less likely they book: said plainly on the card */}
                {waitingDays >= 1 && (
                    <Chip tone="bg-pink/10 text-pink" icon={<IconClock size={13} />}>
                        Waiting {waitingDays} day{waitingDays === 1 ? "" : "s"}
                    </Chip>
                )}
                {enquiry.service && <Chip tone="bg-blush text-ink">{enquiry.service}</Chip>}
                {enquiry.phone && <Chip icon={<IconBrandWhatsapp size={13} />}>{enquiry.phone}</Chip>}
                {enquiry.wantedOn && <Chip icon={<IconCalendarEvent size={13} />}>{/* a plain day with no time zone; noon keeps it on that day everywhere */}
                        <LocalTime iso={`${enquiry.wantedOn}T12:00:00`} format="date" /></Chip>}
                {enquiry.paymentRequestedAt && enquiry.paymentRequestedAmount !== null && (
                    <Chip icon={<IconCash size={13} />}>
                        {money(enquiry.paymentRequestedAmount)} requested <LocalTime iso={enquiry.paymentRequestedAt} format="date" />
                    </Chip>
                )}
                {enquiry.reviewed ? (
                    <Chip tone="bg-success/10 text-success" icon={<IconStar size={13} />}>Reviewed</Chip>
                ) : (
                    enquiry.reviewRequestedAt && <Chip icon={<IconStar size={13} />}>Review asked <LocalTime iso={enquiry.reviewRequestedAt} format="date" /></Chip>
                )}
            </div>

            <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink/85">{enquiry.message}</p>
            <p className="mt-2 text-xs text-muted">Came from {enquiry.source}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <Dropdown look="chip" value={enquiry.status} options={STATUS_OPTIONS} onChange={(status) => onUpdate({ status })} label="Where this enquiry stands" />

                {/* what it's worth only matters once it's work won */}
                {isWon(enquiry.status) && (
                    <label className="flex h-8 items-center gap-1.5 rounded-full border border-line px-3 text-[13px]">
                        <span className="text-muted">Worth</span>
                        <span className="font-semibold">{currencySymbol(currency)}</span>
                        <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            step={1}
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            onBlur={saveAmount}
                            onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
                            placeholder="0"
                            aria-label="What this booking is worth"
                            className="w-24 bg-transparent font-semibold tabular-nums outline-none"
                        />
                    </label>
                )}

                {enquiry.status === "BOOKED" && !requesting && (
                    <Action onClick={() => setRequesting(true)} icon={<IconCash size={15} />}>
                        {enquiry.paymentRequestedAt ? "Request again" : "Request payment"}
                    </Action>
                )}
                {enquiry.status === "PAID" && !enquiry.reviewed && !reviewLink && (
                    <Action onClick={() => askForReview()} busy={asking} icon={<IconStar size={15} />}>
                        {enquiry.reviewRequestedAt ? "Ask again" : "Ask for a review"}
                    </Action>
                )}

                <a
                    href={`mailto:${enquiry.email}?subject=${encodeURIComponent(enquiry.service ? `Re: ${enquiry.service}` : "Re: your message")}`}
                    // writing back is replying: a new enquiry moves to Replied by itself
                    onClick={() => enquiry.status === "NEW" && onUpdate({ status: "REPLIED" })}
                    className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-[#2e2e2e]"
                >
                    <IconMail size={15} /> Reply
                </a>
                <button onClick={onRemove} aria-label="Delete enquiry" className="flex size-8 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-danger">
                    <IconTrash size={15} />
                </button>
            </div>

            {reviewLink && (
                <div className="mt-4 rounded-xl bg-sand/60 p-4">
                    <p className="text-sm font-semibold">Ask {enquiry.name} for a review</p>
                    <p className="mt-0.5 text-xs text-muted">The link inside works once, for {REVIEW_LINK_DAYS} days, so the review can only come from {firstName(enquiry.name)}.</p>
                    <SendOptions
                        enquiry={enquiry}
                        message={reviewMessage({ creator: creatorName, client: enquiry.name, service: enquiry.service, link: reviewLink, days: REVIEW_LINK_DAYS })}
                        onSent={(how) => {
                            setReviewLink(null);
                            toast(how === "copy" ? "Review message copied" : `Review request ready to send to ${firstName(enquiry.name)}`, { detail: SENT_HINTS[how] + " You'll be emailed when they write." });
                        }}
                        onRoselle={() => askForReview("roselle")}
                        onCancel={() => setReviewLink(null)}
                    />
                </div>
            )}

            {requesting && (
                <PaymentRequest
                    enquiry={enquiry}
                    currency={currency}
                    creatorName={creatorName}
                    paymentLink={paymentLink}
                    onCancel={() => setRequesting(false)}
                    onSent={(change, link) => {
                        setRequesting(false);
                        onSent(change, link);
                    }}
                />
            )}
        </li>
    );
}

const firstName = (name: string) => name.trim().split(/\s+/)[0];

type How = "whatsapp" | "email" | "copy";

// What to do next, after each way of sending
const SENT_HINTS: Record<How, string> = {
    whatsapp: "Send it in WhatsApp.",
    email: "Send it from your email app.",
    copy: "Paste it wherever you talk to them.",
};

// How much to ask for (the booking's value to start with, or a deposit), where they pay, and a line
// of explanation; then the message itself, sent from the creator's own WhatsApp or email. Roselle
// records the request either way; the money goes straight to the creator.
function PaymentRequest({ enquiry, currency, creatorName, paymentLink, onCancel, onSent }: { enquiry: Enquiry; currency: string; creatorName: string; paymentLink: string; onCancel: () => void; onSent: EnquiryCardProps["onSent"] }) {
    const [amount, setAmount] = useState(enquiry.amount?.toString() ?? "");
    const [link, setLink] = useState(paymentLink);
    const [note, setNote] = useState("");
    const field = "h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink";

    const due = Math.round(Number(amount));
    const target = paymentTarget(link);
    const request = due > 0 && target ? { creator: creatorName, client: enquiry.name, amount: due, currency, service: enquiry.service, note: note.trim(), target } : null;

    // Recorded when it's sent, whichever way: that's what "waiting to be paid" and the card count on
    async function record(via: "self" | "roselle", how?: How) {
        try {
            const sent = await api<{ paymentRequestedAt: string; paymentRequestedAmount: number }>(`/enquiry/${enquiry.id}/payment-request`, {
                method: "POST",
                body: { amount: due, link, note, via },
            });
            onSent(sent, link);
            const asked = `${formatMoney(due, currency)} requested from ${firstName(enquiry.name)}`;
            if (via === "roselle") toast(`Payment request emailed to ${enquiry.name}`, { detail: `${formatMoney(due, currency)}, from "you via Roselle". Mark it Paid when the money arrives.` });
            else toast(how === "copy" ? "Message copied" : asked, { detail: `${SENT_HINTS[how!]} Mark it Paid when the money arrives.` });
        } catch (failure) {
            toast.error("The request wasn't recorded", (failure as Error).message);
        }
    }

    return (
        <div className="mt-4 rounded-xl bg-sand/60 p-4">
            <p className="text-sm font-semibold">Request payment from {enquiry.name}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[10rem_1fr]">
                <label className="text-xs font-semibold text-muted">
                    Amount ({currencySymbol(currency)})
                    <input type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Full amount or a deposit" className={`${field} mt-1 tabular-nums`} />
                </label>
                <label className="text-xs font-semibold text-muted">
                    Where they pay
                    <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="A UPI ID like you@okbank, or https://buy.stripe.com/…" className={`${field} mt-1`} />
                    {link.trim() && !target && <span className="mt-1 block font-normal text-danger">Use a UPI ID (name@bank) or a payment page address starting with https://</span>}
                </label>
            </div>
            <label className="mt-2 block text-xs font-semibold text-muted">
                A note (optional)
                <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="50% deposit to hold the date. The rest after delivery." className={`${field} mt-1`} />
            </label>

            {request ? (
                <SendOptions
                    enquiry={enquiry}
                    message={paymentMessage(request)}
                    onSent={(how) => {
                        onCancel();
                        record("self", how);
                    }}
                    onRoselle={() => {
                        onCancel();
                        record("roselle");
                    }}
                    onCancel={onCancel}
                />
            ) : (
                <div className="mt-3 flex items-center gap-3">
                    <p className="flex-1 text-[13px] text-muted">Add an amount and where they pay, and your message to {firstName(enquiry.name)} appears here, ready to send.</p>
                    <Action onClick={onCancel}>Cancel</Action>
                </div>
            )}
        </div>
    );
}

// The message, as the client will read it, and the ways to send it: the creator's own WhatsApp,
// their own email, or copied for anywhere else. Roselle emailing it is the quiet last option.
function SendOptions({ enquiry, message, onSent, onRoselle, onCancel }: { enquiry: Enquiry; message: { subject: string; text: string }; onSent: (how: How) => void; onRoselle: () => void; onCancel: () => void }) {
    const button = "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition";

    async function copy() {
        try {
            await navigator.clipboard.writeText(message.text);
            onSent("copy");
        } catch {
            toast.error("Couldn't copy", "Select the message and copy it yourself.");
        }
    }

    return (
        <div className="mt-3">
            <p className="text-xs font-semibold text-muted">Your message</p>
            <p className="mt-1 max-h-48 overflow-y-auto rounded-xl bg-paper p-3 text-[13px] leading-relaxed whitespace-pre-line text-ink/85 select-text">{message.text}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {/* links, not scripts: they open WhatsApp or the email app straight from the click */}
                <a href={whatsappLink(message.text, enquiry.phone)} target="_blank" rel="noopener noreferrer" onClick={() => onSent("whatsapp")} className={`${button} bg-[#25d366] text-white hover:bg-[#1fb857]`}>
                    <IconBrandWhatsapp size={16} /> WhatsApp
                </a>
                <a href={emailLink(enquiry.email, message)} onClick={() => onSent("email")} className={`${button} bg-ink text-white hover:bg-[#2e2e2e]`}>
                    <IconMail size={15} /> My email
                </a>
                <button type="button" onClick={copy} className={`${button} border border-line bg-paper hover:border-line-strong`}>
                    <IconCopy size={15} /> Copy
                </button>
                <button type="button" onClick={onCancel} className={`${button} text-muted hover:text-ink`}>
                    Cancel
                </button>
            </div>
            <p className="mt-2.5 text-xs text-muted">
                {enquiry.phone ? `WhatsApp opens your chat with ${enquiry.phone}.` : `${firstName(enquiry.name)} didn't leave a number, so WhatsApp asks which chat.`}{" "}
                <button type="button" onClick={onRoselle} className="font-semibold text-ink underline-offset-2 hover:underline">
                    Or let Roselle email it for you
                </button>
            </p>
        </div>
    );
}

function Chip({ tone = "bg-sand text-ink", icon, children }: { tone?: string; icon?: ReactNode; children: ReactNode }) {
    return (
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${tone}`}>
            {icon}
            {children}
        </span>
    );
}

function Action({ onClick, busy = false, disabled = false, primary = false, icon, children }: { onClick: () => void; busy?: boolean; disabled?: boolean; primary?: boolean; icon?: ReactNode; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy || disabled}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition disabled:opacity-60 ${primary ? "bg-ink text-white hover:bg-[#2e2e2e]" : "border border-line hover:border-line-strong"}`}
        >
            {busy ? <IconLoader2 size={15} className="animate-spin" /> : icon}
            {busy ? "Sending…" : children}
        </button>
    );
}
