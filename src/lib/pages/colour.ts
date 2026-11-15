import type { Theme } from "@/lib/validations/page";

// "Match my photo": the page takes its colour from the creator's own picture, so the photo melts
// into the page the way the best link pages do (a red dress on a red page, a lime jar on lime).
// The editor reads the pixels (see DesignPanel); everything here is plain maths, so it's tested.

type Rgb = [number, number, number];

// The colour most of these pixels share: grouped into coarse buckets, the biggest bucket wins,
// and its pixels are averaged. A plain average of a whole photo comes out a muddy brown.
export function dominantColour(pixels: Uint8ClampedArray): Rgb {
    const buckets = new Map<number, { count: number; sum: Rgb }>();
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] < 128) continue;
        const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]];
        const key = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
        const bucket = buckets.get(key) ?? { count: 0, sum: [0, 0, 0] };
        bucket.count++;
        bucket.sum[0] += r;
        bucket.sum[1] += g;
        bucket.sum[2] += b;
        buckets.set(key, bucket);
    }
    const top = [...buckets.values()].sort((a, b) => b.count - a.count)[0];
    if (!top) return [20, 20, 20];
    return top.sum.map((total) => Math.round(total / top.count)) as Rgb;
}

const hex = (rgb: Rgb) => `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

function toHsl([r, g, b]: Rgb): Rgb {
    [r, g, b] = [r / 255, g / 255, b / 255];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [h * 60, s, l];
}

function fromHsl([h, s, l]: Rgb): Rgb {
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return [0, 8, 4].map((n) => 255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)))) as Rgb;
}

// how bright a colour looks to the eye (WCAG relative luminance)
function luminance(rgb: Rgb) {
    const [r, g, b] = rgb.map((value) => {
        const c = value / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const mix = (a: Rgb, b: Rgb, amount: number) => a.map((value, i) => value + (b[i] - value) * amount) as Rgb;

// A whole colour scheme from one colour: the page in it, text that reads on it, and solid
// buttons that stand out: near-black on a dark or strong page, a soft cream on a pale one.
export function themeFromColour(colour: Rgb): Pick<Theme, "text" | "muted"> & { background: Pick<Theme["background"], "kind" | "colors">; button: Pick<Theme["button"], "style" | "color" | "textColor" | "shadow"> } {
    const [h, s, l] = toHsl(colour);
    // a photo's colour, made a little richer and kept away from pure black or white
    const base = fromHsl([h, Math.min(s * 1.15, 0.85), Math.min(Math.max(l, 0.12), 0.9)]);
    const light = luminance(base) > 0.4;

    const text = light ? fromHsl([h, Math.min(s, 0.55), 0.13]) : fromHsl([h, Math.min(s, 0.3), 0.97]);
    const button = light ? fromHsl([h, Math.min(s, 0.7), 0.97]) : fromHsl([h, Math.min(s, 0.35), 0.08]);
    const page = hex(base);

    return {
        background: { kind: "solid", colors: [page, page, page] },
        text: hex(text),
        muted: hex(mix(text, base, 0.28)),
        button: { style: "solid", color: hex(button), textColor: light ? hex(text) : "#ffffff", shadow: light },
    };
}

// ---------- Readability ----------
// Plain hex in, plain hex or numbers out, for the theme and the editor's "hard to read" check

const rgbOf = (value: string): Rgb => [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16)) as Rgb;

// `a` moved `amount` (0-1) of the way to `b`: a pattern faded into its page, quiet text
export const blend = (a: string, b: string, amount: number) => hex(mix(rgbOf(a), rgbOf(b), amount));

// WCAG contrast ratio, 1 (none) to 21 (black on white). Body text wants 4.5, big type 3.
export function contrast(a: string, b: string) {
    const [light, dark] = [luminance(rgbOf(a)), luminance(rgbOf(b))].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

// near-black or white, whichever reads better on this colour
export const readableOn = (background: string) => (contrast("#141414", background) >= contrast("#ffffff", background) ? "#141414" : "#ffffff");

// What a pattern's print looks like at its strength: faded toward the page colour
export const patternInk = (background: Theme["background"]) => blend(background.colors[0], background.colors[1], (background.patternStrength ?? 100) / 100);

// What the box colour looks like over the page: the page with the box colour laid on at its fill
export const boxColour = (theme: Theme) => blend(theme.background.colors[0], theme.card?.color || theme.text, (theme.card?.fill ?? 5) / 100);

export interface ReadabilityIssue {
    id: string;
    message: string;
    fixes: { label: string; apply: (theme: Theme) => Theme }[];
}

// Text the eye has to fight: a strong pattern behind it, text too close to its background,
// button words that melt into the button. Each with one-tap ways out, for the Design panel.
// Thresholds are WCAG's: 4.5 for text, 3 for big type and buttons.
export function readabilityIssues(theme: Theme): ReadabilityIssue[] {
    const { background, button } = theme;
    const base = background.colors[0];
    const issues: ReadabilityIssue[] = [];
    const readableText = (on: string) => (t: Theme): Theme => {
        const text = readableOn(on);
        return { ...t, text, muted: blend(text, on, 0.3) };
    };

    // what text sits on: the page colour, and the print or the gradient's other colours
    const behind = background.kind === "pattern" ? [base, patternInk(background)] : background.kind === "gradient" || background.kind === "glow" ? background.colors : [base];
    const worst = Math.min(...behind.map((colour) => contrast(theme.text, colour)));

    if (background.kind === "pattern" && worst < 4.5 && contrast(theme.text, base) >= 4.5) {
        issues.push({
            id: "pattern",
            message: "The pattern is strong behind your text, so words are hard to read.",
            fixes: [
                { label: "Fade the pattern", apply: (t) => ({ ...t, background: { ...t.background, patternStrength: 30 } }) },
                // titles and the name sit outside the boxes, so the print softens too
                { label: "Solid boxes, softer pattern", apply: (t) => ({ ...t, card: { color: t.background.colors[0], fill: 92 }, background: { ...t.background, patternStrength: 40 } }) },
            ],
        });
    } else if (worst < 4.5) {
        issues.push({ id: "text", message: "Your text is too close in colour to the background.", fixes: [{ label: "Use readable text", apply: readableText(base) }] });
    }
    // on its own: quiet text can be faint even when the main text is fine
    if (contrast(theme.muted, base) < 3) {
        issues.push({ id: "muted", message: "Quiet text (bios, descriptions) is very faint.", fixes: [{ label: "Make it stronger", apply: (t) => ({ ...t, muted: blend(t.text, t.background.colors[0], 0.3) }) }] });
    }

    // filled buttons carry their words on the button colour; the see-through ones on the page
    const filled = button.style === "solid" || button.style === "pop";
    const buttonBehind = filled ? button.color : base;
    if (contrast(button.textColor, buttonBehind) < 3) {
        issues.push({
            id: "button",
            message: "The words on your buttons are hard to read.",
            fixes: [{ label: "Fix button text", apply: (t) => ({ ...t, button: { ...t.button, textColor: readableOn(buttonBehind) } }) }],
        });
    }

    // a fairly solid box of a chosen colour: the text has to read on it too
    if (theme.card?.color && theme.card.fill >= 40 && contrast(theme.text, boxColour(theme)) < 4.5) {
        issues.push({
            id: "boxes",
            message: "Your text is hard to read on the box colour.",
            fixes: [
                { label: "See-through boxes", apply: (t) => ({ ...t, card: { color: "", fill: 5 } }) },
                { label: "Use readable text", apply: (t) => readableText(boxColour(t))(t) },
            ],
        });
    }

    return issues;
}
