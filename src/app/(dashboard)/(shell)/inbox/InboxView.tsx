"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { IconPencil } from "@tabler/icons-react";

import { api } from "@/lib/api/client";
import { STATUS_LABELS, summarise } from "@/lib/bookings";
import { EmptyState } from "@/components/EmptyState";
import { Dropdown } from "@/components/Dropdown";
import { toast } from "@/components/Toast";
import { currencySymbol, formatMoney, formatNumber, formatPercent } from "@/lib/utils/format";
import { CURRENCIES, type EnquiryStatus, type EnquiryUpdate } from "@/lib/validations/enquiry";
import { EnquiryCard, type Enquiry } from "./EnquiryCard";

// each currency with its symbol, so "INR" also reads "₹" (not when the symbol is just the code again)
const CURRENCY_OPTIONS = CURRENCIES.map((code) => ({ value: code as string, label: currencySymbol(code) === code ? code : `${code}  ${currencySymbol(code)}` }));

// The tabs: "Open" is what still needs a reply or a decision, the default view
const TABS = [
    { key: "open", label: "Open", has: (status: EnquiryStatus) => status === "NEW" || status === "REPLIED" },
    { key: "booked", label: "Booked", has: (status: EnquiryStatus) => status === "BOOKED" },
    { key: "paid", label: "Paid", has: (status: EnquiryStatus) => status === "PAID" },
    { key: "closed", label: "Not going ahead", has: (status: EnquiryStatus) => status === "CLOSED" },
    { key: "all", label: "All", has: () => true },
] as const;

interface InboxViewProps {
    enquiries: Enquiry[];
    currency: string;
    creatorName: string;
    monthlyGoal: number | null;
    paymentLink: string;
}

// what an empty tab says
const EMPTY_TABS: Record<(typeof TABS)[number]["key"], string> = {
    open: "All caught up",
    booked: "Nothing booked right now",
    paid: "Nothing paid yet",
    closed: "Nothing turned down",
    all: "No enquiries yet",
};

