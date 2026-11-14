import { blockSchema, type PageDoc, type Social } from "@/lib/validations/page";
import { TEMPLATES } from "@/lib/pages/theme";
import { photo } from "./photos";

// More made-up creators for the landing page, so no face has to appear twice in one section.
// Each has their own portrait and their own cover picture (for banner looks), and wears whatever
// look the section gives them. Read on the server only (page.tsx).

interface Person {
    name: string;
    bio: string;
    portrait: string;
    cover: string;
    socials: Social[];
    links: string[];
    // the picture on their first link, shown big as a photo card
    feature?: string;
}

const PEOPLE: Person[] = [
    {
        name: "Amara Osei",
        bio: "Florist. Wedding flowers and slow Sunday bunches.",
        portrait: "photo-1673623250951-68692d52d841",
        cover: "photo-1518895949257-7621c3c786d7",
        socials: ["instagram", "website"],
        links: ["Order a Sunday bunch", "Weddings & events", "Flower school"],
        feature: "photo-1519741497674-611481863552",
    },
    {
        name: "Lucía Romero",
        bio: "Makeup artist for editorials, brides and very good parties.",
        portrait: "photo-1618510050510-d0903984e131",
        cover: "photo-1622937309508-db3273465d8b",
        socials: ["instagram", "tiktok"],
        links: ["Book a bridal trial", "My kit, every product", "Masterclass dates"],
        feature: "photo-1596462502278-27bfdc403348",
    },
    {
        name: "Zoë Laurent",
        bio: "Textile designer. Scarves and cushions, printed by hand.",
        portrait: "photo-1720546550351-3b8014632680",
        cover: "photo-1562048048-86d659689440",
        socials: ["instagram", "website"],
        links: ["Shop the summer prints", "Studio open days", "Wholesale"],
        feature: "photo-1434389677669-e08b4cac3105",
    },
    {
        name: "Folake Adeyemi",
        bio: "Stylist. Colour, pattern and confidence, by appointment.",
        portrait: "photo-1785698853254-4cba47b0e2ee",
        cover: "photo-1547961547-321889bff29e",
        socials: ["instagram", "youtube"],
        links: ["Book a wardrobe edit", "This season's lookbook", "Styling tips on YouTube"],
        feature: "photo-1539109136881-3be0616acf4b",
    },
    {
        name: "Hana Mori",
        bio: "Writer and zine maker. Small books about big feelings.",
        portrait: "photo-1551808290-73c0fba381ce",
        cover: "photo-1562232573-0305012a8818",
        socials: ["threads", "instagram"],
        links: ["Read the newsletter", "Zines, issue 07", "Workshops"],
    },
    {
        name: "Clara Vance",
        bio: "Singer. New single 'Telephone' out Friday.",
        portrait: "photo-1772506696157-83221af8da38",
        cover: "photo-1544220828-842b050ef390",
        socials: ["spotify", "instagram"],
        links: ["Pre-save 'Telephone'", "Tour dates", "Vinyl & merch"],
        feature: "photo-1505236858219-8359eb29e329",
    },
    {
        name: "Daniel Brandt",
        bio: "Photographer. Mountains, people, and the light in between.",
        portrait: "photo-1726159825376-9cfb6d550ed6",
        cover: "photo-1551085429-91a8422c72ae",
        socials: ["instagram", "website"],
        links: ["Portfolio", "Print shop", "Book a shoot"],
        feature: "photo-1426604966848-d7adac402bff",
    },
    {
        name: "Kwame Mensah",
        bio: "Fashion designer. Soft tailoring in loud colours.",
        portrait: "photo-1776880470350-8f1f22a1462a",
        cover: "photo-1557033051-1d426c3a4d42",
        socials: ["instagram", "tiktok"],
        links: ["Shop the new collection", "Made to measure", "Runway film"],
        feature: "photo-1515886657613-9f3515b0c78f",
    },
    {
        name: "Marcus Hale",
        bio: "Tailor. Suits that fit like they were always yours.",
        portrait: "photo-1761726131624-26935c1bf915",
        cover: "photo-1727976971119-3cfb3cb88eeb",
        socials: ["instagram", "website"],
        links: ["Book a fitting", "The lookbook", "Visit the shop"],
        feature: "photo-1441986300917-64674bd600d8",
    },
    {
        name: "Leo Ramos",
        bio: "Pastry chef. Doughnuts on Saturdays until they're gone.",
        portrait: "photo-1760050516416-5013f983b941",
        cover: "photo-1533910534207-90f31029a78e",
        socials: ["instagram", "tiktok"],
        links: ["Pre-order Saturday's box", "This week's flavours", "Cake commissions"],
    },
];

const STARTER = TEMPLATES[0].theme;

// 600px wide: these pages only ever show as small cards, where that's sharp on a retina screen
export const EXTRA_PAGES: PageDoc[] = PEOPLE.map((person, p) => ({
    profile: {
        name: person.name,
        bio: person.bio,
        avatar: photo(person.portrait, 600),
        cover: photo(person.cover, 600),
        socials: person.socials.map((platform) => ({ platform, url: platform === "email" ? "mailto:hello@example.com" : "https://example.com" })),
    },
    seo: { title: "", description: "" },
    // every section dresses them in its own look; this is only so the page is complete on its own
    theme: STARTER,
    blocks: person.links.map((title, i) =>
        blockSchema.parse({ id: `p${p}-${i}`, type: "link", title, url: "https://example.com", featured: i === 0, thumbnail: i === 0 && person.feature ? photo(person.feature, 600) : "" }),
    ),
}));
