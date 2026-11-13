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
// trade, each in a different look. On phones it's simply a word above each page.
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
        },
        { scope: ref },
    );

    return (
        <section ref={ref} aria-labelledby="makers-title" className="relative bg-forest text-shell [--focus:var(--color-rose)]">
            <div className="mx-auto max-w-[1360px] px-5 py-28 lg:grid lg:grid-cols-12 lg:gap-6 lg:px-10 lg:py-0">
                {/* ---------- the trades ---------- */}
                <div className="lg:col-span-7 lg:py-[40svh]">
                    <h2 id="makers-title" className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase lg:mb-10">
                        Made for every maker
                    </h2>
                    <ul className="mt-10 flex flex-col gap-16 lg:mt-0 lg:gap-2">
                        {makers.map((maker) => (
                            <li key={maker.trade}>
                                <p data-trade className="font-(family-name:--font-anton) text-[clamp(3rem,8vw,8.5rem)] leading-[0.95] uppercase lg:text-shell/20">
                                    {maker.trade}
                                </p>
                                {/* phones: the page right under its word */}
                                <div className="mt-6 lg:hidden">
                                    <ProfileCard page={maker.page} scale={{ phone: 0.62, desktop: 0.62 }} />
                                </div>
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
