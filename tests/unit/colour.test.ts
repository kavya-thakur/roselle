import { describe, expect, it } from "vitest";
import { dominantColour, themeFromColour } from "@/lib/pages/colour";

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
