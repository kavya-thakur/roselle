import { prisma } from "@/lib/db/prisma";

export const RANGES = [7, 30, 90] as const;
export type Range = (typeof RANGES)[number];

const DAY = 24 * 60 * 60 * 1000;

// Midnight (UTC) at the start of the first day in the range: "7 days" = today and the 6 before
function rangeStart(days: number, endsDaysAgo = 0) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return new Date(today.getTime() - (days - 1 + endsDaysAgo) * DAY);
}

async function totals(pageId: number, from: Date, to?: Date) {
    const createdAt = { gte: from, ...(to && { lt: to }) };

    const [views, clicks, visitors] = await Promise.all([
        prisma.event.count({ where: { pageId, type: "VIEW", createdAt } }),
        prisma.event.count({ where: { pageId, type: "CLICK", createdAt } }),
        // ponytail: visitor ids change daily (see track.ts), so over a range this counts
        // visitor-days; someone who came Monday and Friday counts twice
        prisma.event.findMany({ where: { pageId, type: "VIEW", createdAt }, distinct: ["visitorId"], select: { visitorId: true } }),
    ]);

    return { views, clicks, visitors: visitors.length };
}

// Everything the analytics screen shows for one page over the last `days` days,
// with the same numbers for the period before it to compare against
export async function pageStats(pageId: number, days: Range) {
    const from = rangeStart(days);
    const previousFrom = rangeStart(days, days);

    const [current, previous, daily, byBlock, bySource, byDevice] = await Promise.all([
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
        sources: bySource.sort(byCount).map((row) => ({ label: row.source, count: row._count })),
        devices: byDevice.sort(byCount).map((row) => ({ label: row.device, count: row._count })),
    };
}

export type PageStats = Awaited<ReturnType<typeof pageStats>>;
