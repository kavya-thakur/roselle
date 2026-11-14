import { blockSchema, type Block, type BlockType, type LinkIconName, type PageDoc } from "@/lib/validations/page";
import { TEMPLATES } from "./theme";

// What the "Add block" menu offers
export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
    { type: "link", label: "Link", hint: "A button to anywhere" },
    { type: "heading", label: "Heading", hint: "Start a new section" },
    { type: "text", label: "Text", hint: "A short paragraph" },
    { type: "image", label: "Image", hint: "One photograph" },
    { type: "video", label: "Video", hint: "YouTube or Vimeo" },
    { type: "gallery", label: "Gallery", hint: "A grid of images" },
    { type: "project", label: "Project", hint: "A piece of work with tags" },
    { type: "music", label: "Music", hint: "Spotify, Apple Music or SoundCloud" },
    { type: "map", label: "Map", hint: "Where to find you" },
    { type: "tip", label: "Tips", hint: "PayPal, Ko-fi, UPI and more" },
    { type: "services", label: "Services", hint: "What you offer and what it costs" },
    { type: "picks", label: "Picks", hint: "Products or favourites, two to a row" },
    { type: "stats", label: "Stats", hint: "Your numbers at a glance" },
    { type: "contact", label: "Contact form", hint: "Let people ask to work with you" },
    { type: "reviews", label: "Reviews", hint: "What clients said, once you approve it" },
];

// What a new block starts with, so it shows something in the preview straight away
const STARTERS: Record<BlockType, object> = {
    link: { title: "New link", url: "https://" },
    heading: { text: "New section" },
    text: { text: "Write something about this part of your work." },
    image: {},
    video: {},
    gallery: { title: "Gallery" },
    project: { title: "Untitled project" },
    music: {},
    map: {},
    tip: { title: "Buy me a coffee" },
    services: {
        title: "Services",
        items: [
            { id: "s1", name: "Portrait session", price: "from $300", description: "One hour, one location, 20 edited photos." },
            { id: "s2", name: "Brand shoot", price: "from $900", description: "Half a day with your products, team and space. 60 edited photos." },
        ],
    },
    reviews: { title: "Kind words" },
    picks: { title: "My picks" },
    stats: {
        items: [
            { id: "s1", value: "10K", label: "followers" },
            { id: "s2", value: "40+", label: "brands" },
            { id: "s3", value: "6 yrs", label: "experience" },
        ],
    },
    contact: { title: "Work with me", text: "Commissions, collaborations or just hello. I usually reply within two days.", button: "Send message" },
};

export function newBlock(type: BlockType): Block {
    return blockSchema.parse({ id: crypto.randomUUID().slice(0, 8), type, ...STARTERS[type] });
}

// What a new page wears: Forest works before there's a photo, which the poster looks don't
export const STARTER_THEME = TEMPLATES.find((template) => template.id === "forest")!.theme;

// A just-registered person's page: their name, the first template and a link to fill in
export function starterPage(username: string): PageDoc {
    return {
        profile: { name: username, bio: "", avatar: "", cover: "", socials: [] },
        seo: { title: "", description: "" },
        theme: STARTER_THEME,
        blocks: [
            blockSchema.parse({ id: "welcome", type: "heading", text: "Selected work" }),
            blockSchema.parse({ id: "first", type: "link", title: "My first link", url: "https://" }),
        ],
    };
}

// A first guess at a link's title from its address, so pasting a link is all it takes:
// "https://www.instagram.com/ada" -> "Instagram"
export function titleFromUrl(url: string) {
    const host = url.trim().replace(/^[a-z]+:\/\//i, "").replace(/^www\./, "").split(/[/?#]/)[0];
    const name = host.split(".")[0];
    return name ? name[0].toUpperCase() + name.slice(1) : "New link";
}

// The icon a pasted link gets by itself, from its address: "instagram.com/ada" -> instagram
const ICON_HOSTS: [RegExp, LinkIconName][] = [
    [/instagram\.com/, "instagram"],
    [/(^|\.)(x|twitter)\.com/, "x"],
    [/tiktok\.com/, "tiktok"],
    [/youtube\.com|youtu\.be/, "youtube"],
    [/github\.com/, "github"],
    [/linkedin\.com/, "linkedin"],
    [/dribbble\.com/, "dribbble"],
    [/behance\.net/, "behance"],
    [/spotify\.com/, "spotify"],
    [/threads\.(net|com)/, "threads"],
    [/facebook\.com|fb\.me/, "facebook"],
    [/whatsapp\.com|wa\.me/, "whatsapp"],
    [/pinterest\./, "pinterest"],
    [/twitch\.tv/, "twitch"],
    [/discord\.(gg|com)/, "discord"],
    [/snapchat\.com/, "snapchat"],
    [/t\.me|telegram\./, "telegram"],
    [/soundcloud\.com/, "soundcloud"],
    [/music\.apple\.com/, "music"],
    [/ko-fi\.com|buymeacoffee\.com/, "coffee"],
    [/etsy\.com|shopify|gumroad\.com|amazon\./, "shop"],
];

export function iconFromUrl(url: string): LinkIconName | "" {
    if (/^mailto:/i.test(url.trim())) return "email";
    if (/^tel:/i.test(url.trim())) return "phone";
    const host = url.trim().replace(/^[a-z]+:\/\//i, "").replace(/^www\./, "").split(/[/?#]/)[0].toLowerCase();
    return ICON_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? "";
}
