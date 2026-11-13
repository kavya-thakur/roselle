import { blockSchema, type PageDoc } from "@/lib/validations/page";
import { TEMPLATES } from "@/lib/pages/theme";
import { photo, PHOTOS } from "./photos";

// Made-up creators: Roselle has no customers to quote yet. Each one comes with the page they'd
// have made, in a different look, so their words sit next to the proof. Read on the server only
// (page.tsx), so the schema that builds the pages stays out of the browser.

export interface Voice {
    quote: string;
    name: string;
    role: string;
    // one number that says what changed for them
    stat: { value: string; label: string };
    portrait: string;
    page: PageDoc;
}

const theme = (id: string) => TEMPLATES.find((template) => template.id === id)!.theme;
const links = (titles: string[], featured = 0) => titles.map((title, i) => blockSchema.parse({ id: `v${i}`, type: "link", title, url: "https://example.com", featured: i === featured }));

function pageFor(name: string, bio: string, avatar: string, cover: string, template: string, titles: string[]): PageDoc {
    return {
        profile: { name, bio, avatar, cover, socials: [{ platform: "instagram", url: "https://instagram.com" }, { platform: "website", url: "https://example.com" }] },
        seo: { title: "", description: "" },
        theme: theme(template),
        blocks: links(titles),
    };
}

export const VOICES: Voice[] = [
    {
        quote: "I swapped three link tools for one page that finally looks like my studio. It took a lunch break.",
        name: "Noor Haddad",
        role: "Illustrator, Marseille",
        stat: { value: "3 → 1", label: "link tools replaced" },
        portrait: photo(PHOTOS.noor.id, 900),
        page: pageFor("Noor Haddad", "Illustrator. Prints, picture books and the odd mural.", photo(PHOTOS.noor.id, 900), photo(PHOTOS.cupHand.id, 900), "sweetheart", ["Shop the spring prints", "Commissions are open", "My sketchbook"]),
    },
    {
        quote: "The supper club sells out from my bio now. Scheduling the Friday booking link is the whole trick.",
        name: "Theo Marchetti",
        role: "Chef, supper club host",
        stat: { value: "6 Fridays", label: "sold out in a row" },
        portrait: photo(PHOTOS.theo.id, 900),
        page: pageFor("Theo Marchetti", "Twelve seats, one long table, whatever the market had.", photo(PHOTOS.theo.id, 900), photo("photo-1551499779-ee50f1aa4d25", 900), "poster", ["Book Friday's supper", "This week's menu", "The cookbook, pre-order"]),
    },
    {
        quote: "Finally a page I'm happy to send to galleries. It looks considered, and I didn't have to design a thing.",
        name: "Ines Duarte",
        role: "Photographer, Lisbon",
        stat: { value: "3 shows", label: "booked from her page" },
        portrait: photo(PHOTOS.ines.id, 900),
        page: pageFor("Ines Duarte", "Portraits in natural light. Prints and commissions.", photo(PHOTOS.ines.id, 900), photo(PHOTOS.piano.id, 900), "rosebud", ["Portfolio", "Book a portrait session", "Prints, small editions"]),
    },
];
