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
