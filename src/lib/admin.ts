import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { planNow } from "@/lib/plans";

// What the admin screen (/admin) reads: the numbers at a glance, every payment, every account.
// Server-side only; the screen is admins only (src/lib/auth/admin.ts).

const DAY = 24 * 60 * 60 * 1000;
export const ADMIN_PAGE_SIZE = 50;

// Calendar months in India, where Roselle takes its payments: a payment at 00:30 on the 1st (IST)
// belongs to that month, though the server's clock (UTC) still says the 31st
const IST = 330 * 60 * 1000;
export function monthStart(now: Date, monthsBack = 0) {
    const local = new Date(now.getTime() + IST);
    return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - monthsBack, 1) - IST);
}

export type PeriodFilter = "thisMonth" | "lastMonth";
const createdIn = (period: PeriodFilter | undefined, now: Date) =>
    period === "thisMonth" ? { gte: monthStart(now) } : period === "lastMonth" ? { gte: monthStart(now, 1), lt: monthStart(now) } : undefined;

// Where an account stands, in a word: paid Pro, Pro given by hand (no end), Pro ending within the
// week, Pro that ran out, or Free from the start
export type Standing = "pro" | "given" | "ending" | "ended" | "free";
export function standingOf(plan: "FREE" | "PRO", proUntil: Date | null, now = new Date()): Standing {
    if (planNow(plan, proUntil, now) === "PRO") return !proUntil ? "given" : proUntil.getTime() - now.getTime() < 7 * DAY ? "ending" : "pro";
    return proUntil ? "ended" : "free";
}

// "On Pro now": made Pro by hand, or paid and not run out
const proNow = (now: Date): Prisma.UserWhereInput => ({ plan: "PRO", OR: [{ proUntil: null }, { proUntil: { gt: now } }] });

export async function overview(now = new Date()) {
    const thisMonth = monthStart(now);
    const [month, allTime, payers, onPro, ending, accounts, newAccounts, published, openReports, recent] = await Promise.all([
        prisma.payment.aggregate({ where: { createdAt: { gte: thisMonth } }, _sum: { amount: true }, _count: true }),
        prisma.payment.aggregate({ _sum: { amount: true }, _count: true }),
        prisma.payment.findMany({ distinct: ["email"], select: { email: true } }),
        prisma.user.count({ where: proNow(now) }),
        prisma.user.findMany({
            where: { plan: "PRO", proUntil: { gt: now, lt: new Date(now.getTime() + 7 * DAY) } },
            orderBy: { proUntil: "asc" },
            take: 20,
            select: { id: true, email: true, proUntil: true, page: { select: { username: true } } },
        }),
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
        prisma.page.count({ where: { publishedAt: { not: null }, suspendedAt: null } }),
        prisma.report.count({ where: { resolvedAt: null } }),
        listPayments({}, now).then((result) => result.rows.slice(0, 5)),
    ]);

    return {
        // in rupees (stored in paise)
        revenue: { thisMonth: (month._sum.amount ?? 0) / 100, thisMonthPayments: month._count, allTime: (allTime._sum.amount ?? 0) / 100, allTimePayments: allTime._count, payers: payers.length },
        onPro,
        ending,
        accounts: { total: accounts, thisMonth: newAccounts, published },
        openReports,
        recent,
    };
}

// Every payment, newest first: by an address, a page name, or a Razorpay id; this month or last
export async function listPayments({ search, period, page = 1 }: { search?: string; period?: PeriodFilter; page?: number }, now = new Date()) {
    const contains = { contains: search, mode: "insensitive" as const };
    const createdAt = createdIn(period, now);
    const where: Prisma.PaymentWhereInput = {
        ...(createdAt && { createdAt }),
        ...(search && { OR: [{ email: contains }, { razorpayPaymentId: contains }, { razorpayOrderId: contains }, { user: { page: { username: contains } } }] }),
    };
    const [rows, total, sum] = await Promise.all([
        prisma.payment.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * ADMIN_PAGE_SIZE,
            take: ADMIN_PAGE_SIZE,
            select: { id: true, email: true, period: true, amount: true, paidUntil: true, razorpayPaymentId: true, createdAt: true, user: { select: { page: { select: { username: true } } } } },
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ]);

    return {
        rows: rows.map(({ user, amount, ...payment }) => ({ ...payment, amount: amount / 100, username: user?.page?.username ?? null, deleted: !user })),
        total,
        // in rupees, of every payment the search and filter match (not only this page)
        sum: (sum._sum.amount ?? 0) / 100,
    };
}

export type AccountFilter = "pro" | "ending" | "free";

// Every account, newest first, with its plan and what it has paid in all
export async function listAccounts({ search, filter, page = 1 }: { search?: string; filter?: AccountFilter; page?: number }, now = new Date()) {
    const contains = { contains: search, mode: "insensitive" as const };
    const where: Prisma.UserWhereInput = {
        ...(search && { OR: [{ email: contains }, { page: { username: contains } }] }),
        ...(filter === "pro" && proNow(now)),
        ...(filter === "ending" && { plan: "PRO", proUntil: { gt: now, lt: new Date(now.getTime() + 7 * DAY) } }),
        ...(filter === "free" && { NOT: proNow(now) }),
    };
    const [rows, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            skip: (page - 1) * ADMIN_PAGE_SIZE,
            take: ADMIN_PAGE_SIZE,
            select: { id: true, email: true, plan: true, proUntil: true, createdAt: true, page: { select: { username: true, publishedAt: true, suspendedAt: true } } },
        }),
        prisma.user.count({ where }),
    ]);
    const paid = await prisma.payment.groupBy({ by: ["userId"], where: { userId: { in: rows.map((row) => row.id) } }, _sum: { amount: true }, _count: true });
    const paidBy = new Map(paid.map((row) => [row.userId, row]));

    return {
        rows: rows.map((row) => ({
            id: row.id,
            email: row.email,
            username: row.page?.username ?? null,
            published: !!row.page?.publishedAt,
            suspended: !!row.page?.suspendedAt,
            createdAt: row.createdAt,
            proUntil: row.proUntil,
            standing: standingOf(row.plan, row.proUntil, now),
            paid: (paidBy.get(row.id)?._sum.amount ?? 0) / 100,
            payments: paidBy.get(row.id)?._count ?? 0,
        })),
        total,
    };
}
