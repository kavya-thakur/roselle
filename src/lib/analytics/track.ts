import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { visitorOf } from "@/lib/api/rateLimit";
import type { EventType } from "@/generated/prisma/client";

// Link previews, search engines and uptime checkers aren't visitors
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|whatsapp|curl|wget|headless/i;

function deviceOf(userAgent: string) {
    if (/ipad|tablet/i.test(userAgent)) return "tablet";
    if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
    return "desktop";
}

// "instagram.com" from the address they came from; a campaign tag (?utm_source=) wins.
// Coming from Roselle itself (the editor's "View page") or from nowhere is "direct".
function sourceOf(referrer: string | undefined, utmSource: string | undefined) {
    if (utmSource) return utmSource.toLowerCase().slice(0, 60);
    try {
        const host = new URL(referrer ?? "").hostname.replace(/^www\./, "");
        const ownHost = new URL(process.env.APP_URL ?? "http://localhost:3000").hostname;
        return host && host !== ownHost ? host : "direct";
    } catch {
        return "direct";
    }
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
            source: sourceOf(event.referrer, event.utmSource),
            device: deviceOf(userAgent),
        },
    });
}
