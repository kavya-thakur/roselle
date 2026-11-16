import type { ReactNode } from "react";
import Link from "next/link";
import { IconArrowUpRight, IconSearch } from "@tabler/icons-react";

import { LocalTime } from "@/components/LocalTime";
import { EmptyState } from "@/components/EmptyState";
import { ADMIN_PAGE_SIZE, type listAccounts, type listPayments, type overview, type Standing } from "@/lib/admin";
import { SITE_HOST } from "@/lib/site";
import { formatMoney, formatNumber } from "@/lib/utils/format";
import { ProControls } from "./ProControls";

// The admin screen's tabs other than Reports, drawn on the server: links for every filter and
// a plain form for search, so nothing here needs JavaScript except the Pro buttons.

export const rupees = (amount: number) => formatMoney(amount, "INR");
const plural = (count: number, word: string) => `${formatNumber(count)} ${word}${count === 1 ? "" : "s"}`;
const card = "rounded-2xl border border-line bg-paper shadow-soft";

// /admin with these filters; empty ones left out
export function adminHref(params: Record<string, string | number | undefined>) {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "" && value !== 1).map(([key, value]) => [key, String(value)]));
    return `/admin${query.size ? `?${query}` : ""}`;
}

const STANDING: Record<Standing, { label: string; tone: string }> = {
    pro: { label: "Pro", tone: "bg-success/10 text-success" },
    given: { label: "Pro (given)", tone: "bg-success/10 text-success" },
    ending: { label: "Pro, ending", tone: "bg-blush text-pink" },
    ended: { label: "Pro ended", tone: "bg-sand text-muted" },
    free: { label: "Free", tone: "bg-sand text-ink" },
};

