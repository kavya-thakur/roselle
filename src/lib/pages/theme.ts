import type { Theme } from "@/lib/validations/page";

// The typefaces a page can use. Each one is loaded by next/font in src/app/layout.tsx into
// the CSS variable named here. `weight` is what its headlines use: heavy for the bold
// sans faces, regular for the serifs, which are drawn to be read at 400.
export const FONTS = {
    bricolage: { label: "Bricolage Grotesque", css: "var(--font-bricolage)", weight: 800 },
    "dm-serif": { label: "DM Serif Display", css: "var(--font-dm-serif)", weight: 400 },
    cormorant: { label: "Cormorant Garamond", css: "var(--font-cormorant)", weight: 500 },
    fraunces: { label: "Fraunces", css: "var(--font-fraunces)", weight: 600 },
    manrope: { label: "Manrope", css: "var(--font-manrope)", weight: 700 },
    inter: { label: "Inter", css: "var(--font-inter)", weight: 700 },
    "space-grotesk": { label: "Space Grotesk", css: "var(--font-space-grotesk)", weight: 700 },
    playfair: { label: "Playfair Display", css: "var(--font-playfair)", weight: 600 },
    lora: { label: "Lora", css: "var(--font-lora)", weight: 600 },
    "instrument-serif": { label: "Instrument Serif", css: "var(--font-instrument)", weight: 400 },
    poppins: { label: "Poppins", css: "var(--font-poppins)", weight: 700 },
    "dm-sans": { label: "DM Sans", css: "var(--font-dm-sans)", weight: 700 },
    outfit: { label: "Outfit", css: "var(--font-outfit)", weight: 700 },
    syne: { label: "Syne", css: "var(--font-syne)", weight: 700 },
    // tall capitals only, one weight: for names and titles, like a poster
    bebas: { label: "Bebas Neue", css: "var(--font-bebas)", weight: 400, display: true },
    // handwritten scripts: for names and titles, set large; never for long text
    pinyon: { label: "Pinyon Script", css: "var(--font-pinyon)", weight: 400, script: true },
    caveat: { label: "Caveat", css: "var(--font-caveat)", weight: 600, script: true },
} as const;

// A photo the "Photo" template starts with, so it shows something before an upload
const SAMPLE_PHOTO = "https://images.unsplash.com/photo-1691120040190-b763dfee386c?w=1200&q=80&auto=format&fit=crop";

