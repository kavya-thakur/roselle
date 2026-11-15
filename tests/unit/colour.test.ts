import { describe, expect, it } from "vitest";
import { blend, contrast, dominantColour, readabilityIssues, themeFromColour } from "@/lib/pages/colour";
import { TEMPLATES } from "@/lib/pages/theme";
import type { Theme } from "@/lib/validations/page";

const pixels = (...colours: [number, number, number, number][]) => new Uint8ClampedArray(colours.flatMap(([r, g, b, n]) => Array.from({ length: n }, () => [r, g, b, 255]).flat()));

describe("matching a page to a photo", () => {
    it("takes the colour most of the photo shares, not a muddy average", () => {
        // mostly red, some white: red, not pink
        const [r, g, b] = dominantColour(pixels([180, 20, 30, 60], [250, 250, 250, 40]));
        expect([r, g, b]).toEqual([180, 20, 30]);
    });

    it("puts light text and dark buttons on a dark or strong colour", () => {
        const theme = themeFromColour([140, 26, 34]);
        expect(theme.background.colors[0]).toMatch(/^#[0-9a-f]{6}$/);
        expect(theme.text).toMatch(/^#f/);
        expect(theme.button.textColor).toBe("#ffffff");
    });

    it("puts dark text and pale buttons on a pale colour", () => {
        const theme = themeFromColour([198, 220, 126]);
        expect(theme.text).toMatch(/^#[0-3]/);
        expect(theme.button.color).toMatch(/^#f/);
        expect(theme.button.shadow).toBe(true);
    });

    it("never makes the page pure black or white", () => {
        expect(themeFromColour([0, 0, 0]).background.colors[0]).not.toBe("#000000");
        expect(themeFromColour([255, 255, 255]).background.colors[0]).not.toBe("#ffffff");
    });
});

describe("readability", () => {
    const base = TEMPLATES[0].theme;
    // the screenshot that started this: black text on pink, a strong dark-red grid, cream words on pink buttons
    const busy: Theme = {
        ...base,
        background: { ...base.background, kind: "pattern", colors: ["#e8b4c0", "#7a1424", "#7a1424"], pattern: "grid" },
        text: "#141414",
        muted: "#4a3a3e",
        button: { ...base.button, style: "pop", color: "#ecbccb", textColor: "#fff1d6" },
    };

    it("measures contrast like WCAG", () => {
        expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
        expect(contrast("#777777", "#777777")).toBe(1);
        expect(blend("#000000", "#ffffff", 0.5)).toBe("#808080");
    });

    it("flags a strong pattern and buttons whose words melt in, and its fixes clear them", () => {
        const ids = readabilityIssues(busy).map((issue) => issue.id);
        expect(ids).toEqual(["pattern", "button"]);

        let fixed = busy;
        for (const issue of readabilityIssues(busy)) fixed = issue.fixes[0].apply(fixed);
        expect(readabilityIssues(fixed)).toEqual([]);
        // the other way out of a strong pattern clears it too
        expect(readabilityIssues(readabilityIssues(busy)[0].fixes[1].apply(busy)).map((issue) => issue.id)).toEqual(["button"]);
    });

    it("says nothing about a page that reads well", () => {
        expect(readabilityIssues({ ...base, background: { ...base.background, kind: "solid", colors: ["#ffffff", "#ffffff", "#ffffff"] }, text: "#141414", muted: "#666666", button: { ...base.button, style: "solid", color: "#141414", textColor: "#ffffff" } })).toEqual([]);
    });

    it("checks text on solid boxes", () => {
        const dark: Theme = { ...base, background: { ...base.background, kind: "solid", colors: ["#ffffff", "#ffffff", "#ffffff"] }, text: "#141414", muted: "#555555", button: { ...base.button, style: "solid", color: "#141414", textColor: "#ffffff" }, card: { color: "#111111", fill: 90 } };
        const issue = readabilityIssues(dark).find((item) => item.id === "boxes")!;
        expect(issue).toBeDefined();
        expect(readabilityIssues(issue.fixes[0].apply(dark))).toEqual([]);
    });
});
