"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import type { PageDoc } from "@/lib/validations/page";
import { ProfileCard } from "./ProfileCard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export interface Maker {
    // the trade, set huge: "Florists"
    trade: string;
    page: PageDoc;
}

// "Made for every maker": the trades scroll up the left side as giant words, and whichever is in
// the middle of the screen lights up pink while the page on the right swaps to someone in that
// trade, each in a different look.
//
// Phones and tablets have no room for a column of words beside a page, so there the section holds
// still for a few screens of scrolling instead: one trade word at a time rolls up at the top, the
// deck of pages in the middle deals the next one in, and a counter keeps count underneath.
export function Makers({ makers }: { makers: Maker[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                const words = gsap.utils.toArray<HTMLElement>("[data-trade]");
                const cards = gsap.utils.toArray<HTMLElement>("[data-maker-card]");
                let current = 0;

                const show = (next: number) => {
                    if (next === current) return;
                    const leaving = cards[current];
                    const coming = cards[next];
                    const down = next > current;
                    gsap.to(leaving, { autoAlpha: 0, y: down ? -60 : 60, rotation: down ? -8 : 8, scale: 0.92, duration: 0.6, ease: "power3.in", overwrite: true });
                    gsap.fromTo(coming, { autoAlpha: 0, y: down ? 90 : -90, rotation: down ? 10 : -10, scale: 0.92 }, { autoAlpha: 1, y: 0, rotation: next % 2 ? 3 : -3, scale: 1, duration: 0.8, ease: "expo.out", overwrite: true });
                    current = next;
                };

                words.forEach((word, i) => {
                    // the word glows while it crosses the middle of the screen: one timeline per word
                    // (dim → pink → dim), so the two halves never fight over its colour
                    gsap.timeline({ scrollTrigger: { trigger: word, start: "top 66%", end: "top 26%", scrub: true } })
                        .fromTo(word, { color: "rgb(255 247 245 / 0.18)" }, { color: "#f6b5cf", ease: "none", duration: 1 })
                        .to(word, { color: "#f6b5cf", duration: 0.6 })
                        .to(word, { color: "rgb(255 247 245 / 0.18)", ease: "none", duration: 1 });
                    ScrollTrigger.create({ trigger: word, start: "top 55%", end: "bottom 55%", onEnter: () => show(i), onEnterBack: () => show(i) });
                });
            });

            mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
                const stage = ref.current!.querySelector<HTMLElement>("[data-deck-stage]")!;
                const words = gsap.utils.toArray<HTMLElement>("[data-deck-word]");
                const cards = gsap.utils.toArray<HTMLElement>("[data-deck-card]");
                const counter = stage.querySelector("[data-deck-count]")!;
                const steps = makers.length - 1;

                // one unit of the timeline per change of trade, scrubbed by the scroll
                // each change takes half its unit of scroll; the other half the new trade holds still
                const deal = gsap.timeline({
                    defaults: { ease: "power2.inOut", duration: 0.5 },
                    scrollTrigger: {
                        trigger: stage,
                        start: "top top",
                        end: () => `+=${steps * window.innerHeight * 0.6}`,
                        pin: true,
                        scrub: 0.5,
                        onUpdate: (self) => (counter.textContent = String(Math.round(self.progress * steps) + 1).padStart(2, "0")),
                    },
                });
                for (let i = 1; i <= steps; i++) {
                    const at = i - 1;
                    // y: 0 alongside yPercent, so the CSS start position (below the window) isn't added on top
                    deal.to(words[i - 1], { y: 0, yPercent: -110 }, at)
                        .fromTo(words[i], { y: 0, yPercent: 110 }, { y: 0, yPercent: 0 }, at)
                        // the page on top flies off to the side, the next one swings up into its place
                        .to(cards[i - 1], { xPercent: i % 2 ? -120 : 120, rotation: i % 2 ? -24 : 24, autoAlpha: 0 }, at)
                        .fromTo(cards[i], { yPercent: 40, rotation: i % 2 ? 10 : -10, scale: 0.88, autoAlpha: 0 }, { yPercent: 0, rotation: i % 2 ? 3 : -3, scale: 1, autoAlpha: 1 }, at + 0.06);
                }
                // and the last trade gets its moment too before the section lets go
                deal.to({}, { duration: 0.5 }, steps - 0.5);
                deal.fromTo("[data-deck-bar]", { scaleX: 1 / makers.length }, { scaleX: 1, ease: "none", duration: steps }, 0);
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} aria-labelledby="makers-title" className="relative bg-forest text-shell [--focus:var(--color-rose)]">
            {/* ---------- phones and tablets: the deck ---------- */}
            <div data-deck-stage className="relative flex h-svh flex-col items-center overflow-hidden px-5 pt-[9svh] pb-[5svh] lg:hidden motion-reduce:hidden">
                <p className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">Made for every maker</p>
                {/* one word at a time, rolling up through a window one line tall */}
                <div className="relative mt-3 h-[clamp(3.4rem,15vw,6rem)] w-full overflow-hidden text-center">
                    {makers.map((maker, i) => (
                        <p
                            key={maker.trade}
                            data-deck-word
                            className="absolute inset-0 font-(family-name:--font-anton) text-[clamp(3rem,13.5vw,5.6rem)] leading-[1.05] whitespace-nowrap text-rose uppercase"
                            style={{ transform: i ? "translateY(110%)" : undefined }}
                        >
                            {maker.trade}
                        </p>
                    ))}
                </div>

                {/* the deck: two blank pages behind for depth, the real ones dealt on top. The box is
                    exactly a card's size (a 375 × 780 page at 0.58, or 0.64 on tablets); on short
                    screens the whole deck shrinks a little so the counter stays in view */}
                <div className="relative mt-[3svh] flex min-h-0 flex-1 items-center justify-center [@media(max-height:760px)]:scale-[0.86] [@media(max-height:660px)]:scale-[0.74]">
                    <div className="relative h-[452px] w-[218px] md:h-[499px] md:w-[240px]">
                        <span className="absolute inset-0 translate-x-4 rotate-[8deg] rounded-[1.75rem] bg-shell/10" />
                        <span className="absolute inset-0 -translate-x-3 rotate-[-6deg] rounded-[1.75rem] bg-shell/15" />
                        {makers.map((maker, i) => (
                            <div key={maker.trade} data-deck-card className={`absolute inset-0 ${i ? "invisible" : ""}`} style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}>
                                <ProfileCard page={maker.page} scale={{ phone: 0.58, desktop: 0.64 }} flat />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-[3svh] flex w-full max-w-xs items-center gap-3 text-[13px] font-semibold text-shell/70">
                    <span className="font-(family-name:--font-anton) text-lg text-rose tabular-nums">
                        <span data-deck-count>01</span>
                        <span className="text-shell/40"> / {String(makers.length).padStart(2, "0")}</span>
                    </span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-shell/15">
                        <span data-deck-bar className="block h-full origin-left rounded-full bg-rose" style={{ transform: `scaleX(${1 / makers.length})` }} />
                    </span>
                </div>
            </div>

            {/* ---------- phones and tablets with reduced motion: a row to swipe ---------- */}
            <div className="hidden px-5 py-24 max-lg:motion-reduce:block">
                <p className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">Made for every maker</p>
                <ul className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4">
                    {makers.map((maker) => (
                        <li key={maker.trade} className="shrink-0 snap-center">
                            <p className="font-(family-name:--font-anton) text-4xl text-rose uppercase">{maker.trade}</p>
                            <div className="mt-3">
                                <ProfileCard page={maker.page} scale={{ phone: 0.6, desktop: 0.6 }} />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="mx-auto hidden max-w-[1360px] px-10 lg:grid lg:grid-cols-12 lg:gap-6">
                {/* ---------- the trades ---------- */}
                <div className="lg:col-span-7 lg:py-[40svh]">
                    <h2 id="makers-title" className="mb-10 text-[13px] font-bold tracking-[0.16em] text-rose uppercase">
                        Made for every maker
                    </h2>
                    <ul className="flex flex-col gap-2">
                        {makers.map((maker) => (
                            <li key={maker.trade}>
                                <p data-trade className="font-(family-name:--font-anton) text-[clamp(3rem,8vw,8.5rem)] leading-[0.95] text-shell/20 uppercase">
                                    {maker.trade}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ---------- the page, pinned on the right ---------- */}
                <div className="hidden lg:col-span-5 lg:block">
                    <div className="sticky top-0 flex h-svh items-center justify-center">
                        {/* exactly the card's size: a 375 × 780 page at 0.82 */}
                        <div className="relative h-[640px] w-[308px]">
                            {makers.map((maker, i) => (
                                <div
                                    key={maker.trade}
                                    data-maker-card
                                    className={`absolute inset-0 ${i ? "invisible" : ""}`}
                                    style={{ transform: `rotate(${i % 2 ? 3 : -3}deg)` }}
                                >
                                    <ProfileCard page={maker.page} scale={{ phone: 0.82, desktop: 0.82 }} />
                                    <p className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[14px] whitespace-nowrap text-shell/60">
                                        {maker.page.profile.name}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
