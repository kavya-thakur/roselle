import { ProfileCard } from "@/app/(marketing)/components/ProfileCard";
import { DEMO_PAGES } from "@/lib/pages/demo";
import { TEMPLATES } from "@/lib/pages/theme";

// Every template worn in turn by the demo creators. Butter's yellow is left out, as on the
// landing page: it's a creator's choice, not part of Roselle's green and pink.
const LOOKS = TEMPLATES.filter((template) => template.id !== "butter").map((template, i) => ({
    name: template.name,
    page: { ...DEMO_PAGES[i % DEMO_PAGES.length], theme: template.theme },
}));

// Three columns, five looks each
const COLUMNS = [LOOKS.slice(0, 5), LOOKS.slice(5, 10), LOOKS.slice(10, 15)];

// The sign-in panel: a tilted wall of real creator pages drifting past for ever, the middle column
// the other way. Each column is its list twice over, moved up by half its height per loop; the
// bottom padding matches the gap so that half is exactly one list, and the seam never shows.
export function AuthShowcase() {
    return (
        <aside aria-hidden className="relative m-3 hidden overflow-hidden rounded-[2.5rem] bg-forest lg:block">
            <div className="absolute -inset-x-10 -top-24 bottom-0 flex rotate-[-7deg] justify-center gap-5 [mask-image:linear-gradient(transparent,black_18%,black_70%,transparent_96%)]">
                {COLUMNS.map((column, i) => (
                    <div
                        key={i}
                        style={{ animationDuration: `${48 + i * 8}s` }}
                        className={`flex shrink-0 flex-col gap-5 pb-5 motion-safe:animate-drift ${i === 1 ? "-mt-44 [animation-direction:reverse]" : ""}`}
                    >
                        {[...column, ...column].map((look, j) => (
                            <ProfileCard key={j} page={look.page} scale={{ phone: 0.52, desktop: 0.52 }} className="shrink-0" />
                        ))}
                    </div>
                ))}
            </div>

            {/* the words sit on a wash of the panel's green, so the pages fade out behind them */}
            <div className="absolute inset-x-0 bottom-0 z-2 bg-linear-to-t from-forest via-forest/85 to-transparent px-12 pt-40 pb-12">
                <p className="max-w-lg font-display text-[3.6rem] leading-[0.95] text-white">
                    Everything you are, <span className="text-rose">one link.</span>
                </p>
                <p className="mt-4 text-[15px] font-medium text-white/70">{LOOKS.length} looks, a live editor and honest analytics. Free to start.</p>
            </div>
        </aside>
    );
}