export function InboxView({ enquiries: initial, currency: initialCurrency, creatorName, monthlyGoal, paymentLink: initialLink }: InboxViewProps) {
    const [enquiries, setEnquiries] = useState(initial);
    const [currency, setCurrency] = useState(initialCurrency);
    const [goal, setGoal] = useState(monthlyGoal);
    const [paymentLink, setPaymentLink] = useState(initialLink);
    const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("open");
    // enquiries changed while on this tab stay in view until the tab changes, so marking one
    // Booked doesn't whisk it away before its amount is filled in
    const [stay, setStay] = useState<number[]>([]);

    const summary = summarise(enquiries);
    const money = (amount: number) => formatMoney(amount, currency);
    const shown = enquiries.filter((enquiry) => TABS.find((t) => t.key === tab)!.has(enquiry.status) || stay.includes(enquiry.id));

    // What each change says once it's saved: what happened, and the natural next step
    const confirmation = (name: string, change: EnquiryUpdate): [string, string?] =>
        change.status === "BOOKED"
            ? [`${name} is booked`, "Add what it's worth, then request a deposit if you take one."]
            : change.status === "PAID"
              ? [`${name} has paid`, "A good moment to ask for a review."]
              : change.status
                ? [`Moved to ${STATUS_LABELS[change.status]}`]
                : [`Saved: worth ${money(change.amount ?? 0)}`];

    // shown straight away, saved behind; put back if the save fails
    async function update(id: number, change: EnquiryUpdate) {
        const before = enquiries;
        const name = enquiries.find((enquiry) => enquiry.id === id)?.name ?? "Enquiry";
        setStay((current) => (current.includes(id) ? current : [...current, id]));
        setEnquiries((current) => current.map((enquiry) => (enquiry.id === id ? { ...enquiry, ...change } : enquiry)));
        try {
            const saved = await api<Pick<Enquiry, "status" | "amount" | "bookedAt">>(`/enquiry/${id}`, { method: "PATCH", body: change });
            setEnquiries((current) => current.map((enquiry) => (enquiry.id === id ? { ...enquiry, ...saved } : enquiry)));
            const [message, detail] = confirmation(name, change);
            toast(message, { detail });
        } catch (failure) {
            setEnquiries(before);
            toast.error("That change wasn't saved", (failure as Error).message);
        }
    }

    async function remove(id: number) {
        if (!window.confirm("Delete this enquiry? It can't be undone.")) return;
        try {
            await api(`/enquiry/${id}`, { method: "DELETE" });
            setEnquiries((current) => current.filter((enquiry) => enquiry.id !== id));
            toast("Enquiry deleted");
        } catch (failure) {
            toast.error("Couldn't delete it", (failure as Error).message);
        }
    }

    async function changeCurrency(next: string) {
        const before = currency;
        setCurrency(next);
        try {
            await api("/settings/business", { method: "PUT", body: { currency: next } });
            toast(`Amounts are now in ${next}`, { detail: "The numbers stay the same; only the currency changes." });
        } catch (failure) {
            setCurrency(before);
            toast.error("Couldn't change the currency", (failure as Error).message);
        }
    }

    async function changeGoal(next: number | null) {
        const before = goal;
        setGoal(next);
        try {
            await api("/settings/business", { method: "PUT", body: { monthlyGoal: next } });
            toast(next ? `Goal set: ${money(next)} this month` : "Monthly goal removed");
        } catch (failure) {
            setGoal(before);
            toast.error("Couldn't save the goal", (failure as Error).message);
        }
    }

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-5xl">Inbox</h1>
                        <p className="mt-2 text-sm text-muted">Enquiries from your page, and the work they turn into.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                        Amounts in
                        <Dropdown look="chip" value={currency} options={CURRENCY_OPTIONS} onChange={changeCurrency} label="Currency for amounts" className="bg-paper shadow-soft" />
                    </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <Tile tone="bg-forest text-white" label="Booked this month" value={money(summary.bookedThisMonth)}>
                        <Goal booked={summary.bookedThisMonth} goal={goal} currency={currency} onChange={changeGoal} />
                    </Tile>
                    <Tile tone="bg-blush text-ink" label="Waiting to be paid" value={money(summary.awaitingPayment)} />
                    <Tile tone="bg-paper text-ink shadow-soft" label="Open enquiries" value={formatNumber(summary.open)} />
                </div>

                <nav aria-label="Filter enquiries" className="mt-8 flex gap-1 overflow-x-auto rounded-full bg-sand p-1 [scrollbar-width:none] sm:w-fit">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => {
                                setTab(t.key);
                                setStay([]);
                            }}
                            aria-pressed={tab === t.key}
                            className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition ${tab === t.key ? "bg-paper text-ink shadow-soft" : "text-muted hover:text-ink"}`}
                        >
                            {t.label} <span className="font-normal text-muted tabular-nums">{enquiries.filter((enquiry) => t.has(enquiry.status)).length}</span>
                        </button>
                    ))}
                </nav>

                {enquiries.length === 0 ? (
                    <EmptyInbox />
                ) : shown.length === 0 ? (
                    <EmptyState compact picture="tray" title={EMPTY_TABS[tab]} />
                ) : (
                    <ul className="mt-5 space-y-3">
                        {shown.map((enquiry) => (
                            <EnquiryCard
                                key={enquiry.id}
                                enquiry={enquiry}
                                currency={currency}
                                creatorName={creatorName}
                                paymentLink={paymentLink}
                                onUpdate={(change) => update(enquiry.id, change)}
                                onSent={(change, link) => {
                                    setEnquiries((current) => current.map((e) => (e.id === enquiry.id ? { ...e, ...change } : e)));
                                    if (link) setPaymentLink(link);
                                }}
                                onRemove={() => remove(enquiry.id)}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}

function Tile({ tone, label, value, children }: { tone: string; label: string; value: string; children?: ReactNode }) {
    return (
        <div className={`rounded-3xl p-5 ${tone}`}>
            <p className="text-[13px] font-bold opacity-80">{label}</p>
            <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
            {children}
        </div>
    );
}

// The month's target as a bar under "Booked this month". Set or changed in place; cleared by
// leaving it empty.
function Goal({ booked, goal, currency, onChange }: { booked: number; goal: number | null; currency: string; onChange: (goal: number | null) => void }) {
    const [editing, setEditing] = useState(false);

    if (editing) {
        return (
            <form
                className="mt-3 flex items-center gap-1.5 text-sm"
                onSubmit={(event) => {
                    event.preventDefault();
                    const value = Math.round(Number(new FormData(event.currentTarget).get("goal")));
                    onChange(value > 0 ? value : null);
                    setEditing(false);
                }}
            >
                <span className="opacity-80">{currencySymbol(currency)}</span>
                <input name="goal" type="number" min={1} step={1} defaultValue={goal ?? ""} autoFocus placeholder="Monthly goal" aria-label="Monthly goal" className="h-8 w-28 rounded-lg bg-white/15 px-2 tabular-nums outline-none placeholder:text-white/50" />
                <button className="h-8 rounded-lg bg-white px-2.5 font-semibold text-forest">Save</button>
            </form>
        );
    }

    if (!goal) {
        return (
            <button onClick={() => setEditing(true)} className="mt-3 text-sm font-semibold underline-offset-4 opacity-80 hover:underline hover:opacity-100">
                Set a monthly goal
            </button>
        );
    }

    const share = Math.min(booked / goal, 1);
    return (
        <div className="mt-3">
            <span className="block h-1.5 rounded-full bg-white/20">
                <span className="block h-full rounded-full bg-rose" style={{ width: `${share * 100}%` }} />
            </span>
            <button onClick={() => setEditing(true)} className="mt-1.5 flex items-center gap-1 text-xs font-semibold opacity-80 hover:opacity-100">
                {formatPercent(booked / goal)} of {formatMoney(goal, currency)} <IconPencil size={12} />
            </button>
        </div>
    );
}

function EmptyInbox() {
    return (
        <div className="mt-6">
            <EmptyState picture="inbox" title="No enquiries yet">
                Add a <span className="font-semibold text-ink">Services</span> or <span className="font-semibold text-ink">Contact form</span> block in the{" "}
                <Link href="/editor" className="font-semibold text-pink hover:underline">
                    editor
                </Link>{" "}
                and people can ask to work with you. Every message lands here and in your email.
            </EmptyState>
        </div>
    );
}
