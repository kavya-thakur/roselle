import { z } from "zod";
import { FONTS } from "@/lib/pages/theme";
import { PATTERN_KEYS } from "@/lib/pages/patterns";

// A creator page is one JSON document: profile, SEO, theme and a list of blocks.
// This schema is the single description of that document. The editor autosaves through it,
// the database stores whatever passed it, and the renderer (src/components/PageRenderer.tsx)
// draws each block by its `type`. Adding a block type = one entry here + one case there.

// Links are saved as typed, so a half-typed address never blocks autosave. They're made safe
// when drawn (safeHref in src/lib/pages/links.ts), which is where it matters.
const url = z.string().max(2048).default("");
const text = (max: number) => z.string().max(max, `Must be at most ${max} characters`).default("");

// Every block can be hidden, or shown only between two moments (ISO dates)
const blockBase = {
    id: z.string().min(1).max(40),
    visible: z.boolean().default(true),
    startsAt: z.string().nullable().default(null),
    endsAt: z.string().nullable().default(null),
};

// A picture in a gallery or a case study
const image = z.object({ src: url, alt: text(300) });
export const MAX_GALLERY = 30;

export const SOCIALS = ["instagram", "x", "tiktok", "youtube", "github", "linkedin", "dribbble", "behance", "spotify", "threads", "email", "website"] as const;

// The small icon a link button can wear instead of a picture: every social above, a few more
// brands, and some plain ones. Drawn by LinkIcon in src/components/SocialIcon.tsx.
export const LINK_ICONS = [
    ...SOCIALS,
    "facebook", "whatsapp", "pinterest", "twitch", "discord", "snapchat", "telegram", "soundcloud",
    "shop", "music", "podcast", "calendar", "ticket", "book", "news", "camera", "play", "download",
    "gift", "heart", "star", "phone", "map", "coffee",
] as const;

// Where a tip block sends people. Each takes a handle (or, for "link", any payment page address)
export const TIP_PROVIDERS = ["paypal", "kofi", "buymeacoffee", "patreon", "cashapp", "venmo", "upi", "link"] as const;

export const blockSchema = z.discriminatedUnion("type", [
    z.object({
        ...blockBase,
        type: z.literal("link"),
        title: text(120),
        url,
        thumbnail: url,
        // shown when there's no thumbnail; "" = none. Links saved before icons existed have none
        icon: z.enum(LINK_ICONS).or(z.literal("")).default(""),
        featured: z.boolean().default(false),
    }),
    z.object({ ...blockBase, type: z.literal("heading"), text: text(120) }),
    z.object({ ...blockBase, type: z.literal("text"), text: text(2000) }),
    z.object({ ...blockBase, type: z.literal("image"), src: url, alt: text(300), caption: text(300), url }),
    z.object({ ...blockBase, type: z.literal("video"), url, title: text(120) }),
    z.object({
        ...blockBase,
        type: z.literal("gallery"),
        title: text(120),
        images: z.array(image).max(MAX_GALLERY).default([]),
        // "grid": even squares. "masonry": columns that keep each picture's own shape.
        // "carousel": one row you swipe through. Galleries saved before this are grids.
        layout: z.enum(["grid", "masonry", "carousel"]).default("grid"),
    }),
    z.object({
        ...blockBase,
        type: z.literal("project"),
        title: text(120),
        description: text(600),
        image: url,
        url,
        tags: z.array(z.string().max(30)).max(6).default([]),
        // the case study: with a story or pictures, the card opens its own page
        // (/<username>/work/<id>) instead of going straight to `url`
        body: text(8000),
        images: z.array(image).max(MAX_GALLERY).default([]),
    }),
    // a Spotify, Apple Music or SoundCloud player
    z.object({ ...blockBase, type: z.literal("music"), url, title: text(120) }),
    // a map of one place, from a plain address: no API key, nothing to pay for
    z.object({ ...blockBase, type: z.literal("map"), address: text(200), title: text(120) }),
    // What the creator offers and roughly what it costs, each with an Enquire button that opens
    // the enquiry form with that service already chosen. Prices are free text ("from ₹25,000",
    // "$90 an hour") because creators price in very different ways.
    z.object({
        ...blockBase,
        type: z.literal("services"),
        title: text(120),
        items: z
            .array(z.object({ id: z.string().min(1).max(40), name: text(80), price: text(40), description: text(400) }))
            .max(12)
            .default([]),
    }),
    // What clients said: the approved reviews (they live in the Review table, not in the page,
    // because clients write them, not the creator)
    z.object({ ...blockBase, type: z.literal("reviews"), title: text(120) }),
    // "Work with me": a short form visitors fill in; it lands in the creator's inbox and email
    z.object({
        ...blockBase,
        type: z.literal("contact"),
        title: text(120),
        text: text(600),
        button: text(40),
    }),
    // a button to pay or tip the creator. Roselle never touches the money: it's a link to
    // their own PayPal, Ko-fi, UPI... so there are no fees and nothing to set up here
    z.object({
        ...blockBase,
        type: z.literal("tip"),
        title: text(120),
        provider: z.enum(TIP_PROVIDERS).default("kofi"),
        handle: text(300),
    }),
]);

