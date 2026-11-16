import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { visitorOf } from "@/lib/api/rateLimit";
import type { EventType } from "@/generated/prisma/client";
import { appOf } from "./sources";

// Link previews, search engines and uptime checkers aren't visitors
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|curl|wget|headless/i;

function deviceOf(userAgent: string) {
    if (/ipad|tablet/i.test(userAgent)) return "tablet";
    if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
    return "desktop";
}

// "instagram.com" from the address they came from; a tag on the link (?via= or ?utm_source=) wins.
// With no address to go on, the app whose built-in browser they're in (Instagram, TikTok and
// Facebook usually send none). Coming from Roselle itself or from nowhere is "direct".
// Stored as it is; analytics names it ("Instagram") when it's shown (sources.ts).
export function sourceOf(referrer: string | undefined, utmSource: string | undefined, userAgent = "") {
    if (utmSource) return utmSource.toLowerCase().slice(0, 60);
    let host = "";
    try {
        host = new URL(referrer ?? "").hostname.replace(/^www\./, "");
    } catch {}
    const ownHost = new URL(process.env.APP_URL ?? "http://localhost:3000").hostname;
    if (host && host !== ownHost) return host;
    return appOf(userAgent) ?? "direct";
}

// The same person on the same day gets the same id, a new one tomorrow. It's a hash, so the
// IP address itself is never stored, and the daily change means nobody can be followed over time.
function visitorIdOf(headers: Headers) {
    const day = new Date().toISOString().slice(0, 10);
    return createHash("sha256")
        .update(`${visitorOf(headers)}|${headers.get("user-agent")}|${day}|${process.env.VISITOR_SALT}`)
        .digest("hex")
        .slice(0, 32);
}

export async function recordEvent(
    headers: Headers,
    event: { pageId: number; type: EventType; blockId?: string; referrer?: string; utmSource?: string }
) {
    const userAgent = headers.get("user-agent") ?? "";
    if (!userAgent || BOT.test(userAgent)) return;

    await prisma.event.create({
        data: {
            pageId: event.pageId,
            type: event.type,
            blockId: event.blockId,
            visitorId: visitorIdOf(headers),
            source: sourceOf(event.referrer, event.utmSource, userAgent),
            device: deviceOf(userAgent),
        },
    });
}
