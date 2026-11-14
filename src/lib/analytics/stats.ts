import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { averageReplyHours, serviceStats } from "@/lib/bookings";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

const DAY = 24 * 60 * 60 * 1000;

// Midnight (UTC) at the start of the first day in the range: "7 days" = today and the 6 before
function rangeStart(days: number, endsDaysAgo = 0) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return new Date(today.getTime() - (days - 1 + endsDaysAgo) * DAY);
}

// Enquiries that turned into work. Counted by when the enquiry came in, not when it was booked,
// so "booked" is always a share of the enquiries in the same range.
const WON = { in: ["BOOKED", "PAID"] as ("BOOKED" | "PAID")[] };

async function totals(pageId: number, from: Date, to?: Date) {
    const createdAt = { gte: from, ...(to && { lt: to }) };

    const [views, clicks, visitors, enquiries, won] = await Promise.all([
        prisma.event.count({ where: { pageId, type: "VIEW", createdAt } }),
        prisma.event.count({ where: { pageId, type: "CLICK", createdAt } }),
        // ponytail: visitor ids change daily (see track.ts), so over a range this counts
        // visitor-days; someone who came Monday and Friday counts twice
        // counted by the database: Prisma's `distinct` would load every view into memory first
        prisma.$queryRaw<[{ count: bigint }]>`
            SELECT count(DISTINCT "visitorId") AS count FROM "Event"
            WHERE "pageId" = ${pageId} AND type = 'VIEW' AND "createdAt" >= ${from} ${to ? Prisma.sql`AND "createdAt" < ${to}` : Prisma.empty}`,
        prisma.enquiry.count({ where: { pageId, createdAt } }),
        prisma.enquiry.aggregate({ where: { pageId, createdAt, status: WON }, _count: true, _sum: { amount: true } }),
    ]);

    return { views, clicks, visitors: Number(visitors[0].count), enquiries, booked: won._count, bookedValue: won._sum.amount ?? 0 };
}

// Everything the analytics screen shows for one page over the last `days` days,
// with the same numbers for the period before it to compare against
export async function pageStats(pageId: number, days: Range) {
    const from = rangeStart(days);
    const previousFrom = rangeStart(days, days);

    const [current, previous, daily, byBlock, bySource, byDevice, enquiriesBySource, bookedBySource, enquiries] = await Promise.all([
        totals(pageId, from),
        totals(pageId, previousFrom, from),
        // one row per day and type; days with nothing are filled in below
        prisma.$queryRaw<{ day: Date; type: "VIEW" | "CLICK"; count: bigint }[]>`
            SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, type, count(*) AS count
            FROM "Event"
            WHERE "pageId" = ${pageId} AND "createdAt" >= ${from}
            GROUP BY 1, 2`,
        prisma.event.groupBy({ by: ["blockId"], where: { pageId, type: "CLICK", createdAt: { gte: from } }, _count: true }),
        prisma.event.groupBy({ by: ["source"], where: { pageId, type: "VIEW", createdAt: { gte: from } }, _count: true }),
        prisma.event.groupBy({ by: ["device"], where: { pageId, type: "VIEW", createdAt: { gte: from } }, _count: true }),
        prisma.enquiry.groupBy({ by: ["source"], where: { pageId, createdAt: { gte: from } }, _count: true }),
        prisma.enquiry.groupBy({ by: ["source"], where: { pageId, createdAt: { gte: from }, status: WON }, _count: true }),
        // the range's enquiries themselves, for the per-service table and reply times
        // ponytail: loaded and counted here, fine for a freelancer's volume; group in SQL past thousands a range
        prisma.enquiry.findMany({ where: { pageId, createdAt: { gte: from } }, select: { service: true, status: true, amount: true, createdAt: true, repliedAt: true } }),
    ]);

    const series = Array.from({ length: days }, (_, i) => {
        const day = new Date(from.getTime() + i * DAY).toISOString().slice(0, 10);
        const count = (type: string) => Number(daily.find((row) => row.type === type && row.day.toISOString().startsWith(day))?.count ?? 0);
        return { day, views: count("VIEW"), clicks: count("CLICK") };
    });

    const byCount = (a: { _count: number }, b: { _count: number }) => b._count - a._count;

    return {
        current,
        previous,
        daily: series,
        clicksByBlock: Object.fromEntries(byBlock.map((row) => [row.blockId ?? "", row._count])),
        sources: sourcesTable(bySource, enquiriesBySource, bookedBySource),
        services: serviceStats(enquiries),
        replyHours: averageReplyHours(enquiries),
        devices: byDevice.sort(byCount).map((row) => ({ label: row.device, count: row._count })),
    };
}

export type PageStats = Awaited<ReturnType<typeof pageStats>>;

type SourceCount = { source: string; _count: number };

// One row per source with its views, enquiries and bookings, most views first. A source can bring
// an enquiry without a recorded view (an ad blocker stopped the view), so it's every source of either.
export function sourcesTable(views: SourceCount[], enquiries: SourceCount[], booked: SourceCount[]) {
    const countIn = (rows: SourceCount[], source: string) => rows.find((row) => row.source === source)?._count ?? 0;
    const sources = [...new Set([...views, ...enquiries].map((row) => row.source))];

    return sources
        .map((source) => ({ label: source, count: countIn(views, source), enquiries: countIn(enquiries, source), booked: countIn(booked, source) }))
        .sort((a, b) => b.count - a.count || b.enquiries - a.enquiries);
}
