import { describe, expect, it } from "vitest";
import { isLive, musicEmbed, safeHref, targetOf, tipHref, videoEmbed } from "@/lib/pages/links";
import { iconFromUrl, newBlock, starterPage, titleFromUrl } from "@/lib/pages/blocks";
import { FEATURES, lockedFeatures } from "@/lib/plans";
import { pageSchema, themeSchema } from "@/lib/validations/page";
import { TEMPLATES } from "@/lib/pages/theme";
import { PATTERN_KEYS, patternBackground } from "@/lib/pages/patterns";
import { usernameSchema } from "@/lib/validations/common";
import { DEMO_PAGES } from "@/lib/pages/demo";
import { setupChecklist } from "@/lib/pages/checklist";

describe("safeHref", () => {
    it("never lets a script address through", () => {
        expect(safeHref("javascript:alert(1)")).toBeUndefined();
        expect(safeHref("  JavaScript:alert(1)")).toBeUndefined();
        expect(safeHref("data:text/html,<script>")).toBeUndefined();
        expect(safeHref("/media/../secret")).toBeUndefined();
    });

    it("keeps real links and fixes bare domains", () => {
        expect(safeHref("https://example.com")).toBe("https://example.com");
        expect(safeHref("mailto:a@b.co")).toBe("mailto:a@b.co");
        expect(safeHref("example.com/shop")).toBe("https://example.com/shop");
        expect(safeHref("/media/abc123")).toBe("/media/abc123");
        expect(safeHref("https://")).toBeUndefined();
    });
});

describe("isLive", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const link = newBlock("link");

    it("hides hidden blocks and respects the schedule", () => {
        expect(isLive(link, now)).toBe(true);
        expect(isLive({ ...link, visible: false }, now)).toBe(false);
        expect(isLive({ ...link, startsAt: "2026-06-02T00:00:00Z" }, now)).toBe(false);
        expect(isLive({ ...link, endsAt: "2026-06-01T11:00:00Z" }, now)).toBe(false);
        expect(isLive({ ...link, startsAt: "2026-05-01T00:00:00Z", endsAt: "2026-07-01T00:00:00Z" }, now)).toBe(true);
    });
});

