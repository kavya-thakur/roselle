import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { listAccounts, listPayments, overview, type AccountFilter, type PeriodFilter } from "@/lib/admin";
import { REPORT_REASONS, type ReportReason } from "@/lib/validations/report";
import { AdminView } from "./AdminView";
import { Accounts, adminHref, Overview, Payments } from "./parts";

export const metadata: Metadata = { title: "Admin" };

const TABS = { overview: "Overview", payments: "Payments", accounts: "Accounts", reports: "Reports" } as const;
type Tab = keyof typeof TABS;

const pick = <T extends string>(value: unknown, allowed: readonly T[]) => (allowed.includes(value as T) ? (value as T) : undefined);

// Running Roselle: the numbers at a glance, who has paid, every account and its plan, and reports
// from visitors. Admins only; anyone else gets the same 404 as for a page that doesn't exist.
// Which tab, search and filter are in the address (?tab=payments&period=thisMonth), so each view
// can be bookmarked and Back works.
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!isAdmin(user.email)) notFound();

    const params = await searchParams;
    const tab = pick(params.tab, Object.keys(TABS) as Tab[]) ?? "overview";
    const search = typeof params.q === "string" ? params.q.trim().slice(0, 100) || undefined : undefined;
    const page = Math.min(Math.max(Number(params.page) || 1, 1), 10_000);
    const openReports = await prisma.report.count({ where: { resolvedAt: null } });

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">
                <h1 className="font-display text-5xl">Admin</h1>

                <nav aria-label="Admin" className="mt-6 flex gap-1 overflow-x-auto border-b border-line">
                    {(Object.keys(TABS) as Tab[]).map((value) => (
                        <Link
                            key={value}
                            href={adminHref({ tab: value === "overview" ? undefined : value })}
                            aria-current={tab === value ? "page" : undefined}
                            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 text-sm font-semibold transition ${tab === value ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}
                        >
                            {TABS[value]}
                            {value === "reports" && openReports > 0 && <span className="rounded-full bg-pink px-1.5 text-[11px] text-white">{openReports}</span>}
                        </Link>
                    ))}
                </nav>

                {tab === "overview" && <Overview data={await overview()} />}
                {tab === "payments" && <PaymentsTab search={search} period={pick(params.period, ["thisMonth", "lastMonth"] as const)} page={page} />}
                {tab === "accounts" && <AccountsTab search={search} filter={pick(params.filter, ["pro", "ending", "free"] as const)} page={page} />}
                {tab === "reports" && <ReportsTab />}
            </div>
        </main>
    );
}

async function PaymentsTab({ search, period, page }: { search?: string; period?: PeriodFilter; page: number }) {
    return <Payments data={await listPayments({ search, period, page })} search={search} period={period} page={page} />;
}

async function AccountsTab({ search, filter, page }: { search?: string; filter?: AccountFilter; page: number }) {
    return <Accounts data={await listAccounts({ search, filter, page })} search={search} filter={filter} page={page} />;
}

// Reports waiting for a decision, and the pages that are taken down
async function ReportsTab() {
    const [reports, suspended] = await Promise.all([
        prisma.report.findMany({
            where: { resolvedAt: null },
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, reason: true, details: true, email: true, createdAt: true, page: { select: { username: true, suspendedAt: true } } },
        }),
        prisma.page.findMany({
            where: { suspendedAt: { not: null } },
            orderBy: { suspendedAt: "desc" },
            take: 200,
            select: { username: true, suspendedAt: true, suspendedReason: true },
        }),
    ]);

    return (
        <AdminView
            reports={reports.map((report) => ({
                id: report.id,
                username: report.page.username,
                pageDown: !!report.page.suspendedAt,
                reason: REPORT_REASONS[report.reason as ReportReason] ?? report.reason,
                details: report.details,
                email: report.email,
                createdAt: report.createdAt.toISOString(),
            }))}
            suspended={suspended.map((page) => ({ username: page.username, reason: page.suspendedReason ?? "", suspendedAt: page.suspendedAt!.toISOString() }))}
        />
    );
}