// Picking a template replaces the whole theme; everything in it can be changed afterwards.
// Almost every look opens with a poster or a banner; only Forest (what a new page wears before
// it has a photo) and Photo (whose background is already a picture) keep the small classic photo.
// The bold ones come first: they're what Roselle looks like. The quieter editorial ones follow.
export const TEMPLATES: { id: string; name: string; theme: Theme }[] = [
    {
        id: "poster",
        name: "Poster",
        theme: {
            template: "poster",
            background: { kind: "solid", colors: ["#141414", "#141414", "#141414"], angle: 180, image: "", pattern: "dots" },
            text: "#ffffff",
            muted: "#c9c2bd",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "glass", shape: "pill", color: "#ffffff", textColor: "#ffffff", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "rosebud",
        name: "Rosebud",
        theme: {
            template: "rosebud",
            background: { kind: "solid", colors: ["#f6b5cf", "#f6b5cf", "#f6b5cf"], angle: 180, image: "", pattern: "dots" },
            text: "#0b4d2c",
            muted: "#2f6b4b",
            font: { heading: "dm-serif", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#0b4d2c", textColor: "#fff7f5", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "picnic",
        name: "Picnic",
        theme: {
            template: "picnic",
            background: { kind: "pattern", colors: ["#fff7f5", "#fde3ee", "#fde3ee"], angle: 180, image: "", pattern: "checks" },
            text: "#0b4d2c",
            muted: "#2f6b4b",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "pop", shape: "pill", color: "#ffffff", textColor: "#0b4d2c", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "bloom",
        name: "Bloom",
        theme: {
            template: "bloom",
            background: { kind: "pattern", colors: ["#0b4d2c", "#155f39", "#155f39"], angle: 180, image: "", pattern: "flowers" },
            text: "#fff7f5",
            muted: "#f6b5cf",
            font: { heading: "fraunces", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#f6b5cf", textColor: "#0b4d2c", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "sweetheart",
        name: "Sweetheart",
        theme: {
            template: "sweetheart",
            background: { kind: "pattern", colors: ["#e0408f", "#ea6aa8", "#ea6aa8"], angle: 180, image: "", pattern: "hearts" },
            text: "#ffffff",
            muted: "#fde3ee",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#ffffff", textColor: "#b0246a", shadow: true },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "velvet",
        name: "Velvet",
        theme: {
            template: "velvet",
            background: { kind: "glow", colors: ["#062b19", "#0b4d2c", "#e0408f"], angle: 170, image: "", pattern: "dots" },
            text: "#fff7f5",
            muted: "#f6b5cf",
            font: { heading: "fraunces", body: "manrope" },
            button: { style: "glass", shape: "pill", color: "#ffffff", textColor: "#fff7f5", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "candy",
        name: "Candy",
        theme: {
            template: "candy",
            background: { kind: "pattern", colors: ["#ffffff", "#fde3ee", "#fde3ee"], angle: 180, image: "", pattern: "stripes" },
            text: "#b0246a",
            muted: "#c4497f",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#e0408f", textColor: "#ffffff", shadow: true },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "starlight",
        name: "Starlight",
        theme: {
            template: "starlight",
            background: { kind: "pattern", colors: ["#141414", "#2a2a2a", "#2a2a2a"], angle: 180, image: "", pattern: "stars" },
            text: "#ffffff",
            muted: "#cfcfcf",
            font: { heading: "space-grotesk", body: "inter" },
            button: { style: "outline", shape: "pill", color: "#f6b5cf", textColor: "#f6b5cf", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    // Four soft looks after what creators pin most: a peach-to-pink sunset, a lavender haze with a
    // handwritten name, a muted sage, and leopard print
    {
        id: "sunset",
        name: "Sunset",
        theme: {
            template: "sunset",
            background: { kind: "gradient", colors: ["#ffcfa8", "#ff9e9a", "#f27fae"], angle: 165, image: "", pattern: "dots" },
            text: "#4b1630",
            muted: "#7a3550",
            font: { heading: "fraunces", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#ffffff", textColor: "#4b1630", shadow: true },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "lavender",
        name: "Lavender",
        theme: {
            template: "lavender",
            background: { kind: "gradient", colors: ["#f7f0ff", "#e6daff", "#ffd8ec"], angle: 180, image: "", pattern: "dots" },
            text: "#3b2a5e",
            muted: "#6d5a91",
            font: { heading: "pinyon", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#ffffff", textColor: "#3b2a5e", shadow: true },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "sage",
        name: "Sage",
        theme: {
            template: "sage",
            background: { kind: "solid", colors: ["#7f8c69", "#7f8c69", "#7f8c69"], angle: 180, image: "", pattern: "dots" },
            text: "#fbfaf2",
            muted: "#e3e6d2",
            font: { heading: "cormorant", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#ebe9d8", textColor: "#38402c", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "leopard",
        name: "Leopard",
        theme: {
            template: "leopard",
            background: { kind: "pattern", colors: ["#efe0c6", "#b08155", "#b08155"], angle: 180, image: "", pattern: "leopard" },
            text: "#3b2412",
            muted: "#6e4b2e",
            font: { heading: "dm-serif", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#4a2e1a", textColor: "#f6ead8", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    // Bold one-colour looks: the photo melts into a page of one strong colour, everything on it
    // in the same family, section titles as small labels. The way the best link pages look.
    {
        id: "cherry",
        name: "Cherry",
        theme: {
            template: "cherry",
            background: { kind: "solid", colors: ["#8a1a22", "#8a1a22", "#8a1a22"], angle: 180, image: "", pattern: "dots" },
            text: "#fff4f1",
            muted: "#f3c9c4",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#120708", textColor: "#ffffff", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "label" },
        },
    },
    {
        id: "tangerine",
        name: "Tangerine",
        theme: {
            template: "tangerine",
            background: { kind: "solid", colors: ["#ef6a32", "#ef6a32", "#ef6a32"], angle: 180, image: "", pattern: "dots" },
            text: "#2a0f04",
            muted: "#5a2510",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#fff6ef", textColor: "#2a0f04", shadow: true },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "label" },
        },
    },
    {
        id: "pistachio",
        name: "Pistachio",
        theme: {
            template: "pistachio",
            background: { kind: "solid", colors: ["#c6dc7e", "#c6dc7e", "#c6dc7e"], angle: 180, image: "", pattern: "dots" },
            text: "#1f3417",
            muted: "#3d5a2c",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "pop", shape: "pill", color: "#fffbe6", textColor: "#1f3417", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "label" },
        },
    },
    {
        id: "mocha",
        name: "Mocha",
        theme: {
            template: "mocha",
            background: { kind: "solid", colors: ["#3b2b26", "#3b2b26", "#3b2b26"], angle: 180, image: "", pattern: "dots" },
            text: "#f8efe9",
            muted: "#cdb9ad",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#0f0b0a", textColor: "#f8efe9", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "label" },
        },
    },
    {
        id: "blush",
        name: "Blush",
        theme: {
            template: "blush",
            background: { kind: "solid", colors: ["#f7dcd5", "#f7dcd5", "#f7dcd5"], angle: 180, image: "", pattern: "dots" },
            text: "#3d1f1a",
            muted: "#7a4a40",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#fffaf8", textColor: "#3d1f1a", shadow: true },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "label" },
        },
    },
    {
        id: "forest",
        name: "Forest",
        theme: {
            template: "forest",
            background: { kind: "solid", colors: ["#0b4d2c", "#0b4d2c", "#0b4d2c"], angle: 180, image: "", pattern: "dots" },
            text: "#fff7f5",
            muted: "#f6b5cf",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#f6b5cf", textColor: "#0b4d2c", shadow: false },
            layout: { align: "center", avatar: "circle", header: "classic", titles: "display" },
        },
    },
    {
        id: "pop",
        name: "Hot Pink",
        theme: {
            template: "pop",
            background: { kind: "solid", colors: ["#e0408f", "#e0408f", "#e0408f"], angle: 180, image: "", pattern: "dots" },
            text: "#ffffff",
            muted: "#fde3ee",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "pop", shape: "pill", color: "#ffffff", textColor: "#1b1416", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "butter",
        name: "Butter",
        theme: {
            template: "butter",
            background: { kind: "solid", colors: ["#ffd84d", "#ffd84d", "#ffd84d"], angle: 180, image: "", pattern: "dots" },
            text: "#1b1416",
            muted: "#5c4a1c",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "pop", shape: "rounded", color: "#ffffff", textColor: "#1b1416", shadow: false },
            layout: { align: "center", avatar: "circle", header: "banner", titles: "display" },
        },
    },
    {
        id: "bubblegum",
        name: "Bubblegum",
        theme: {
            template: "bubblegum",
            background: { kind: "gradient", colors: ["#ffd9e0", "#ffb3c4", "#ff8fab"], angle: 170, image: "", pattern: "dots" },
            text: "#4d0718",
            muted: "#8c3a50",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#ffffff", textColor: "#4d0718", shadow: true },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "photo",
        name: "Photo",
        theme: {
            template: "photo",
            background: { kind: "image", colors: ["#1b1416", "#1b1416", "#1b1416"], angle: 180, image: SAMPLE_PHOTO, pattern: "dots" },
            text: "#ffffff",
            muted: "#f1e4e6",
            font: { heading: "bricolage", body: "manrope" },
            button: { style: "glass", shape: "pill", color: "#ffffff", textColor: "#ffffff", shadow: false },
            layout: { align: "center", avatar: "circle", header: "classic", titles: "display" },
        },
    },
    {
        id: "noir",
        name: "Cherry Noir",
        theme: {
            template: "noir",
            background: { kind: "glow", colors: ["#16110f", "#7a0f24", "#c2183b"], angle: 160, image: "", pattern: "dots" },
            text: "#f7efe9",
            muted: "#c9b5ad",
            font: { heading: "dm-serif", body: "manrope" },
            button: { style: "glass", shape: "rounded", color: "#ffffff", textColor: "#f7efe9", shadow: false },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "bordeaux",
        name: "Bordeaux",
        theme: {
            template: "bordeaux",
            background: { kind: "gradient", colors: ["#3a0812", "#8e1230", "#c8394f"], angle: 165, image: "", pattern: "dots" },
            text: "#fff4ef",
            muted: "#f0c4c4",
            font: { heading: "fraunces", body: "manrope" },
            button: { style: "solid", shape: "pill", color: "#fff4ef", textColor: "#5c0b1d", shadow: true },
            layout: { align: "center", avatar: "circle", header: "poster", titles: "display" },
        },
    },
    {
        id: "studio",
        name: "Studio",
        theme: {
            template: "studio",
            background: { kind: "solid", colors: ["#1c1a19", "#1c1a19", "#1c1a19"], angle: 180, image: "", pattern: "dots" },
            text: "#efe9e4",
            muted: "#968c86",
            font: { heading: "space-grotesk", body: "inter" },
            button: { style: "solid", shape: "rounded", color: "#c2183b", textColor: "#ffffff", shadow: false },
            layout: { align: "left", avatar: "circle", header: "banner", titles: "display" },
        },
    },
];

// The looks the landing page shows off: everything with a poster or banner header
export const SHOWCASE = TEMPLATES.filter((template) => template.theme.layout.header !== "classic");

// A template put on a page: its colours, wallpaper, fonts and buttons, but the choices made in
// the Header section (the header style, the photo's shape, centred or left) and the text size and
// weight stay the creator's own. Picking a look shouldn't undo how they set up the top of their page.
export function wearTemplate(current: Theme, template: Theme): Theme {
    const { header, avatar, align } = current.layout;
    return {
        ...template,
        layout: { ...template.layout, header, avatar, align },
        ...(current.type && { type: current.type }),
    };
}

// The same theme, whatever order the keys were saved in (a draft read back from the database
// isn't in the order the templates are written in)
const canonical = (value: unknown): unknown =>
    Array.isArray(value)
        ? value.map(canonical)
        : value && typeof value === "object"
          ? Object.fromEntries(
                Object.entries(value)
                    .filter(([, entry]) => entry !== undefined)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, entry]) => [key, canonical(entry)]),
            )
          : value;

// The template this page is wearing, if any: putting it on again would change nothing
export const templateOf = (theme: Theme) => TEMPLATES.find((template) => JSON.stringify(canonical(wearTemplate(theme, template.theme))) === JSON.stringify(canonical(theme)));
