import { blockSchema, type Block, type PageDoc } from "@/lib/validations/page";
import type { CURRENCIES } from "@/lib/validations/enquiry";
import { formatMoney } from "@/lib/utils/format";
import { TEMPLATES } from "./theme";

type Currency = (typeof CURRENCIES)[number];

// What a new creator does: it decides what their first page is made of
export const CRAFTS = {
    photographer: { label: "Photographer", hint: "Weddings, portraits, brands, events", looks: ["noir", "poster", "studio", "bordeaux"] },
    designer: { label: "Designer", hint: "Brands, websites, products, type", looks: ["studio", "poster", "candy", "starlight"] },
    illustrator: { label: "Illustrator or artist", hint: "Commissions, editorial, prints", looks: ["picnic", "bloom", "sweetheart", "butter"] },
    other: { label: "Something else", hint: "Start simple and build from there", looks: ["forest", "rosebud", "velvet", "pop"] },
} as const;

export type Craft = keyof typeof CRAFTS;

// Roughly what one US dollar is in each currency, so example prices read naturally wherever the
// creator is. They're starting points to edit, rounded to friendly numbers, not quotes.
// ponytail: fixed rates; they only shape placeholder prices, so they never need updating
const PER_DOLLAR: Record<Currency, number> = { USD: 1, EUR: 1, GBP: 0.8, INR: 80, AUD: 1.5, CAD: 1.4, NZD: 1.7, SGD: 1.3, AED: 3.7, JPY: 150, CHF: 0.9, SEK: 10, BRL: 5, MXN: 18, ZAR: 18 };

// $300 -> "from ₹24,000": converted, then rounded to two significant figures
export function examplePrice(dollars: number, currency: Currency) {
    const amount = dollars * PER_DOLLAR[currency];
    const step = 10 ** Math.max(0, Math.floor(Math.log10(amount)) - 1);
    return `from ${formatMoney(Math.round(amount / step) * step, currency)}`;
}

const service = (id: string, name: string, dollars: number, description: string, currency: Currency) => ({ id, name, price: examplePrice(dollars, currency), description });

// The blocks each craft starts with: their work first, then what they offer, what clients said,
// and how to get in touch. Anything still empty (a gallery with no photos, a link with no address)
// is hidden from visitors until it's filled in, so publishing early never shows a placeholder.
function blocksFor(craft: Craft, currency: Currency): object[] {
    const reviews = { id: "reviews", type: "reviews", title: "Kind words" };
    const contact = (text: string) => ({ id: "contact", type: "contact", title: "Work with me", text, button: "Send message" });

    switch (craft) {
        case "photographer":
            return [
                { id: "work", type: "gallery", title: "Selected work", layout: "masonry" },
                {
                    id: "services",
                    type: "services",
                    title: "Services",
                    items: [
                        service("portraits", "Portrait session", 300, "One hour, one location, 20 edited photos.", currency),
                        service("brand", "Brand shoot", 900, "Half a day with your products, team and space. 60 edited photos.", currency),
                        service("wedding", "Wedding", 2500, "The whole day, from getting ready to the last dance, and a printed album.", currency),
                    ],
                },
                reviews,
                contact("Tell me about your day or your project, and when it is. I reply within a day."),
                { id: "instagram", type: "link", title: "Instagram", url: "", icon: "instagram" },
            ];
        case "designer":
            return [
                { id: "project", type: "project", title: "Your best project", description: "One line on the brief and the result. Add the story and pictures to give it a page of its own." },
                {
                    id: "services",
                    type: "services",
                    title: "Services",
                    items: [
                        service("identity", "Brand identity", 2000, "Logo, colours, type, and a short guide to using them.", currency),
                        service("website", "Website design", 3000, "A site that looks like you and is easy to keep up to date.", currency),
                        service("support", "Design day", 500, "A day of design for whatever you need, booked ahead.", currency),
                    ],
                },
                reviews,
                contact("Have a project in mind? Tell me about it and your timeline."),
                { id: "behance", type: "link", title: "Behance", url: "", icon: "behance" },
            ];
        case "illustrator":
            return [
                { id: "work", type: "gallery", title: "Recent work", layout: "grid" },
                {
                    id: "services",
                    type: "services",
                    title: "Commissions",
                    items: [
                        service("personal", "Personal commission", 150, "A one-off illustration for you, or as a gift.", currency),
                        service("editorial", "Editorial illustration", 400, "For magazines, books and brands, with the licence included.", currency),
                    ],
                },
                reviews,
                contact("Commissions and collaborations are open. Tell me what you have in mind."),
                { id: "tips", type: "tip", title: "Support my work", provider: "kofi", handle: "" },
                { id: "instagram", type: "link", title: "Instagram", url: "", icon: "instagram" },
            ];
        case "other":
            return [contact("Get in touch, I'd love to hear from you."), { id: "link", type: "link", title: "My first link", url: "" }, reviews];
    }
}

// A new creator's page from their onboarding answers
export function starterFor(craft: Craft, { name, bio, template, currency }: { name: string; bio: string; template: string; currency: Currency }): PageDoc {
    const look = TEMPLATES.find((candidate) => candidate.id === template) ?? TEMPLATES.find((candidate) => candidate.id === CRAFTS[craft].looks[0])!;
    return {
        profile: { name, bio, avatar: "", cover: "", socials: [] },
        seo: { title: "", description: "" },
        theme: look.theme,
        blocks: blocksFor(craft, currency).map((block) => blockSchema.parse(block) as Block),
    };
}

// A first guess at the creator's currency, for the onboarding form to start on. The time zone
// says more than the language (many people in India browse in US English), so it's asked first.
const ZONES: Record<string, Currency> = { "Asia/Kolkata": "INR", "Asia/Calcutta": "INR", "Europe/London": "GBP", "Asia/Dubai": "AED", "Asia/Singapore": "SGD", "Asia/Tokyo": "JPY", "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD", "Pacific/Auckland": "NZD" };
const REGIONS: Record<string, Currency> = { IN: "INR", GB: "GBP", US: "USD", AU: "AUD", CA: "CAD", NZ: "NZD", SG: "SGD", AE: "AED", JP: "JPY", CH: "CHF", SE: "SEK", BR: "BRL", MX: "MXN", ZA: "ZAR" };
const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK"];

export function guessCurrency(timeZone: string, locale: string): Currency {
    if (ZONES[timeZone]) return ZONES[timeZone];
    const region = locale.split("-")[1]?.toUpperCase() ?? "";
    if (EURO.includes(region)) return "EUR";
    return REGIONS[region] ?? "USD";
}
