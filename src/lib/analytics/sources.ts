import type { LinkIconName } from "@/lib/validations/page";

// Where visits come from, in words a creator uses: "Instagram", not "l.instagram.com".
// A visit's source is stored as it arrived (an address, a ?via= tag, or "direct"; see track.ts)
// and named here when it's shown, so old visits are grouped the same way as new ones.
// Plain data and string matching, no database, so it's tested on its own.

interface Place {
    name: string;
    icon?: LinkIconName;
    // the addresses it links out through; a subdomain matches too (l.instagram.com, lm.facebook.com)
    hosts: string[];
    // short tags people use in ?via= or ?utm_source=
    tags?: string[];
    // how its in-app browser names itself. Instagram, Facebook and TikTok open links inside their
    // own app and usually send no referrer, so without this their visits all look "direct".
    app?: RegExp;
}

// Threads before Instagram: its in-app browser mentions both
const PLACES: Place[] = [
    { name: "Threads", icon: "threads", hosts: ["threads.net", "threads.com"], app: /Barcelona/ },
    { name: "Instagram", icon: "instagram", hosts: ["instagram.com", "com.instagram.android"], tags: ["ig", "insta"], app: /Instagram/ },
    { name: "Facebook", icon: "facebook", hosts: ["facebook.com", "fb.com", "fb.me", "messenger.com", "com.facebook.katana"], tags: ["fb"], app: /FBAN|FBAV|FB_IAB|FBIOS/ },
    { name: "TikTok", icon: "tiktok", hosts: ["tiktok.com"], tags: ["tt"], app: /musical_ly|BytedanceWebview|TikTok/i },
    { name: "Snapchat", icon: "snapchat", hosts: ["snapchat.com"], tags: ["snap"], app: /Snapchat/ },
    { name: "LinkedIn", icon: "linkedin", hosts: ["linkedin.com", "lnkd.in", "com.linkedin.android"], tags: ["li"], app: /LinkedInApp/ },
    { name: "X (Twitter)", icon: "x", hosts: ["x.com", "twitter.com", "t.co"], tags: ["twitter"], app: /Twitter for/ },
    { name: "Pinterest", icon: "pinterest", hosts: ["pinterest.com", "pin.it"], app: /Pinterest/ },
    { name: "YouTube", icon: "youtube", hosts: ["youtube.com", "youtu.be"], tags: ["yt"] },
    { name: "WhatsApp", icon: "whatsapp", hosts: ["whatsapp.com", "wa.me"], tags: ["wa"] },
    { name: "Telegram", icon: "telegram", hosts: ["t.me", "telegram.org", "telegram.me"] },
    { name: "Behance", icon: "behance", hosts: ["behance.net"] },
    { name: "Dribbble", icon: "dribbble", hosts: ["dribbble.com"] },
    { name: "Email", icon: "email", hosts: ["mail.google.com", "outlook.live.com", "mail.yahoo.com", "com.google.android.gm"], tags: ["mail", "newsletter"] },
    { name: "QR code", icon: "camera", hosts: [], tags: ["qr"] },
];

// search engines go by many addresses (google.co.in, google.com.au): matched by pattern
const SEARCH = [
    { name: "Google", pattern: /(^|\.)google\.[a-z.]+$|^com\.google\.android\.googlequicksearchbox$/ },
    { name: "Bing", pattern: /(^|\.)bing\.com$/ },
    { name: "DuckDuckGo", pattern: /(^|\.)duckduckgo\.com$/ },
];

// typed in, a bookmark, or an app that doesn't say
export const UNKNOWN = "Unknown";
const DIRECT = { name: UNKNOWN };

const matchesHost = (host: string, hosts: string[]) => hosts.some((known) => host === known || host.endsWith(`.${known}`));

// The place a stored source belongs to: { name, icon? }. Anything unknown keeps its own address.
export function placeOf(source: string): { name: string; icon?: LinkIconName } {
    const value = source.trim().toLowerCase();
    if (!value || value === "direct") return DIRECT;

    const place = PLACES.find((place) => place.name.toLowerCase() === value || place.tags?.includes(value) || matchesHost(value, place.hosts));
    if (place) return { name: place.name, icon: place.icon };

    const search = SEARCH.find((engine) => engine.pattern.test(value));
    if (search) return { name: search.name, icon: "website" };

    return { name: source };
}

// The place whose in-app browser this is ("instagram.com"), or undefined for an ordinary browser
export function appOf(userAgent: string) {
    return PLACES.find((place) => place.app?.test(userAgent))?.hosts[0];
}

// The places offered as ready-made tagged links on the analytics screen, with the tag each uses.
// Instagram is there although its visits are recognised anyway: a tagged bio link is certain.
export const TAGGED_LINKS: { tag: string; name: string; icon: LinkIconName; hint: string }[] = [
    { tag: "instagram", name: "Instagram bio", icon: "instagram", hint: "Your profile link" },
    { tag: "whatsapp", name: "WhatsApp", icon: "whatsapp", hint: "Chats, status and your business profile" },
    { tag: "linkedin", name: "LinkedIn", icon: "linkedin", hint: "Your profile and posts" },
    { tag: "email", name: "Email", icon: "email", hint: "Your signature and newsletters" },
    { tag: "facebook", name: "Facebook", icon: "facebook", hint: "Your page and groups" },
    { tag: "youtube", name: "YouTube", icon: "youtube", hint: "Video descriptions" },
];
