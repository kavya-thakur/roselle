import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowDownRight, IconArrowUpRight, IconMinus } from "@tabler/icons-react";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { pageStats, RANGES, type PageStats, type Range } from "@/lib/analytics/stats";
import { pageSchema, type Block } from "@/lib/validations/page";
import { formatHours, formatMoney, formatNumber, formatPercent, shareOf } from "@/lib/utils/format";
import { can } from "@/lib/plans";
import { TrendChart } from "./TrendChart";
import { EmptyState } from "@/components/EmptyState";
import { SITE_HOST } from "@/lib/site";

export const metadata: Metadata = {
    title: "Analytics",
};

// the blocks whose taps go through the click counter
const CLICKABLE: Block["type"][] = ["link", "image", "project", "tip", "picks"];

const DEVICE_LABELS: Record<string, string> = { mobile: "Phone", tablet: "Tablet", desktop: "Computer" };

// What a link shows up as in "Top links"
function nameOf(block: Block) {
    if (block.type === "link" || block.type === "project" || block.type === "tip") return block.title || "Untitled";
    if (block.type === "picks") return block.title || "Picks";
    if (block.type === "image") return block.alt || block.caption || "Image";
    return "Untitled";
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/analytics">) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // ?range=30; anything else falls back to the last 7 days
    const asked = Number((await searchParams).range);
    // 90 days is one of the features that can be made Pro (src/lib/plans.ts)
    const ranges = RANGES.filter((days) => days !== 90 || can(user.plan, "longAnalytics"));
    const range: Range = ranges.find((days) => days === asked) ?? 7;

    const [stats, page] = await Promise.all([
        pageStats(user.page.id, range),
        prisma.page.findUniqueOrThrow({ where: { id: user.page.id }, select: { published: true } }),
    ]);

    const published = pageSchema.safeParse(page.published);
    const { current, previous } = stats;
    const ctr = current.views ? current.clicks / current.views : 0;
    const previousCtr = previous.views ? previous.clicks / previous.views : 0;

    // Every clickable block on the live page, most clicked first. Clicks on links that have since
    // been deleted are kept together at the bottom, so the totals still add up.
    const blocks = published.success ? published.data.blocks.filter((block) => CLICKABLE.includes(block.type)) : [];
    const knownIds = new Set(blocks.map((block) => block.id));
    const removedClicks = Object.entries(stats.clicksByBlock)
        .filter(([id]) => !knownIds.has(id))
        .reduce((sum, [, count]) => sum + count, 0);
    const topLinks = [
        ...blocks.map((block) => ({ id: block.id, name: nameOf(block), clicks: stats.clicksByBlock[block.id] ?? 0 })).sort((a, b) => b.clicks - a.clicks),
        ...(removedClicks ? [{ id: "removed", name: "Links you've removed", clicks: removedClicks }] : []),
    ];

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-5xl">Analytics</h1>
                        <p className="mt-2 text-sm text-muted">Who visits {SITE_HOST}/{user.page.username}, and what they tap.</p>
                    </div>

                    {/* the date range scopes everything below it */}
                    <nav aria-label="Date range" className="flex rounded-full bg-sand p-1">
                        {ranges.map((days) => (
                            <Link
                                key={days}
                                href={`/analytics?range=${days}`}
                                aria-current={range === days ? "page" : undefined}
                                className={`flex h-8 items-center rounded-full px-4 text-[13px] font-semibold transition ${range === days ? "bg-paper text-ink shadow-soft" : "text-muted hover:text-ink"}`}
                            >
                                {days} days
                            </Link>
                        ))}
                    </nav>
                </div>

                {!published.success && (
                    <p className="mt-6 rounded-xl bg-blush px-4 py-3 text-sm text-forest">
                        Your page isn&apos;t published yet, so nobody can visit it.{" "}
                        <Link href="/editor" className="font-semibold underline underline-offset-2">
                            Publish it from the editor
                        </Link>
                    </p>
                )}

                <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <StatTile tone="forest" label="Page views" value={formatNumber(current.views)} change={changeOf(current.views, previous.views)} range={range} />
                    <StatTile tone="pink" label="Unique visitors" value={formatNumber(current.visitors)} change={changeOf(current.visitors, previous.visitors)} range={range} />
                    <StatTile tone="blush" label="Link clicks" value={formatNumber(current.clicks)} change={changeOf(current.clicks, previous.clicks)} range={range} />
                    <StatTile tone="paper" label="Click-through rate" value={formatPercent(ctr)} change={changeOf(ctr, previousCtr)} range={range} />
                </div>

                <section className="mt-3 rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
                    <h2 className="sr-only">Over time</h2>
                    {current.views === 0 && current.clicks === 0 ? (
                        <Quiet username={user.page.username} />
                    ) : (
                        <TrendChart points={stats.daily} />
                    )}
                </section>

                <Funnel current={current} replyHours={stats.replyHours} currency={user.currency} />
                {stats.services.length > 0 && <Services rows={stats.services} currency={user.currency} />}

                <div className="mt-3 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
                    <section className="rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
                        <h2 className="text-lg font-semibold">Top links</h2>
                        {topLinks.length === 0 ? (
                            <p className="mt-4 text-sm text-muted">Links on your published page will show up here.</p>
                        ) : (
                            <table className="mt-4 w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-faint">
                                        <th className="pb-2 font-semibold">Link</th>
                                        <th className="w-20 pb-2 text-right font-semibold">Clicks</th>
                                        <th className="w-16 pb-2 text-right font-semibold">CTR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topLinks.map((link) => (
                                        <tr key={link.id} className="border-t border-line">
                                            <td className="py-2.5 pr-3">
                                                <p className="truncate font-medium">{link.name}</p>
                                                <Bar share={topLinks[0].clicks ? link.clicks / topLinks[0].clicks : 0} />
                                            </td>
                                            <td className="py-2.5 text-right font-semibold tabular-nums">{formatNumber(link.clicks)}</td>
                                            <td className="py-2.5 text-right text-muted tabular-nums">{current.views ? formatPercent(link.clicks / current.views) : "–"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>

                    <div className="grid gap-3">
                        <Sources rows={stats.sources} />
                        <Breakdown
                            title="Devices"
                            rows={stats.devices.map((row) => ({ ...row, label: DEVICE_LABELS[row.label] ?? row.label }))}
                            total={current.views}
                            empty="Phone, tablet and computer visits appear here."
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}

// The path from a visit to paid work: how many people came, how many asked, how many booked, and
// what that work is worth. Each step says what share of the step before it made it through.
function Funnel({ current, replyHours, currency }: { current: PageStats["current"]; replyHours: number | null; currency: string }) {
    const steps = [
        { label: "Visitors", value: formatNumber(current.visitors), note: "came to your page" },
        { label: "Enquiries", value: formatNumber(current.enquiries), note: shareOf(current.enquiries, current.visitors) ? `${shareOf(current.enquiries, current.visitors)} of visitors asked` : "–" },
        { label: "Booked", value: formatNumber(current.booked), note: shareOf(current.booked, current.enquiries) ? `${shareOf(current.booked, current.enquiries)} of enquiries` : "–" },
        { label: "Worth", value: formatMoney(current.bookedValue, currency), note: "from those bookings" },
    ];

    return (
        <section className="mt-3 rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">From visit to booking</h2>
                <Link href="/inbox" className="text-sm font-semibold text-pink hover:underline">
                    Update bookings in your inbox
                </Link>
            </div>
            <ol className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {steps.map((step, i) => (
                    <li key={step.label} className="relative rounded-2xl bg-sand/60 p-4">
                        <p className="text-xs font-semibold text-muted">
                            {i + 1}. {step.label}
                        </p>
                        <p className="mt-1.5 font-display text-3xl tabular-nums">{step.value}</p>
                        <p className="mt-1 text-xs text-muted">{step.note}</p>
                    </li>
                ))}
            </ol>
            {/* how fast they answer is the one thing in this funnel fully in their hands */}
            {replyHours !== null && (
                <p className="mt-4 text-sm text-muted">
                    You reply in <span className="font-semibold text-ink">{formatHours(replyHours)}</span> on average.
                    {replyHours > 24 ? " Replying within a day wins noticeably more work." : " Quick replies win work: keep it up."}
                </p>
            )}
        </section>
    );
}

// How each service sells: what people ask about, how much of it turns into work, and what that
// work is usually worth. Tells a creator what to promote, and what might be priced wrong.
function Services({ rows, currency }: { rows: PageStats["services"]; currency: string }) {
    return (
        <section className="mt-3 rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">Your services</h2>
            <table className="mt-4 w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-faint">
                        <th className="pb-2 font-semibold">Service</th>
                        <th className="w-20 pb-2 text-right font-semibold">Enquiries</th>
                        <th className="w-20 pb-2 text-right font-semibold">Booked</th>
                        <th className="hidden w-24 pb-2 text-right font-semibold sm:table-cell">Booking rate</th>
                        <th className="w-28 pb-2 text-right font-semibold">Average value</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.service} className="border-t border-line">
                            <td className="max-w-0 truncate py-2.5 pr-3 font-medium">{row.service}</td>
                            <td className="py-2.5 text-right tabular-nums">{formatNumber(row.enquiries)}</td>
                            <td className="py-2.5 text-right font-semibold tabular-nums">{formatNumber(row.won)}</td>
                            <td className="hidden py-2.5 text-right text-muted tabular-nums sm:table-cell">{formatPercent(row.rate)}</td>
                            <td className="py-2.5 text-right tabular-nums">{row.averageValue === null ? "–" : formatMoney(row.averageValue, currency)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    );
}

// Which places send people who actually get in touch, not just people who look
function Sources({ rows }: { rows: PageStats["sources"] }) {
    return (
        <section className="rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">Where they come from</h2>
            {rows.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Sources appear after your first visits.</p>
            ) : (
                <table className="mt-4 w-full text-sm">
                    <thead>
                        <tr className="text-left text-xs text-faint">
                            <th className="pb-2 font-semibold">Source</th>
                            <th className="w-14 pb-2 text-right font-semibold">Views</th>
                            <th className="w-18 pb-2 text-right font-semibold">Enquiries</th>
                            <th className="w-16 pb-2 text-right font-semibold">Booked</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* the top eight; the rest are too small to matter here */}
                        {rows.slice(0, 8).map((row) => (
                            <tr key={row.label} className="border-t border-line">
                                <td className="max-w-0 truncate py-2.5 pr-3 font-medium">{row.label}</td>
                                <td className="py-2.5 text-right text-muted tabular-nums">{formatNumber(row.count)}</td>
                                <td className="py-2.5 text-right tabular-nums">{formatNumber(row.enquiries)}</td>
                                <td className="py-2.5 text-right font-semibold tabular-nums">{formatNumber(row.booked)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

// The change against the period before, or null when there was nothing before to compare to
function changeOf(now: number, before: number) {
    if (before === 0) return null;
    return (now - before) / before;
}

// Each headline number on its own brand colour, so the four read apart at a glance
const TONES = {
    forest: "bg-forest text-white",
    pink: "bg-pink text-white",
    blush: "bg-blush text-ink",
    paper: "bg-paper text-ink shadow-soft",
};

function StatTile({ tone, label, value, change, range }: { tone: keyof typeof TONES; label: string; value: string; change: number | null; range: number }) {
    // the arrow says which way, not just a colour
    const Arrow = change === null || Math.abs(change) < 0.005 ? IconMinus : change > 0 ? IconArrowUpRight : IconArrowDownRight;

    return (
        <div className={`rounded-3xl p-5 ${TONES[tone]}`}>
            <p className="text-[13px] font-bold opacity-80">{label}</p>
            <p className="mt-3 font-display text-5xl tabular-nums">{value}</p>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold opacity-80">
                <Arrow size={14} stroke={2.4} />
                {change === null ? `Nothing to compare in the ${range} days before` : `${formatPercent(Math.abs(change))} vs the ${range} days before`}
            </p>
        </div>
    );
}

// A thin magnitude bar under a row's label
function Bar({ share }: { share: number }) {
    return (
        <span className="mt-1.5 block h-1 rounded-full bg-sand">
            <span className="block h-full rounded-full bg-forest" style={{ width: `${Math.max(share * 100, share > 0 ? 2 : 0)}%` }} />
        </span>
    );
}

function Breakdown({ title, rows, total, empty }: { title: string; rows: { label: string; count: number }[]; total: number; empty: string }) {
    return (
        <section className="rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">{title}</h2>
            {rows.length === 0 ? (
                <p className="mt-4 text-sm text-muted">{empty}</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {/* the top six; the rest are too small to matter at this size */}
                    {rows.slice(0, 6).map((row) => (
                        <li key={row.label} className="text-sm">
                            <div className="flex justify-between gap-3">
                                <span className="truncate font-medium">{row.label}</span>
                                <span className="shrink-0 text-muted tabular-nums">
                                    <span className="font-semibold text-ink">{formatNumber(row.count)}</span> · {formatPercent(total ? row.count / total : 0)}
                                </span>
                            </div>
                            <Bar share={total ? row.count / total : 0} />
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

function Quiet({ username }: { username: string }) {
    return (
        <EmptyState compact picture="chart" title="Quiet, for now">
            Put <span className="font-semibold text-ink">{SITE_HOST}/{username}</span> in your bio and visits will appear here, day by day.
        </EmptyState>
    );
}