const color = z.string().regex(/^#[0-9a-f]{6}$/i, "Use a hex colour like #b8132f");
const fontKey = z.enum(Object.keys(FONTS) as [keyof typeof FONTS, ...(keyof typeof FONTS)[]]);

export const themeSchema = z.object({
    // which template it started from, so the editor can show it as chosen
    template: z.string().max(40),
    background: z.object({
        kind: z.enum(["solid", "gradient", "glow", "image", "pattern"]),
        colors: z.tuple([color, color, color]),
        angle: z.number().min(0).max(360),
        // "image": a photo behind the page, darkened with the first colour so text stays readable
        image: url,
        // "pattern": a printed repeat in the second colour on the first (src/lib/pages/patterns.ts)
        pattern: z.enum(PATTERN_KEYS).default("dots"),
    }),
    text: color,
    muted: color,
    font: z.object({ heading: fontKey, body: fontKey }),
    button: z.object({
        // "pop": a solid button with a thick outline and a hard offset shadow, like a sticker
        style: z.enum(["solid", "outline", "soft", "glass", "pop"]),
        shape: z.enum(["sharp", "rounded", "pill"]),
        color,
        textColor: color,
        shadow: z.boolean(),
    }),
    layout: z.object({
        // "left" also turns into two columns on wide screens: profile beside the blocks
        align: z.enum(["center", "left"]),
        avatar: z.enum(["circle", "arch", "hidden"]),
        // how the top of the page is set: the photo in a small frame ("classic"), the photo filling
        // the top of the screen with the name across it like a poster ("poster"), or a wide cover
        // picture with the photo overlapping it ("banner"). Pages saved before this was added are classic.
        header: z.enum(["classic", "poster", "banner"]).default("classic"),
    }),
});

export const pageSchema = z.object({
    profile: z.object({
        name: text(80),
        bio: text(300),
        avatar: url,
        // the wide picture across the top of a "banner" header; empty = a wash of the page's colours
        cover: url,
        socials: z.array(z.object({ platform: z.enum(SOCIALS), url })).max(SOCIALS.length).default([]),
    }),
    // what search engines and link previews show; empty = the name and bio
    seo: z.object({ title: text(70), description: text(160) }).default({ title: "", description: "" }),
    theme: themeSchema,
    blocks: z.array(blockSchema).max(100, "A page can have at most 100 blocks"),
});

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type Theme = z.infer<typeof themeSchema>;
export type Social = (typeof SOCIALS)[number];
export type LinkIconName = (typeof LINK_ICONS)[number];
export type TipProvider = (typeof TIP_PROVIDERS)[number];
export type PageDoc = z.infer<typeof pageSchema>;

// The editor's autosave: the whole draft at once
export const saveDraftSchema = z.object({
    draft: pageSchema,
});
