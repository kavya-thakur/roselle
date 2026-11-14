import { DEMO_PAGES } from "@/lib/pages/demo";
import { SHOWCASE, TEMPLATES } from "@/lib/pages/theme";
import { Chapters } from "./components/Chapters";
import { Footer } from "./components/Footer";
import { Hero } from "./components/Hero";
import { Motion } from "./components/Motion";
import { Nav } from "./components/Nav";
import { Pricing } from "./components/Pricing";
import { TemplatesRail } from "./components/TemplatesRail";
import { Voices } from "./components/Voices";
import { VOICES } from "./components/voiceData";
import { EXTRA_PAGES } from "./components/people";
import type { PageDoc } from "@/lib/validations/page";
import { ZoomReveal } from "./components/ZoomReveal";
import { Blocks } from "./components/Blocks";
import { Makers } from "./components/Makers";
import { Share } from "./components/Share";
import { Faq } from "./components/Faq";

// The demo pages are built here on the server and handed down as plain data, so the zod schemas
// that check them stay out of the browser bundle
export default function LandingPage() {
    const [elena, mira, sasha] = DEMO_PAGES;
    const themeOf = (id: string) => TEMPLATES.find((template) => template.id === id)!.theme;

    const [noor, theo, ines] = VOICES.map((voice) => voice.page);
    const [amara, lucia, zoe, folake, hana, clara, daniel, kwame, marcus, leo] = EXTRA_PAGES;
    const dress = (page: PageDoc, id: string) => ({ ...page, theme: themeOf(id) });

    // The modern looks (a poster or a banner on top), each worn by a different creator, so no
    // face shows twice in the row. Butter is left out here only: its yellow is a creator's
    // choice, not the landing page's green and pink.
    const showcase = SHOWCASE.filter((template) => template.id !== "butter");
    const rail = [sasha, folake, amara, kwame, hana, clara, daniel, lucia, zoe, marcus, leo, theo, ines, noor];
    const looks = showcase.map((template, i) => ({ name: template.name, page: { ...rail[i % rail.length], theme: template.theme } }));

    // the zoom section's wall: fourteen different people round Mira, each in a different look
    const wall = [elena, sasha, noor, theo, ines, amara, lucia, zoe, folake, hana, clara, daniel, kwame, leo];
    const mosaic = wall.map((page, i) => ({ ...page, theme: showcase[(i * 3) % showcase.length].theme }));

    return (
        <Motion>
            <Nav />
            <main>
                {/* four creators, four looks: a dark poster, a cherry-red one, a pink one, pistachio */}
                <Hero profiles={[sasha, dress(clara, "cherry"), mira, dress(leo, "pistachio")]} />
                <ZoomReveal star={mira} pages={mosaic} />
                {/* chapter two: three people, three looks */}
                <Chapters page={elena} looks={[dress(hana, "velvet"), dress(zoe, "candy"), dress(marcus, "sweetheart")]} />
                <Blocks />
                {/* every trade worn by a different person in a different look */}
                <Makers
                    makers={[
                        { trade: "Florists", page: dress(amara, "picnic") },
                        { trade: "Singers", page: dress(clara, "velvet") },
                        { trade: "Pastry chefs", page: dress(leo, "candy") },
                        { trade: "Stylists", page: dress(folake, "tangerine") },
                        { trade: "Photographers", page: dress(daniel, "mocha") },
                        { trade: "Writers", page: dress(hana, "bloom") },
                        { trade: "Designers", page: dress(kwame, "sweetheart") },
                        { trade: "Makeup artists", page: dress(lucia, "blush") },
                    ]}
                />
                <TemplatesRail looks={looks} />
                <Share />
                <Voices voices={VOICES} />
                <Pricing />
                <Faq />
            </main>
            {/* pages people have "already claimed": four people not already in the hero */}
            <Footer pages={[dress(kwame, "starlight"), dress(lucia, "candy"), dress(daniel, "velvet"), dress(folake, "rosebud")]} />
        </Motion>
    );
}
