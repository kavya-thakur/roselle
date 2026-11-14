import { blockSchema, type PageDoc } from "@/lib/validations/page";
import { TEMPLATES } from "./theme";

// Three made-up creators. The landing page and the sign-in screen draw them with the real
// PageRenderer, so what people see there is exactly what the product makes.

const photo = (id: string, width = 800) => `https://images.unsplash.com/${id}?w=${width}&q=80&auto=format&fit=crop`;
const theme = (id: string) => TEMPLATES.find((template) => template.id === id)!.theme;
const blocks = (list: object[]) => list.map((block, i) => blockSchema.parse({ id: `demo${i}`, ...block }));

export const DEMO_PAGES: PageDoc[] = [
    {
        profile: {
            name: "Elena Costa",
            bio: "Event planner. Garden parties, long tables and very good weddings.",
            avatar: photo("photo-1654670857563-595e64324ef8", 900),
            cover: photo("photo-1722763018789-ce972b1bc0cf", 900),
            socials: [
                { platform: "instagram", url: "https://instagram.com" },
                { platform: "tiktok", url: "https://tiktok.com" },
                { platform: "email", url: "mailto:hello@example.com" },
            ],
        },
        seo: { title: "", description: "" },
        theme: theme("picnic"),
        blocks: blocks([
            { type: "link", title: "Plan your celebration", subtitle: "Weddings, birthdays, long lunches", url: "https://example.com", featured: true },
            { type: "link", title: "2027 wedding dates", subtitle: "Six Saturdays left", url: "https://example.com" },
            {
                type: "stats",
                items: [
                    { id: "s1", value: "120+", label: "weddings" },
                    { id: "s2", value: "9 yrs", label: "planning" },
                    { id: "s3", value: "4.9", label: "rating" },
                ],
            },
            { type: "heading", text: "Recent parties" },
            {
                type: "project",
                title: "Midsummer in the garden",
                description: "Sixty guests, one long table, sweets till midnight.",
                image: photo("photo-1523992038393-d5ab874a077e"),
                url: "https://example.com",
                tags: ["Party", "Summer"],
            },
            { type: "link", title: "Kind words from couples", url: "https://example.com" },
        ]),
    },
    {
        profile: {
            name: "Mira Okafor",
            bio: "Ceramicist & art director.\nStudio visits by appointment.",
            avatar: photo("photo-1581396770327-994e1345610c", 900),
            cover: photo("photo-1781150363981-546c399139df", 900),
            socials: [
                { platform: "instagram", url: "https://instagram.com" },
                { platform: "behance", url: "https://behance.net" },
                { platform: "website", url: "https://example.com" },
            ],
        },
        seo: { title: "", description: "" },
        theme: theme("rosebud"),
        blocks: blocks([
            { type: "heading", text: "The studio" },
            { type: "link", title: "Spring collection, now open", subtitle: "Cups, bowls and vases, made in March", url: "https://example.com", featured: true, code: "SPRING10" },
            { type: "link", title: "Commissions & wholesale", url: "https://example.com" },
            {
                type: "picks",
                title: "From the shelf",
                items: [
                    { id: "p1", title: "Blush glaze cup", label: "$42", image: photo("photo-1781150363961-6284b0a95933", 600), url: "https://example.com" },
                    { id: "p2", title: "The wave cup", label: "$48", image: photo("photo-1781150363981-546c399139df", 600), url: "https://example.com" },
                ],
            },
            { type: "text", text: "Every piece is thrown by hand in a small studio by the river. Shipping worldwide." },
        ]),
    },
    {
        profile: {
            name: "Sasha Lin",
            bio: "Songwriter. New record ‘Velvet Hours’ out everywhere.",
            avatar: photo("photo-1662893965003-31ae7064ae9a", 900),
            cover: photo("photo-1608789637632-ecb75e322555", 900),
            socials: [
                { platform: "spotify", url: "https://spotify.com" },
                { platform: "youtube", url: "https://youtube.com" },
                { platform: "instagram", url: "https://instagram.com" },
                { platform: "tiktok", url: "https://tiktok.com" },
            ],
        },
        seo: { title: "", description: "" },
        theme: theme("poster"),
        blocks: blocks([
            { type: "link", title: "Listen to Velvet Hours", subtitle: "The new record, out everywhere", url: "https://example.com", featured: true, thumbnail: photo("photo-1608789637632-ecb75e322555", 120) },
            { type: "link", title: "Tour dates, Europe 2026", subtitle: "Paris, Berlin, Lisbon and more", url: "https://example.com" },
            { type: "link", title: "Merch & vinyl", url: "https://example.com", code: "VELVET15" },
            {
                type: "stats",
                items: [
                    { id: "s1", value: "2.4M", label: "streams" },
                    { id: "s2", value: "18", label: "cities" },
                    { id: "s3", value: "3", label: "records" },
                ],
            },
            { type: "heading", text: "The record" },
            {
                type: "project",
                title: "Velvet Hours",
                description: "Ten songs written at night, recorded in one room. Out now on vinyl and everywhere you listen.",
                image: photo("photo-1608789637632-ecb75e322555", 900),
                url: "https://example.com",
                tags: ["Album", "2026"],
            },
        ]),
    },
];
