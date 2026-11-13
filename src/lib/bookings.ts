import type { EnquiryStatus } from "@/lib/validations/enquiry";

// How each stage reads in the inbox
export const STATUS_LABELS: Record<EnquiryStatus, string> = {
    NEW: "New",
    REPLIED: "Replied",
    BOOKED: "Booked",
    PAID: "Paid",
    CLOSED: "Not going ahead",
};

// Booked and paid are both work won; "paid" just means the money is in
export const isWon = (status: EnquiryStatus) => status === "BOOKED" || status === "PAID";

// What changes when an enquiry moves to `status`: it's counted as booked from the moment it's
// first won, and stops counting if it's moved back or closed. Paid keeps the original booking date.
export function bookedAtFor(status: EnquiryStatus, bookedAt: Date | null, now = new Date()) {
    if (!isWon(status)) return null;
    return bookedAt ?? now;
}

interface Tracked {
    status: EnquiryStatus;
    amount: number | null;
    bookedAt: string | null;
}

// The three numbers at the top of the inbox: work won this calendar month (booked or paid,
// counted on the day it was booked), money still to come in, and enquiries still being talked
// about. "This month" is the creator's own month, so this runs in their browser.
export function summarise(enquiries: Tracked[], now = new Date()) {
    const sameMonth = (iso: string) => {
        const date = new Date(iso);
        return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    };

    return {
        bookedThisMonth: enquiries.filter((e) => isWon(e.status) && e.bookedAt && sameMonth(e.bookedAt)).reduce((sum, e) => sum + (e.amount ?? 0), 0),
        awaitingPayment: enquiries.filter((e) => e.status === "BOOKED").reduce((sum, e) => sum + (e.amount ?? 0), 0),
        open: enquiries.filter((e) => e.status === "NEW" || e.status === "REPLIED").length,
    };
}

// The first time an enquiry moves on from New is when the creator replied. Kept after that, so
// moving it around later doesn't change how fast they answered.
export function repliedAtFor(status: EnquiryStatus, repliedAt: Date | null, now = new Date()) {
    return repliedAt ?? (status === "NEW" ? null : now);
}

// Average hours from an enquiry arriving to the first reply, over the ones that have been answered
export function averageReplyHours(enquiries: { createdAt: Date; repliedAt: Date | null }[]) {
    const answered = enquiries.filter((e) => e.repliedAt);
    if (answered.length === 0) return null;
    const total = answered.reduce((sum, e) => sum + (e.repliedAt!.getTime() - e.createdAt.getTime()), 0);
    return total / answered.length / 3_600_000;
}

// How each service is doing: enquiries, how many were won, the share won and the average value
// of the work won. Enquiries from the contact form (no service) are left out. Most enquiries first.
export function serviceStats(enquiries: { service: string | null; status: EnquiryStatus; amount: number | null }[]) {
    const byService = new Map<string, { enquiries: number; won: number; value: number }>();
    for (const e of enquiries) {
        if (!e.service) continue;
        const row = byService.get(e.service) ?? { enquiries: 0, won: 0, value: 0 };
        row.enquiries += 1;
        if (isWon(e.status)) {
            row.won += 1;
            row.value += e.amount ?? 0;
        }
        byService.set(e.service, row);
    }

    return [...byService]
        .map(([service, row]) => ({ service, ...row, rate: row.won / row.enquiries, averageValue: row.won ? Math.round(row.value / row.won) : null }))
        .sort((a, b) => b.enquiries - a.enquiries || b.value - a.value);
}
