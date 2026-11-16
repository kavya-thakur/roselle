import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db/prisma";
import { SITE_URL } from "@/lib/site";

// Rebuilt at most once an hour: a new page reaches search engines on their next visit
export const revalidate = 3600;

// Every live creator page, so search engines find them without waiting for a link from elsewhere
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const pages = await prisma.page.findMany({
        where: { publishedAt: { not: null }, suspendedAt: null },
        select: { username: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        // ponytail: one file holds 50,000 addresses; split with generateSitemaps past that
        take: 50_000 - 3,
    });

    return [
        { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
        { url: `${SITE_URL}/terms` },
        { url: `${SITE_URL}/privacy` },
        ...pages.map((page) => ({ url: `${SITE_URL}/${page.username}`, lastModified: page.publishedAt! })),
    ];
}
