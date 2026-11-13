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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "classic" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "banner" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "classic" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "center", avatar: "circle", header: "poster" },
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
            layout: { align: "left", avatar: "circle", header: "banner" },
        },
    },
];

// The looks the landing page shows off: everything with a poster or banner header
export const SHOWCASE = TEMPLATES.filter((template) => template.theme.layout.header !== "classic");
