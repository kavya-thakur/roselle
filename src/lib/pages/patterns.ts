// Printed backgrounds: a small repeating motif in one colour on another, drawn with CSS
// gradients or a tiny inline SVG, so they cost no image downloads and stay sharp at any size.

import { safeHref } from "./links";
import type { Theme } from "@/lib/validations/page";

export const PATTERN_KEYS = ["dots", "checks", "stripes", "grid", "waves", "flowers", "hearts", "stars"] as const;
export type PatternKey = (typeof PATTERN_KEYS)[number];

export const PATTERN_LABELS: Record<PatternKey, string> = {
    dots: "Dots",
    checks: "Checks",
    stripes: "Stripes",
    grid: "Grid",
    waves: "Waves",
    flowers: "Flowers",
    hearts: "Hearts",
    stars: "Stars",
};

// An SVG motif as a CSS background image. The colour goes into the URL, so its # is encoded.
const svg = (body: string, size: number, ink: string) =>
    `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><g fill='${ink}'>${body}</g></svg>`)}")`;

// A pattern as layers: each a picture repeated at its tile size, all over the `base` colour.
// Kept as separate parts (not one CSS shorthand) because the share image's renderer only
// understands background-image and background-size given separately.
function patternLayers(pattern: PatternKey, base: string, ink: string): { image: string; size: string }[] {
    switch (pattern) {
        case "dots":
            return [{ image: svg("<circle cx='11' cy='11' r='2.75'/>", 22, ink), size: "22px 22px" }];
        case "checks":
            return [{ image: svg("<rect width='28' height='28'/><rect x='28' y='28' width='28' height='28'/>", 56, ink), size: "56px 56px" }];
        case "stripes":
            return [{ image: `repeating-linear-gradient(-45deg, ${ink} 0px, ${ink} 14px, ${base} 14px, ${base} 28px)`, size: "auto" }];
        case "grid":
            return [
                { image: `linear-gradient(${ink} 1.5px, transparent 1.5px)`, size: "28px 28px" },
                { image: `linear-gradient(90deg, ${ink} 1.5px, transparent 1.5px)`, size: "28px 28px" },
            ];
        case "waves":
            return [{ image: svg("<path d='M0 18 Q 12 6 24 18 T 48 18 V22 Q 36 10 24 22 T 0 22 Z'/>", 48, ink), size: "48px 48px" }];
        case "flowers":
            // a four-petal flower, two per tile so the repeat reads as scattered
            return [
                {
                    image: svg(
                        "<g transform='translate(18 18)'><circle cx='0' cy='-7' r='6'/><circle cx='7' cy='0' r='6'/><circle cx='0' cy='7' r='6'/><circle cx='-7' cy='0' r='6'/></g><g transform='translate(54 54) rotate(45)'><circle cx='0' cy='-7' r='6'/><circle cx='7' cy='0' r='6'/><circle cx='0' cy='7' r='6'/><circle cx='-7' cy='0' r='6'/></g>",
                        72,
                        ink,
                    ),
                    size: "72px 72px",
                },
            ];
        case "hearts":
            return [{ image: svg("<path d='M20 30 C 6 20 8 10 14 10 C 17 10 19 12 20 14 C 21 12 23 10 26 10 C 32 10 34 20 20 30 Z'/>", 40, ink), size: "40px 40px" }];
        case "stars":
            return [{ image: svg("<path d='M24 8 L27 20 L40 24 L27 28 L24 40 L21 28 L8 24 L21 20 Z'/>", 48, ink), size: "48px 48px" }];
    }
}

// The CSS background for a pattern: `ink` drawn on `base`
export function patternBackground(pattern: PatternKey, base: string, ink: string) {
    return [...patternLayers(pattern, base, ink).map((layer) => `${layer.image} 0 0 / ${layer.size}`), base].join(", ");
}

// The same, as separate style properties, for the share image
export function patternStyle(pattern: PatternKey, base: string, ink: string) {
    const layers = patternLayers(pattern, base, ink);
    return { backgroundColor: base, backgroundImage: layers.map((layer) => layer.image).join(", "), backgroundSize: layers.map((layer) => layer.size).join(", ") };
}

// The CSS background of a whole page, from its theme: the page itself and its share image use this
export function pageBackground(theme: Theme) {
    const [base, middle, light] = theme.background.colors;

    if (theme.background.kind === "solid") return base;
    if (theme.background.kind === "image") {
        // quotes, backslashes and line breaks are encoded, so the address can't end the CSS url("...") early
        const photo = safeHref(theme.background.image)?.replace(/["\\\n]/g, encodeURIComponent);
        // the first colour laid over the photo at 55%, so white text stays readable on any picture
        return photo ? `linear-gradient(${base}8c, ${base}8c), url("${photo}") center / cover` : base;
    }
    if (theme.background.kind === "pattern") return patternBackground(theme.background.pattern, base, middle);
    if (theme.background.kind === "gradient") return `linear-gradient(${theme.background.angle}deg, ${base}, ${middle}, ${light})`;

    // "glow": the light colour lit from the top right, the middle one rising from the bottom left
    return [
        `radial-gradient(110% 70% at 85% -5%, ${light}aa 0%, transparent 55%)`,
        `radial-gradient(80% 60% at 0% 100%, ${middle}99 0%, transparent 60%)`,
        `linear-gradient(${theme.background.angle}deg, ${base} 0%, ${base} 35%, ${middle} 100%)`,
    ].join(", ");
}