describe("page documents", () => {
    it("accepts the starter page and the demo pages as they are", () => {
        const starter = starterPage("ada");
        expect(pageSchema.parse(starter)).toEqual(starter);
        for (const demo of DEMO_PAGES) expect(pageSchema.safeParse(demo).success).toBe(true);
    });

    it("refuses a block type the renderer doesn't know", () => {
        const page = starterPage("ada");
        expect(pageSchema.safeParse({ ...page, blocks: [{ id: "x", type: "script" }] }).success).toBe(false);
    });

    it("finds the player address for YouTube and Vimeo", () => {
        expect(videoEmbed("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
        expect(videoEmbed("https://vimeo.com/76979871")).toBe("https://player.vimeo.com/video/76979871");
        expect(videoEmbed("https://example.com")).toBeUndefined();
    });
});

describe("usernames", () => {
    it("lowercases and checks the shape", () => {
        expect(usernameSchema.parse(" Ada.Lovelace ")).toBe("ada.lovelace");
        expect(usernameSchema.safeParse("ab").success).toBe(false);
        expect(usernameSchema.safeParse(".ada").success).toBe(false);
        expect(usernameSchema.safeParse("login").success).toBe(false);
    });
});

describe("setup checklist", () => {
    it("starts at nothing done and counts each step", () => {
        const page = starterPage("ada");
        expect(setupChecklist(page, false).done).toBe(0);

        const filled = {
            ...page,
            profile: { ...page.profile, avatar: "/media/abc", bio: "Hi", socials: [{ platform: "x" as const, url: "https://x.com/ada" }] },
            blocks: [1, 2, 3].map((n) => ({ ...newBlock("link"), id: `l${n}`, url: `https://example.com/${n}` })),
            theme: { ...page.theme, text: "#000000" },
        };
        expect(setupChecklist(filled, true).done).toBe(6);
    });
});

describe("titleFromUrl", () => {
    it("names a pasted link after its site", () => {
        expect(titleFromUrl("https://www.instagram.com/ada")).toBe("Instagram");
        expect(titleFromUrl("youtube.com")).toBe("Youtube");
        expect(titleFromUrl("")).toBe("New link");
    });
});

describe("templates", () => {
    it("every template is a valid theme, and old pages without the newer fields still load", () => {
        for (const template of TEMPLATES) expect(themeSchema.safeParse(template.theme).success).toBe(true);

        // a page saved before patterns, header styles and covers existed
        const old = starterPage("ada") as unknown as { profile: Record<string, unknown>; theme: { layout: Record<string, unknown>; background: Record<string, unknown> } };
        delete old.profile.cover;
        delete old.theme.layout.header;
        delete old.theme.background.pattern;
        const parsed = pageSchema.parse(old);
        expect(parsed.theme.layout.header).toBe("classic");
        expect(parsed.profile.cover).toBe("");
    });

    it("draws every pattern", () => {
        for (const key of PATTERN_KEYS) expect(patternBackground(key, "#ffffff", "#000000")).toContain("#");
    });
});

describe("music, tips and icons", () => {
    it("turns music links into players", () => {
        expect(musicEmbed("https://open.spotify.com/intl-de/track/4uLU6hMCjMI75M1A2tKUQC?si=x")).toEqual({ src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC", height: 152 });
        expect(musicEmbed("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M")?.height).toBe(352);
        expect(musicEmbed("https://music.apple.com/gb/album/x/1440857781?i=1440858103")?.src).toBe("https://embed.music.apple.com/gb/album/x/1440857781?i=1440858103");
        expect(musicEmbed("https://soundcloud.com/artist/track")?.src).toContain("w.soundcloud.com/player/?url=https%3A%2F%2Fsoundcloud.com");
        expect(musicEmbed("https://example.com/song")).toBeUndefined();
    });

    it("builds tip addresses from whatever people paste", () => {
        expect(tipHref("kofi", "https://ko-fi.com/ada/")).toBe("https://ko-fi.com/ada");
        expect(tipHref("cashapp", "$ada")).toBe("https://cash.app/$ada");
        expect(tipHref("paypal", "@ada")).toBe("https://paypal.me/ada");
        expect(tipHref("upi", "ada@okbank")).toBe("upi://pay?pa=ada%40okbank&cu=INR");
        expect(tipHref("upi", "not a upi id")).toBeUndefined();
        expect(tipHref("link", "javascript:alert(1)")).toBeUndefined();
        expect(tipHref("kofi", "ada<script>")).toBeUndefined();
    });

    it("sends taps on a tip block to the payment page", () => {
        const tip = blockSchemaParse({ id: "t", type: "tip", provider: "venmo", handle: "ada" });
        expect(targetOf(tip)).toBe("https://venmo.com/u/ada");
        expect(targetOf(blockSchemaParse({ id: "m", type: "music", url: "https://open.spotify.com/track/x" }))).toBeUndefined();
    });

    it("guesses a pasted link's icon", () => {
        expect(iconFromUrl("https://www.instagram.com/ada")).toBe("instagram");
        expect(iconFromUrl("wa.me/4471234")).toBe("whatsapp");
        expect(iconFromUrl("mailto:ada@x.com")).toBe("email");
        expect(iconFromUrl("https://example.com")).toBe("");
    });

    it("gives links saved before icons existed no icon", () => {
        expect(blockSchemaParse({ id: "l", type: "link", title: "Old", url: "https://x.com" })).toMatchObject({ icon: "" });
    });
});

describe("plans", () => {
    it("lets everyone publish while nothing is Pro", () => {
        const page = { ...starterPage("ada"), blocks: [newBlock("music"), newBlock("tip")] };
        expect(lockedFeatures(page, "FREE")).toEqual([]);
    });

    it("stops a free page publishing a Pro feature, but not a Pro one", () => {
        const music = FEATURES.music as { pro: boolean };
        const was = music.pro;
        music.pro = true;
        try {
            const page = { ...starterPage("ada"), blocks: [newBlock("music")] };
            expect(lockedFeatures(page, "FREE")).toEqual(["Music players"]);
            expect(lockedFeatures(page, "PRO")).toEqual([]);
        } finally {
            music.pro = was;
        }
    });
});

function blockSchemaParse(raw: object) {
    return pageSchema.shape.blocks.element.parse(raw);
}