export function Overview({ data }: { data: Awaited<ReturnType<typeof overview>> }) {
    const tiles = [
        { label: "Revenue this month", value: rupees(data.revenue.thisMonth), detail: plural(data.revenue.thisMonthPayments, "payment"), href: adminHref({ tab: "payments", period: "thisMonth" }) },
        { label: "Revenue in all", value: rupees(data.revenue.allTime), detail: `${plural(data.revenue.allTimePayments, "payment")} · ${plural(data.revenue.payers, "payer")}`, href: adminHref({ tab: "payments" }) },
        { label: "On Pro now", value: formatNumber(data.onPro), detail: `${data.ending.length} ending this week`, href: adminHref({ tab: "accounts", filter: "pro" }) },
        { label: "Accounts", value: formatNumber(data.accounts.total), detail: `${formatNumber(data.accounts.thisMonth)} new this month`, href: adminHref({ tab: "accounts" }) },
        { label: "Live pages", value: formatNumber(data.accounts.published), detail: "published, not taken down", href: adminHref({ tab: "accounts" }) },
        { label: "Open reports", value: formatNumber(data.openReports), detail: data.openReports ? "waiting for you" : "all clear", href: adminHref({ tab: "reports" }) },
    ];

    return (
        <>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
                {tiles.map((tile) => (
                    <Link key={tile.label} href={tile.href} className={`${card} p-4 transition hover:border-line-strong sm:p-5`}>
                        <span className="block text-xs font-semibold text-muted sm:text-sm">{tile.label}</span>
                        <span className="mt-1 block text-2xl font-semibold tabular-nums sm:text-3xl">{tile.value}</span>
                        <span className="mt-1 block text-xs text-muted">{tile.detail}</span>
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <section>
                    <h2 className="flex items-baseline justify-between text-lg font-semibold">
                        Latest payments
                        <Link href={adminHref({ tab: "payments" })} className="text-sm font-semibold text-muted hover:text-ink">
                            See all
                        </Link>
                    </h2>
                    {data.recent.length === 0 ? (
                        <EmptyState compact picture="tray" title="No payments yet" />
                    ) : (
                        <ul className={`${card} mt-3 divide-y divide-line`}>
                            {data.recent.map((payment) => (
                                <li key={payment.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold">{payment.username ? `${SITE_HOST}/${payment.username}` : payment.email}</span>
                                        <span className="block text-xs text-muted">
                                            <LocalTime iso={payment.createdAt.toISOString()} /> · a {payment.period === "yearly" ? "year" : "month"}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-semibold tabular-nums">{rupees(payment.amount)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section>
                    <h2 className="text-lg font-semibold">Pro ending this week</h2>
                    <p className="text-sm text-muted">They get a reminder email; a nudge from you may help.</p>
                    {data.ending.length === 0 ? (
                        <EmptyState compact picture="tray" title="Nobody's Pro ends this week" />
                    ) : (
                        <ul className={`${card} mt-3 divide-y divide-line`}>
                            {data.ending.map((account) => (
                                <li key={account.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold">{account.email}</span>
                                        {account.page && <span className="block truncate text-xs text-muted">{SITE_HOST}/{account.page.username}</span>}
                                    </span>
                                    <span className="shrink-0 text-xs font-semibold text-pink">
                                        Ends <LocalTime iso={account.proUntil!.toISOString()} format="date" />
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

// A search box and filter chips, as links and a GET form: the address holds the whole state
function Filters({ tab, search, placeholder, current, chips, children }: { tab: string; search?: string; placeholder: string; current?: string; chips: { value?: string; label: string; key: string }[]; children?: ReactNode }) {
    return (
        <div className="mt-6 flex flex-wrap items-center gap-2">
            <form action="/admin" className="flex h-10 min-w-0 flex-1 basis-64 items-center gap-2 rounded-full border border-line bg-paper pr-1 pl-3.5 focus-within:border-ink">
                <input type="hidden" name="tab" value={tab} />
                {current && <input type="hidden" name={chips[0].key} value={current} />}
                <IconSearch size={16} className="shrink-0 text-muted" />
                <input name="q" type="search" defaultValue={search} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none" />
                <button className="h-8 shrink-0 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white">Search</button>
            </form>
            <div className="flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                    <Link
                        key={chip.label}
                        href={adminHref({ tab, q: search, [chip.key]: chip.value })}
                        className={`flex h-8 items-center rounded-full px-3 text-[13px] font-semibold transition ${current === chip.value ? "bg-ink text-white" : "border border-line bg-paper hover:border-line-strong"}`}
                    >
                        {chip.label}
                    </Link>
                ))}
            </div>
            {children}
        </div>
    );
}

function Pager({ total, page, href }: { total: number; page: number; href: (page: number) => string }) {
    const pages = Math.ceil(total / ADMIN_PAGE_SIZE);
    if (pages <= 1) return null;
    const step = "flex h-8 items-center rounded-full border border-line bg-paper px-3 text-[13px] font-semibold hover:border-line-strong";
    return (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-end gap-2 text-sm">
            {page > 1 && <Link href={href(page - 1)} className={step}>Previous</Link>}
            <span className="text-muted tabular-nums">
                Page {page} of {pages}
            </span>
            {page < pages && <Link href={href(page + 1)} className={step}>Next</Link>}
        </nav>
    );
}

export function Payments({ data, search, period, page }: { data: Awaited<ReturnType<typeof listPayments>>; search?: string; period?: string; page: number }) {
    return (
        <>
            <Filters
                tab="payments"
                search={search}
                current={period}
                placeholder="Email, page name or Razorpay id"
                chips={[
                    { key: "period", label: "All time" },
                    { key: "period", value: "thisMonth", label: "This month" },
                    { key: "period", value: "lastMonth", label: "Last month" },
                ]}
            />
            <p className="mt-4 text-sm text-muted">
                {plural(data.total, "payment")} · <span className="font-semibold text-ink tabular-nums">{rupees(data.sum)}</span>
            </p>

            {data.rows.length === 0 ? (
                <EmptyState compact picture="tray" title={search || period ? "No payment matches" : "No payments yet"} />
            ) : (
                <div className={`${card} mt-3 overflow-x-auto`}>
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="border-b border-line text-xs text-muted">
                            <tr>
                                <th className="px-4 py-2.5 font-semibold">Paid</th>
                                <th className="px-4 py-2.5 font-semibold">Who</th>
                                <th className="px-4 py-2.5 font-semibold">For</th>
                                <th className="px-4 py-2.5 text-right font-semibold">Amount</th>
                                <th className="px-4 py-2.5 font-semibold">Pro until</th>
                                <th className="px-4 py-2.5 font-semibold">Razorpay</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {data.rows.map((payment) => (
                                <tr key={payment.id}>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <LocalTime iso={payment.createdAt.toISOString()} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="block font-semibold">{payment.email}</span>
                                        <span className="block text-xs text-muted">
                                            {payment.deleted ? "account deleted" : payment.username ? (
                                                <a href={`/${payment.username}`} target="_blank" className="hover:text-ink hover:underline">
                                                    {SITE_HOST}/{payment.username}
                                                </a>
                                            ) : null}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">A {payment.period === "yearly" ? "year" : "month"}</td>
                                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">{rupees(payment.amount)}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <LocalTime iso={payment.paidUntil.toISOString()} format="date" />
                                    </td>
                                    <td className="px-4 py-3">
                                        {/* the payment in Razorpay's dashboard: refunds, the payer's details, the method */}
                                        <a href={`https://dashboard.razorpay.com/app/payments/${payment.razorpayPaymentId}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted hover:text-ink">
                                            {payment.razorpayPaymentId} <IconArrowUpRight size={12} />
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pager total={data.total} page={page} href={(to) => adminHref({ tab: "payments", q: search, period, page: to })} />
        </>
    );
}

export function Accounts({ data, search, filter, page }: { data: Awaited<ReturnType<typeof listAccounts>>; search?: string; filter?: string; page: number }) {
    return (
        <>
            <Filters
                tab="accounts"
                search={search}
                current={filter}
                placeholder="Email or page name"
                chips={[
                    { key: "filter", label: "Everyone" },
                    { key: "filter", value: "pro", label: "On Pro" },
                    { key: "filter", value: "ending", label: "Ending this week" },
                    { key: "filter", value: "free", label: "Free" },
                ]}
            />
            <p className="mt-4 text-sm text-muted">{plural(data.total, "account")}</p>

            {data.rows.length === 0 ? (
                <EmptyState compact picture="tray" title="No account matches" />
            ) : (
                <div className={`${card} mt-3 overflow-x-auto`}>
                    <table className="w-full min-w-[760px] text-left text-sm">
                        <thead className="border-b border-line text-xs text-muted">
                            <tr>
                                <th className="px-4 py-2.5 font-semibold">Account</th>
                                <th className="px-4 py-2.5 font-semibold">Joined</th>
                                <th className="px-4 py-2.5 font-semibold">Plan</th>
                                <th className="px-4 py-2.5 text-right font-semibold">Paid in all</th>
                                <th className="px-4 py-2.5 font-semibold">
                                    <span className="sr-only">Change Pro</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {data.rows.map((account) => (
                                <tr key={account.id}>
                                    <td className="px-4 py-3">
                                        <span className="block font-semibold">{account.email}</span>
                                        {account.username && (
                                            <a href={`/${account.username}`} target="_blank" className="block text-xs text-muted hover:text-ink hover:underline">
                                                {SITE_HOST}/{account.username}
                                                {account.suspended ? " · taken down" : account.published ? "" : " · not published"}
                                            </a>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <LocalTime iso={account.createdAt.toISOString()} format="date" />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STANDING[account.standing].tone}`}>{STANDING[account.standing].label}</span>
                                        {account.proUntil && account.standing !== "free" && (
                                            <span className="mt-1 block text-xs text-muted">
                                                {account.standing === "ended" ? "ended" : "until"} <LocalTime iso={account.proUntil.toISOString()} format="date" />
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                                        <span className="font-semibold">{rupees(account.paid)}</span>
                                        {account.payments > 0 && <span className="block text-xs text-muted">{plural(account.payments, "payment")}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <ProControls userId={account.id} email={account.email} onPro={account.standing === "pro" || account.standing === "given" || account.standing === "ending"} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <Pager total={data.total} page={page} href={(to) => adminHref({ tab: "accounts", q: search, filter, page: to })} />
        </>
    );
}
