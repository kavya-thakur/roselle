import type { Block, TipProvider } from "@/lib/validations/page";

// The address a link may really point to, or undefined. Only web, mail and phone links get
// through: anything else ("javascript:...") could run code on a visitor's browser under our
// domain. A bare "example.com" gets https:// in front, since that's what people type.
export function safeHref(raw: string) {
    const value = raw.trim();
    if (value === "" || value === "https://" || value === "http://") return undefined;
    if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
    // our own uploaded images
    if (/^\/media\/[\w-]+$/.test(value)) return value;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(value)) return `https://${value}`;
    return undefined;
}

// Should visitors see this block right now? Hidden ones never; scheduled ones only in their window
export function isLive(block: Block, now = new Date()) {
    if (!block.visible) return false;
    if (block.startsAt && new Date(block.startsAt) > now) return false;
    if (block.endsAt && new Date(block.endsAt) <= now) return false;
    return true;
}

// A YouTube or Vimeo page address -> the player address an <iframe> can show
export function videoEmbed(url: string) {
    const youtube = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;

    const vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

    return undefined;
}

// A Spotify, Apple Music or SoundCloud address -> the player an <iframe> can show, and how tall
// that player is (a single song is a slim bar, an album or playlist shows its track list)
export function musicEmbed(url: string) {
    const spotify = url.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode|show|artist)\/(\w+)/);
    if (spotify) {
        const single = spotify[1] === "track" || spotify[1] === "episode";
        return { src: `https://open.spotify.com/embed/${spotify[1]}/${spotify[2]}`, height: single ? 152 : 352 };
    }

    // the same path on the embed host; a song link carries ?i= or /song/
    const apple = url.match(/^https:\/\/music\.apple\.com\/([\w\-/.%?=&]+)$/);
    if (apple) return { src: `https://embed.music.apple.com/${apple[1]}`, height: /[?&]i=|\/song\//.test(apple[1]) ? 175 : 450 };

    if (/^https:\/\/(www\.|m\.)?soundcloud\.com\/[\w-]+\/[\w-]+/.test(url)) {
        return { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&visual=false`, height: 166 };
    }

    return undefined;
}

// A plain address -> a Google map of it. This embed needs no API key and has no quota.
export const mapEmbed = (address: string) => `https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=15&output=embed`;
// ...and the same place opened in the visitor's maps app
export const mapLink = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const TIP_LABELS: Record<TipProvider, string> = {
    paypal: "PayPal",
    kofi: "Ko-fi",
    buymeacoffee: "Buy Me a Coffee",
    patreon: "Patreon",
    cashapp: "Cash App",
    venmo: "Venmo",
    upi: "UPI",
    link: "Payment link",
};

const TIP_PAGES: Record<Exclude<TipProvider, "upi" | "link">, string> = {
    paypal: "https://paypal.me/",
    kofi: "https://ko-fi.com/",
    buymeacoffee: "https://buymeacoffee.com/",
    patreon: "https://patreon.com/",
    cashapp: "https://cash.app/$",
    venmo: "https://venmo.com/u/",
};

// Where a tip button goes. People paste all sorts ("@ada", "$ada", "ko-fi.com/ada"), so only
// the handle at the end is kept. UPI ids look like "ada@okbank" and open any UPI app on a phone.
export function tipHref(provider: TipProvider, raw: string) {
    const value = raw.trim();
    if (provider === "link") return safeHref(value);

    const handle = value.replace(/\/+$/, "").replace(/^.*\//, "").replace(/^[@$]/, "");
    if (provider === "upi") return /^[\w.-]+@[\w.-]+$/.test(handle) ? `upi://pay?pa=${encodeURIComponent(handle)}&cu=INR` : undefined;
    return /^[\w.-]+$/.test(handle) ? TIP_PAGES[provider] + handle : undefined;
}

// Where a tapped block takes the visitor, or undefined when it isn't a link (or goes nowhere).
// The public page and the click counter (/go) both ask this, so they always agree.
export function targetOf(block: Block) {
    if (block.type === "tip") return tipHref(block.provider, block.handle);
    if (block.type === "link" || block.type === "image" || block.type === "project") return safeHref(block.url);
    return undefined;
}

// Does this project have a case study (a story or pictures of its own)? Then its card opens
// /<username>/work/<id> instead of going straight to its link.
export function hasCaseStudy(block: Block) {
    return block.type === "project" && (block.body.trim() !== "" || block.images.some((image) => safeHref(image.src)));
}

// Where a client pays, from what the creator typed: a payment page address (Stripe, Razorpay,
// PayPal...) or a UPI id. UPI is shown as the id itself, because email apps don't open upi:// links.
export function paymentTarget(raw: string): { kind: "url"; href: string } | { kind: "upi"; id: string } | undefined {
    const value = raw.trim();
    // a UPI handle after the @ is letters only ("ada@okbank", "98400@ybl"); an email domain has a dot
    if (/^[\w.-]+@[a-z]+$/i.test(value)) return { kind: "upi", id: value };
    const href = safeHref(value);
    return href?.startsWith("https://") ? { kind: "url", href } : undefined;
}

// Where a tap on a block goes on the page: a pick's own link (by the pick's id), a project's case
// study on Roselle, or the block's link. The page and the click counter (/go) both ask this.
export function destinationOf(block: Block, username: string | undefined, itemId?: string | null) {
    if (block.type === "picks") return safeHref(block.items.find((item) => item.id === itemId)?.url ?? "");
    if (hasCaseStudy(block)) return username ? `/${username}/work/${block.id}` : undefined;
    return targetOf(block);
}
