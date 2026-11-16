import { describe, expect, it } from "vitest";
import { destinationOf, hasCaseStudy, isLive, musicEmbed, safeHref, targetOf, tipHref, videoEmbed } from "@/lib/pages/links";
import { iconFromUrl, newBlock, starterPage, titleFromUrl } from "@/lib/pages/blocks";
import { FEATURES, lockedFeatures } from "@/lib/plans";
import { pageSchema, themeSchema, type Block } from "@/lib/validations/page";
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
            blocks: [{ ...newBlock("gallery"), images: [{ src: "/media/photo", alt: "" }] } as Block, newBlock("contact")],
        };
        expect(setupChecklist(filled, true).done).toBe(6);
    });

    it("doesn't count an empty gallery as showing work", () => {
        const page = { ...starterPage("ada"), blocks: [newBlock("gallery")] };
        expect(setupChecklist(page, false).steps.find((step) => step.label === "Show your work")?.done).toBe(false);
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

describe("portfolio blocks", () => {
    it("opens a project's own page only when it has a story or pictures", () => {
        const project = (extra: object) => blockSchemaParse({ id: "p", type: "project", title: "Logo", url: "https://x.com", ...extra });
        expect(hasCaseStudy(project({}))).toBe(false);
        expect(hasCaseStudy(project({ body: "The brief was…" }))).toBe(true);
        expect(hasCaseStudy(project({ images: [{ src: "https://img.com/a.jpg", alt: "" }] }))).toBe(true);
        // a picture with no usable address doesn't count
        expect(hasCaseStudy(project({ images: [{ src: "javascript:alert(1)", alt: "" }] }))).toBe(false);
    });

    it("keeps galleries saved before layouts existed as grids", () => {
        expect(blockSchemaParse({ id: "g", type: "gallery", images: [] })).toMatchObject({ layout: "grid" });
    });

    it("keeps links saved before second lines and codes existed", () => {
        expect(blockSchemaParse({ id: "l", type: "link", title: "Shop", url: "https://x.com" })).toMatchObject({ subtitle: "", code: "" });
    });

    it("keeps Picks to a dozen and Stats to four", () => {
        const pick = (i: number) => ({ id: `p${i}`, title: "Cup", label: "$40", image: "https://img.com/a.jpg", url: "https://x.com" });
        expect(blockSchemaParse({ id: "k", type: "picks", items: [pick(1)] })).toMatchObject({ title: "" });
        expect(() => blockSchemaParse({ id: "k", type: "picks", items: Array.from({ length: 13 }, (_, i) => pick(i)) })).toThrow();
        expect(() => blockSchemaParse({ id: "s", type: "stats", items: Array.from({ length: 5 }, (_, i) => ({ id: `s${i}`, value: "1", label: "x" })) })).toThrow();
    });

    it("sends a tap on a pick to that pick's own link, and nowhere unsafe", () => {
        const picks = blockSchemaParse({
            id: "k",
            type: "picks",
            items: [
                { id: "a", title: "Cup", label: "", image: "", url: "https://shop.com/cup" },
                { id: "b", title: "Bad", label: "", image: "", url: "javascript:alert(1)" },
            ],
        });
        expect(destinationOf(picks, "lena", "a")).toBe("https://shop.com/cup");
        expect(destinationOf(picks, "lena", "b")).toBeUndefined();
        expect(destinationOf(picks, "lena", "missing")).toBeUndefined();
    });

    it("starts a contact block ready to use", () => {
        expect(newBlock("contact")).toMatchObject({ type: "contact", title: "Work with me", button: "Send message" });
    });
});

describe("enquiries", () => {
    it("needs a name, a real email and a message", async () => {
        const { enquirySchema } = await import("@/lib/validations/enquiry");
        const ok = { pageId: 1, blockId: "c", name: "Ada", email: "Ada@Example.com", message: "Hi there" };
        expect(enquirySchema.parse(ok)).toMatchObject({ email: "ada@example.com", website: "" });
        expect(enquirySchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
        expect(enquirySchema.safeParse({ ...ok, name: "  " }).success).toBe(false);
    });
});

describe("bookings", () => {
    it("counts a booking from the day it was won, and stops if it falls through", async () => {
        const { bookedAtFor } = await import("@/lib/bookings");
        const then = new Date("2026-10-01");
        expect(bookedAtFor("BOOKED", null, then)).toBe(then);
        // paid later keeps the original booking date
        expect(bookedAtFor("PAID", then, new Date("2026-11-01"))).toBe(then);
        expect(bookedAtFor("CLOSED", then)).toBeNull();
        expect(bookedAtFor("REPLIED", then)).toBeNull();
    });

    it("adds up this month's work, money to come and open enquiries", async () => {
        const { summarise } = await import("@/lib/bookings");
        const now = new Date("2026-11-20T12:00:00");
        const summary = summarise(
            [
                { status: "PAID", amount: 900, bookedAt: "2026-11-03T10:00:00" },
                { status: "BOOKED", amount: 300, bookedAt: "2026-11-15T10:00:00" },
                // booked last month: waiting to be paid, but not this month's work
                { status: "BOOKED", amount: 500, bookedAt: "2026-10-28T10:00:00" },
                { status: "NEW", amount: null, bookedAt: null },
                { status: "REPLIED", amount: null, bookedAt: null },
                { status: "CLOSED", amount: 1000, bookedAt: null },
            ],
            now,
        );
        expect(summary).toEqual({ bookedThisMonth: 1200, awaitingPayment: 800, open: 2 });
    });

    it("formats money in the creator's currency", async () => {
        const { currencySymbol, formatMoney } = await import("@/lib/utils/format");
        expect(formatMoney(25000, "INR")).toBe("₹25,000");
        expect(formatMoney(1200, "USD")).toBe("$1,200");
        expect(currencySymbol("EUR")).toBe("€");
    });

    it("puts views, enquiries and bookings side by side per source", async () => {
        const { sourcesTable } = await import("@/lib/analytics/stats");
        const rows = sourcesTable(
            [{ source: "instagram.com", _count: 40 }, { source: "direct", _count: 60 }],
            [{ source: "instagram.com", _count: 3 }, { source: "newsletter", _count: 1 }],
            [{ source: "instagram.com", _count: 1 }],
        );
        expect(rows).toEqual([
            { label: "Unknown", icon: undefined, count: 60, enquiries: 0, booked: 0 },
            { label: "Instagram", icon: "instagram", count: 40, enquiries: 3, booked: 1 },
            // an enquiry whose view wasn't recorded still shows up
            { label: "Email", icon: "email", count: 0, enquiries: 1, booked: 0 },
        ]);
    });

    it("adds up the addresses one place goes by, and says where the work comes from", async () => {
        const { sourcesTable, sourcesSummary } = await import("@/lib/analytics/stats");
        const rows = sourcesTable(
            [{ source: "l.instagram.com", _count: 10 }, { source: "instagram.com", _count: 5 }, { source: "ig", _count: 2 }, { source: "wa.me", _count: 4 }, { source: "direct", _count: 30 }],
            [{ source: "instagram.com", _count: 2 }, { source: "whatsapp", _count: 3 }],
            [],
        );
        expect(rows.map((row) => [row.label, row.count, row.enquiries])).toEqual([
            ["Unknown", 30, 0],
            ["Instagram", 17, 2],
            ["WhatsApp", 4, 3],
        ]);
        expect(sourcesSummary(rows)).toBe("WhatsApp brings the most enquiries: 3 of 5.");
        expect(sourcesSummary(sourcesTable([{ source: "t.co", _count: 3 }, { source: "direct", _count: 1 }], [], []))).toBe("Most visits you can trace come from X (Twitter): 75% of all of them.");
        expect(sourcesSummary([])).toBeNull();
    });

    it("names where a visit came from, and spots in-app browsers that send no address", async () => {
        const { placeOf, appOf } = await import("@/lib/analytics/sources");
        expect(placeOf("lm.facebook.com").name).toBe("Facebook");
        expect(placeOf("google.co.in").name).toBe("Google");
        expect(placeOf("qr").name).toBe("QR code");
        expect(placeOf("someblog.net").name).toBe("someblog.net");
        expect(appOf("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile/15E148 Instagram 350.0.0.30.97")).toBe("instagram.com");
        expect(appOf("Mozilla/5.0 (iPhone) Mobile/15E148 Barcelona 289.0.0.77 Instagram")).toBe("threads.net");
        expect(appOf("Mozilla/5.0 (Linux; Android 14) [FB_IAB/FB4A;FBAV/470.0]")).toBe("facebook.com");
        expect(appOf("Mozilla/5.0 (iPhone) Version/18.0 Mobile/15E148 Safari/604.1")).toBeUndefined();
    });

    it("takes a date for a service enquiry, or none", async () => {
        const { enquirySchema } = await import("@/lib/validations/enquiry");
        const base = { pageId: 1, blockId: "s", serviceId: "s1", name: "Ada", email: "ada@x.com", message: "Hello" };
        expect(enquirySchema.parse({ ...base, wantedOn: "2026-12-05" }).wantedOn).toBe("2026-12-05");
        expect(enquirySchema.parse(base).wantedOn).toBe("");
        expect(enquirySchema.safeParse({ ...base, wantedOn: "next tuesday" }).success).toBe(false);
    });

    it("starts a services block with examples to edit", () => {
        const block = newBlock("services");
        expect(block.type === "services" && block.items.length).toBe(2);
    });
});

describe("growing the business", () => {
    it("records the first reply once, however the enquiry moves after", async () => {
        const { repliedAtFor } = await import("@/lib/bookings");
        const first = new Date("2026-11-01T10:00:00Z");
        expect(repliedAtFor("NEW", null)).toBeNull();
        expect(repliedAtFor("REPLIED", null, first)).toBe(first);
        expect(repliedAtFor("BOOKED", first, new Date("2026-11-09"))).toBe(first);
    });

    it("averages reply time over answered enquiries only", async () => {
        const { averageReplyHours } = await import("@/lib/bookings");
        const at = (hour: number) => new Date(Date.UTC(2026, 10, 1, hour));
        expect(averageReplyHours([{ createdAt: at(0), repliedAt: at(2) }, { createdAt: at(0), repliedAt: at(6) }, { createdAt: at(0), repliedAt: null }])).toBe(4);
        expect(averageReplyHours([{ createdAt: at(0), repliedAt: null }])).toBeNull();
    });

    it("works out how each service sells", async () => {
        const { serviceStats } = await import("@/lib/bookings");
        const rows = serviceStats([
            { service: "Portraits", status: "PAID", amount: 300 },
            { service: "Portraits", status: "BOOKED", amount: 500 },
            { service: "Portraits", status: "CLOSED", amount: null },
            { service: "Weddings", status: "NEW", amount: null },
            // the contact form has no service: not part of this table
            { service: null, status: "PAID", amount: 900 },
        ]);
        expect(rows).toEqual([
            { service: "Portraits", enquiries: 3, won: 2, value: 800, rate: 2 / 3, averageValue: 400 },
            { service: "Weddings", enquiries: 1, won: 0, value: 0, rate: 0, averageValue: null },
        ]);
    });

    it("tells a payment page from a UPI id, and refuses anything else", async () => {
        const { paymentTarget } = await import("@/lib/pages/links");
        expect(paymentTarget("https://buy.stripe.com/abc")).toEqual({ kind: "url", href: "https://buy.stripe.com/abc" });
        expect(paymentTarget("lena@okhdfcbank")).toEqual({ kind: "upi", id: "lena@okhdfcbank" });
        // an email address isn't a UPI id
        expect(paymentTarget("lena@gmail.com")).toBeUndefined();
        expect(paymentTarget("http://insecure.example")).toBeUndefined();
        expect(paymentTarget("javascript:alert(1)")).toBeUndefined();
    });

    it("writes the Monday email, and skips quiet weeks", async () => {
        const { hasNews, weeklyEmailText } = await import("@/lib/reports/weekly");
        const week = {
            name: "Lena",
            currency: "INR",
            visitors: 400,
            enquiries: 8,
            booked: 2,
            bookedValue: 33000,
            topSource: "instagram.com",
            topService: { service: "Brand shoot", enquiries: 5 },
            replyHours: 30,
            awaitingPayment: 8000,
            openEnquiries: 3,
            month: { booked: 50000, goal: 100000 },
        };
        const text = weeklyEmailText(week, { analytics: "A", inbox: "I", settings: "S" });
        expect(text).toContain("8 enquiries (2% of visitors)");
        expect(text).toContain("2 booked, worth ₹33,000");
        expect(text).toContain("Brand shoot was asked about most (5 times)");
        expect(text).toContain("Replying within a day wins");
        expect(text).toContain("₹50,000 of your ₹1,00,000 goal (50%)");
        expect(text).toContain("₹8,000 is booked but not paid yet");
        expect(hasNews({ ...week, visitors: 0, enquiries: 0, openEnquiries: 0 })).toBe(false);
    });

    it("says times and shares the way people would", async () => {
        const { formatHours, shareOf } = await import("@/lib/utils/format");
        expect(formatHours(1 / 60)).toBe("1 minute");
        expect(formatHours(0.5)).toBe("30 minutes");
        expect(formatHours(1)).toBe("1 hour");
        expect(formatHours(72)).toBe("3 days");
        expect(shareOf(2, 8)).toBe("25%");
        // more enquiries than counted visitors happens; a share over 100% means nothing
        expect(shareOf(3, 1)).toBeNull();
        expect(shareOf(1, 0)).toBeNull();
    });

    it("only takes 1 to 5 stars", async () => {
        const { reviewSchema } = await import("@/lib/validations/enquiry");
        const review = { token: "t", name: "Arjun", rating: 5, text: "Wonderful to work with." };
        expect(reviewSchema.safeParse(review).success).toBe(true);
        expect(reviewSchema.safeParse({ ...review, rating: 0 }).success).toBe(false);
        expect(reviewSchema.safeParse({ ...review, rating: 6 }).success).toBe(false);
    });
});

describe("onboarding", () => {
    it("gives each craft a valid page that starts with its work and a way to hire them", async () => {
        const { CRAFTS, starterFor } = await import("@/lib/pages/starters");
        for (const craft of Object.keys(CRAFTS) as (keyof typeof CRAFTS)[]) {
            const page = starterFor(craft, { name: "Lena", bio: "", template: CRAFTS[craft].looks[0], currency: "USD" });
            expect(pageSchema.safeParse(page).success).toBe(true);
            expect(page.blocks.some((block) => block.type === "contact")).toBe(true);
        }
        const photographer = starterFor("photographer", { name: "Lena", bio: "", template: "noir", currency: "INR" });
        expect(photographer.blocks.map((block) => block.type)).toEqual(["gallery", "services", "reviews", "contact", "link"]);
        expect(photographer.theme.template).toBe("noir");
    });

    it("only offers looks that exist", async () => {
        const { CRAFTS } = await import("@/lib/pages/starters");
        const ids = TEMPLATES.map((template) => template.id);
        for (const craft of Object.values(CRAFTS)) for (const look of craft.looks) expect(ids).toContain(look);
    });

    it("prices example services in the creator's currency, rounded to friendly numbers", async () => {
        const { examplePrice } = await import("@/lib/pages/starters");
        expect(examplePrice(300, "USD")).toBe("from $300");
        expect(examplePrice(300, "INR")).toBe("from ₹24,000");
        expect(examplePrice(2500, "INR")).toBe("from ₹2,00,000");
        expect(examplePrice(150, "GBP")).toBe("from £120");
    });

    it("guesses the currency from the time zone first, then the language", async () => {
        const { guessCurrency } = await import("@/lib/pages/starters");
        // plenty of people in India browse in US English
        expect(guessCurrency("Asia/Kolkata", "en-US")).toBe("INR");
        expect(guessCurrency("Europe/Berlin", "de-DE")).toBe("EUR");
        expect(guessCurrency("America/Toronto", "en-CA")).toBe("CAD");
        expect(guessCurrency("UTC", "en")).toBe("USD");
    });

    it("keeps the starter's empty pieces off the public page until they're filled in", async () => {
        const { starterFor } = await import("@/lib/pages/starters");
        const page = starterFor("photographer", { name: "Lena", bio: "", template: "noir", currency: "USD" });
        const { renderToStaticMarkup } = await import("react-dom/server");
        const { createElement } = await import("react");
        const { PageRenderer } = await import("@/components/PageRenderer");
        const html = renderToStaticMarkup(createElement(PageRenderer, { page, mode: "live", pageId: 1, username: "lena" }));
        expect(html).not.toContain("Add images to the gallery");
        expect(html).not.toContain("Instagram");
        expect(html).toContain("Portrait session");
    });
});

describe("messages the creator sends", () => {
    it("asks for a payment in the creator's own words, with how to pay", async () => {
        const { paymentMessage } = await import("@/lib/messages");
        const { subject, text } = paymentMessage({
            creator: "Kavya Thakur",
            client: "Aarav Mehta",
            amount: 30000,
            currency: "INR",
            service: "Brand campaign",
            note: "50% deposit to hold the date.",
            target: { kind: "upi", id: "kavya@okaxis" },
        });
        expect(subject).toBe("Payment for Brand campaign: ₹30,000");
        expect(text).toBe(
            "Hi Aarav,\n\nThank you for booking me for Brand campaign. Here are the details for the payment of ₹30,000:\n\n50% deposit to hold the date.\n\nPay by UPI to: kavya@okaxis\n(open any UPI app, choose \"Pay to UPI ID\" and enter it)\n\nThank you!\nKavya",
        );
    });

    it("writes Roselle's version in the third person, for when Roselle emails it", async () => {
        const { paymentMessage } = await import("@/lib/messages");
        const { text } = paymentMessage({ creator: "Kavya Thakur", client: "Aarav", amount: 100, currency: "USD", service: null, note: "", target: { kind: "url", href: "https://buy.stripe.com/x" } }, "roselle");
        expect(text).toContain("Kavya Thakur has asked for $100.");
        expect(text).toContain("Pay here: https://buy.stripe.com/x");
    });

    it("asks for a review with the one-time link", async () => {
        const { reviewMessage } = await import("@/lib/messages");
        const { text } = reviewMessage({ creator: "Kavya Thakur", client: "Meera Iyer", service: "Editorial shoot", link: "https://x/review/abc", days: 60 });
        expect(text).toContain("Hi Meera,");
        expect(text).toContain("Thank you for working with me on Editorial shoot!");
        expect(text).toContain("https://x/review/abc");
    });

    it("opens the client's WhatsApp chat only when the number has its country code", async () => {
        const { whatsappLink, emailLink } = await import("@/lib/messages");
        expect(whatsappLink("Hi there", "+91 98765 43210")).toBe("https://wa.me/919876543210?text=Hi%20there");
        // no country code: WhatsApp asks which chat, rather than guessing a wrong number
        expect(whatsappLink("Hi", "98765 43210")).toBe("https://wa.me/?text=Hi");
        expect(whatsappLink("Hi", null)).toBe("https://wa.me/?text=Hi");
        expect(emailLink("a@b.com", { subject: "Pay & go", text: "Line 1\nLine 2" })).toBe("mailto:a@b.com?subject=Pay%20%26%20go&body=Line%201%0ALine%202");
    });
});

function blockSchemaParse(raw: object) {
    return pageSchema.shape.blocks.element.parse(raw);
}
