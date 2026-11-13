"use client";

import { useState, type ReactNode } from "react";
import { IconCalendarEvent, IconCash, IconClock, IconMail, IconStar, IconTrash } from "@tabler/icons-react";

import { api } from "@/lib/api/client";
import { isWon, STATUS_LABELS } from "@/lib/bookings";
import { currencySymbol, formatMoney } from "@/lib/utils/format";
import { ENQUIRY_STATUSES, type EnquiryStatus, type EnquiryUpdate } from "@/lib/validations/enquiry";

export interface Enquiry {
    id: number;
    name: string;
    email: string;
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
    // the payment page or UPI id used last time, so it's typed once
    paymentLink: string;
    onUpdate: (change: EnquiryUpdate) => void;
    // after a review or payment request went out: what to show on the card now
    onSent: (change: Partial<Enquiry>, paymentLink?: string) => void;
    onRemove: () => void;
}

const STATUS_COLOURS: Record<EnquiryStatus, string> = {
    NEW: "bg-pink text-white",
    REPLIED: "bg-sand text-ink",
    BOOKED: "bg-forest text-white",
    PAID: "bg-success text-white",
    CLOSED: "bg-line text-muted",
};

const DAY = 24 * 60 * 60 * 1000;
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
const date = (iso: string) => new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
// a wanted date is a plain day with no time zone; noon keeps it on that day everywhere
const day = (plain: string) => date(`${plain}T12:00:00`);

export function EnquiryCard({ enquiry, currency, paymentLink, onUpdate, onSent, onRemove }: EnquiryCardProps) {
    // what's typed in the amount box, saved when it loses focus
    const [amount, setAmount] = useState(enquiry.amount?.toString() ?? "");
    const [asking, setAsking] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const money = (value: number) => formatMoney(value, currency);
    // the creator's clock, worked out once when the card first draws (not on every render)
    const [now] = useState(() => Date.now());
    const waitingDays = enquiry.status === "NEW" ? Math.floor((now - new Date(enquiry.createdAt).getTime()) / DAY) : 0;

    function saveAmount() {
        const value = amount.trim() === "" ? null : Math.round(Number(amount));
        if (value === enquiry.amount || (value !== null && (!Number.isFinite(value) || value < 0))) return;
        onUpdate({ amount: value });
    }

    async function askForReview() {
        setAsking(true);
        setError(null);
        try {
            const sent = await api<{ reviewRequestedAt: string }>(`/enquiry/${enquiry.id}/review-request`, { method: "POST" });
            onSent(sent);
        } catch (failure) {
            setError((failure as Error).message);
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
                <span className="ml-auto text-xs text-muted">{when(enquiry.createdAt)}</span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs font-semibold empty:hidden">
                {/* the longer someone waits, the less likely they book: said plainly on the card */}
                {waitingDays >= 1 && (
                    <Chip tone="bg-pink/10 text-pink" icon={<IconClock size={13} />}>
                        Waiting {waitingDays} day{waitingDays === 1 ? "" : "s"}
                    </Chip>
                )}
                {enquiry.service && <Chip tone="bg-blush text-ink">{enquiry.service}</Chip>}
                {enquiry.wantedOn && <Chip icon={<IconCalendarEvent size={13} />}>{day(enquiry.wantedOn)}</Chip>}
                {enquiry.paymentRequestedAt && enquiry.paymentRequestedAmount !== null && (
                    <Chip icon={<IconCash size={13} />}>
                        {money(enquiry.paymentRequestedAmount)} requested {date(enquiry.paymentRequestedAt)}
                    </Chip>
                )}
                {enquiry.reviewed ? (
                    <Chip tone="bg-success/10 text-success" icon={<IconStar size={13} />}>Reviewed</Chip>
                ) : (
                    enquiry.reviewRequestedAt && <Chip icon={<IconStar size={13} />}>Review asked {date(enquiry.reviewRequestedAt)}</Chip>
                )}
            </div>

            <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink/85">{enquiry.message}</p>
            <p className="mt-2 text-xs text-muted">Came from {enquiry.source}</p>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <select
                    value={enquiry.status}
                    onChange={(event) => onUpdate({ status: event.target.value as EnquiryStatus })}
                    aria-label="Where this enquiry stands"
                    className={`h-8 rounded-full border-0 px-3 text-[13px] font-semibold ${STATUS_COLOURS[enquiry.status]}`}
                >
                    {ENQUIRY_STATUSES.map((status) => (
                        <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                        </option>
                    ))}
                </select>

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

                {enquiry.status === "BOOKED" && !requesting && <Action onClick={() => setRequesting(true)} icon={<IconCash size={15} />}>Request payment</Action>}
                {enquiry.status === "PAID" && !enquiry.reviewed && (
                    <Action onClick={askForReview} busy={asking} icon={<IconStar size={15} />}>
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

            {requesting && (
                <PaymentRequest
                    enquiry={enquiry}
                    currency={currency}
                    paymentLink={paymentLink}
                    onCancel={() => setRequesting(false)}
                    onSent={(change, link) => {
                        setRequesting(false);
                        onSent(change, link);
                    }}
                />
            )}
            {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        </li>
    );
}

// How much to ask for (the booking's value to start with, or a deposit), where they pay, and a
// line of explanation. The client gets it by email from "<creator> via Roselle".
function PaymentRequest({ enquiry, currency, paymentLink, onCancel, onSent }: { enquiry: Enquiry; currency: string; paymentLink: string; onCancel: () => void; onSent: EnquiryCardProps["onSent"] }) {
    const [amount, setAmount] = useState(enquiry.amount?.toString() ?? "");
    const [link, setLink] = useState(paymentLink);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const field = "h-10 w-full rounded-xl border border-line bg-paper px-3 text-sm outline-none focus:border-ink";

    async function send() {
        setBusy(true);
        setError(null);
        try {
            const sent = await api<{ paymentRequestedAt: string; paymentRequestedAmount: number }>(`/enquiry/${enquiry.id}/payment-request`, {
                method: "POST",
                body: { amount: Math.round(Number(amount)) || 0, link, note },
            });
            onSent(sent, link);
        } catch (failure) {
            setError((failure as Error).message);
            setBusy(false);
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
                    <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://buy.stripe.com/… or a UPI ID like you@okbank" className={`${field} mt-1`} />
                </label>
            </div>
            <label className="mt-2 block text-xs font-semibold text-muted">
                A note (optional)
                <input value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="50% deposit to hold the date. The rest after delivery." className={`${field} mt-1`} />
            </label>
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-3 flex gap-2">
                <Action onClick={send} busy={busy} primary icon={<IconMail size={15} />}>
                    Email it to {enquiry.name}
                </Action>
                <Action onClick={onCancel}>Cancel</Action>
            </div>
            <p className="mt-2 text-xs text-muted">The money goes straight to you. Mark it Paid when it arrives.</p>
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

function Action({ onClick, busy = false, primary = false, icon, children }: { onClick: () => void; busy?: boolean; primary?: boolean; icon?: ReactNode; children: ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={busy}
            className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition disabled:opacity-60 ${primary ? "bg-ink text-white hover:bg-[#2e2e2e]" : "border border-line hover:border-line-strong"}`}
        >
            {icon}
            {busy ? "Sending…" : children}
        </button>
    );
}
