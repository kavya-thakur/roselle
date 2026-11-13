"use client";

/* eslint-disable @next/next/no-img-element -- the photographs come from Unsplash, which next/image isn't set up for */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";
import { IconCheck, IconLink, IconTrendingUp } from "@tabler/icons-react";

import type { PageDoc } from "@/lib/validations/page";
import { PageCard } from "./PageCard";
import { photo, PHOTOS } from "./photos";

gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

// What each chapter turns the whole section into as it reaches the middle of the screen:
// the background, the text, the accent words and the line running through it all
const MOODS = [
    { bg: "#fde3ee", ink: "#0b4d2c", accent: "#e0408f", line: "#e0408f" },
    { bg: "#0b4d2c", ink: "#fff7f5", accent: "#f6b5cf", line: "#f6b5cf" },
    { bg: "#e0408f", ink: "#ffffff", accent: "#0b4d2c", line: "#0b4d2c" },
];

const CARD = "rounded-2xl bg-paper text-ink shadow-[0_2px_6px_rgb(20_20_20/0.06),0_24px_48px_-20px_rgb(20_20_20/0.35)]";

// Three short chapters about using Roselle. The section changes colour as each one takes over,
// a fat line draws itself down through all three as you scroll, and the pieces of each picture
// move at their own speeds (data-speed) so they feel like they're floating at different depths.
export function Chapters({ page, looks }: { page: PageDoc; looks: PageDoc[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const section = ref.current!;
            // two lines: the wide one for two columns, the thin thread for phones and tablets
            const line = section.querySelectorAll("[data-line]");

            // the colour changes happen with or without reduced motion: they're a change of
            // state, just softened when motion is welcome
            const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
            const moodOf = (i: number) => {
                const mood = MOODS[i];
                gsap.to(section, { backgroundColor: mood.bg, color: mood.ink, "--accent": mood.accent, duration: still ? 0 : 0.8, ease: "power2.out", overwrite: "auto" });
                gsap.to(line, { stroke: mood.line, duration: still ? 0 : 0.8, overwrite: "auto" });
            };
            gsap.utils.toArray<HTMLElement>("[data-chapter]").forEach((chapter, i) => {
                ScrollTrigger.create({ trigger: chapter, start: "top 50%", end: "bottom 50%", onEnter: () => moodOf(i), onEnterBack: () => moodOf(i) });
            });

            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                // the line draws itself as far down the section as you've scrolled
                gsap.fromTo(line, { drawSVG: "0%" }, { drawSVG: "100%", ease: "none", scrollTrigger: { trigger: section, start: "top 60%", end: "bottom 80%", scrub: 0.5 } });

                // depth: each piece drifts up at its own speed while its chapter passes
                gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((piece) => {
                    gsap.fromTo(
                        piece,
                        { y: 120 * Number(piece.dataset.speed) },
                        { y: -120 * Number(piece.dataset.speed), ease: "none", scrollTrigger: { trigger: piece.closest("[data-chapter]"), start: "top bottom", end: "bottom top", scrub: true } },
                    );
                });

                // chapter two: three looks for one page, fanning out as you scroll
                gsap.utils.toArray<HTMLElement>("[data-fan]").forEach((card, i) => {
                    gsap.fromTo(
                        card,
                        { rotation: 0, x: 0 },
                        // on a phone the fan opens less, so the outer pages stay mostly on screen
                        { rotation: (i - 1) * 9, x: () => (i - 1) * Math.min(140, window.innerWidth * 0.2), ease: "power2.out", invalidateOnRefresh: true, scrollTrigger: { trigger: card.closest("[data-chapter]"), start: "top 70%", end: "center 50%", scrub: 0.6 } },
                    );
                });

                // chapter three: the numbers count up and the chart draws itself
                gsap.utils.toArray<HTMLElement>("[data-count]").forEach((number) => {
                    const target = Number(number.dataset.count);
                    const counter = { value: 0 };
                    gsap.to(counter, {
                        value: target,
                        duration: 2,
                        ease: "power3.out",
                        scrollTrigger: { trigger: number, start: "top 85%" },
                        onUpdate: () => (number.textContent = Math.round(counter.value).toLocaleString("en-US") + (number.dataset.suffix ?? "")),
                    });
                });
                gsap.fromTo("[data-chart]", { drawSVG: "0%" }, { drawSVG: "100%", duration: 2, ease: "power2.inOut", scrollTrigger: { trigger: "[data-chart]", start: "top 85%" } });
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} id="features" aria-label="How Roselle works" className="relative overflow-hidden [--accent:#e0408f]" style={{ backgroundColor: MOODS[0].bg, color: MOODS[0].ink }}>
            {/* the fat line, behind everything. Its box is drawn at laptop proportions (two columns), so it
                only shows from there up. It runs behind the pictures on the right and only crosses to the
                left in the gaps between chapters (each chapter is 900 of these 2700 units tall), never
                through the words */}
            <svg aria-hidden viewBox="0 0 1440 2700" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 hidden size-full lg:block">
                <path
                    data-line
                    d="M1520 40 C 1200 160, 1000 380, 1120 640 C 1200 820, 600 760, 300 860 C 40 950, 200 1110, 760 1120 C 1250 1130, 1250 1400, 1120 1540 C 1000 1680, 600 1660, 300 1760 C 40 1850, 200 2010, 760 2020 C 1250 2030, 1200 2400, 1520 2650"
                    fill="none"
                    stroke={MOODS[0].line}
                    strokeWidth="46"
                    strokeLinecap="round"
                />
            </svg>

            {/* phones and tablets: one column, so the line becomes a thread weaving down the right-hand
                margin instead, drawn the same way as you scroll */}
            <svg aria-hidden viewBox="0 0 100 2700" preserveAspectRatio="none" className="pointer-events-none absolute inset-y-0 right-1 h-full w-4 lg:hidden">
                <path
                    data-line
                    d="M50 0 C 95 150, 5 300, 50 450 S 95 750, 50 900 S 5 1200, 50 1350 S 95 1650, 50 1800 S 5 2100, 50 2250 S 95 2550, 50 2700"
                    fill="none"
                    stroke={MOODS[0].line}
                    strokeWidth="7"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>

            {/* ---------- 01: adding ---------- */}
            <Chapter number="01" title={["Paste a link.", "That's it."]} body="Drop in any address and Roselle names it, styles it and puts it on your page. Headings, photos, galleries, video and projects work the same way.">
                <div className="relative mx-auto h-[560px] w-full max-w-[520px]">
                    <div data-speed="0.5" className="absolute top-0 left-[18%] w-[min(300px,62%)] rotate-[-4deg]">
                        <PageCard page={page} className="h-[520px]" />
                    </div>
                    <img data-speed="1.2" src={photo(PHOTOS.elena.id, 400)} alt="" className="absolute top-[6%] -left-2 w-[30%] rotate-[-8deg] rounded-3xl shadow-lifted" />
                    <img data-speed="0.9" src={photo(PHOTOS.desk.id, 400)} alt="" className="absolute right-0 bottom-[4%] w-[34%] rotate-[6deg] rounded-3xl shadow-lifted" />
                    <div data-speed="1.6" className={`${CARD} absolute right-[-2%] top-[22%] flex items-center gap-3 p-3 pr-5`}>
                        <span className="grid size-10 place-items-center rounded-xl bg-blush text-pink">
                            <IconLink size={19} />
                        </span>
                        <span className="text-[14px] leading-tight">
                            <span className="block font-bold">instagram.com/elena</span>
                            <span className="mt-0.5 flex items-center gap-1 text-[13px] text-success">
                                <IconCheck size={14} /> Added as &ldquo;Instagram&rdquo;
                            </span>
                        </span>
                    </div>
                </div>
            </Chapter>

            {/* ---------- 02: making it yours ---------- */}
            <Chapter number="02" title={["Looks like you,", "not a template."]} body="Start from a look that's already finished, then change anything: colours, fonts, buttons, a photo behind it all. One page, a new mood in a tap.">
                <div className="relative mx-auto flex h-[560px] w-full max-w-[560px] items-center justify-center">
                    {looks.slice(0, 3).map((look, i) => (
                        <div key={i} data-fan className="absolute w-[min(260px,48%)] origin-bottom" style={{ zIndex: i === 1 ? 3 : 1 }}>
                            <PageCard page={look} className="h-[480px]" />
                        </div>
                    ))}
                    <img data-speed="1.4" src={photo(PHOTOS.chair.id, 400)} alt="" className="absolute -top-4 right-[2%] z-10 w-[26%] rotate-[7deg] rounded-3xl shadow-lifted" />
                </div>
            </Chapter>

            {/* ---------- 03: seeing what works ---------- */}
            <Chapter number="03" title={["See what", "people tap."]} body="Views, visitors and clicks for every link, with where people came from. Honest numbers, no tracking that follows anyone around.">
                <div className="relative mx-auto h-[560px] w-full max-w-[520px]">
                    <img data-speed="0.6" src={photo(PHOTOS.sasha.id, 600)} alt="" className="absolute top-[4%] left-[8%] w-[56%] rotate-[-5deg] rounded-[2rem] shadow-lifted" />
                    <div data-speed="1.3" className={`${CARD} absolute top-[10%] right-0 w-[58%] p-5`}>
                        <p className="text-[13px] font-semibold text-ink/55">Page views, this month</p>
                        <p data-count="12480" className="mt-1 font-(family-name:--font-anton) text-5xl text-forest">
                            12,480
                        </p>
                        <svg viewBox="0 0 240 70" className="mt-3 w-full">
                            <path data-chart d="M2 62 C 30 58, 44 40, 70 46 S 110 22, 140 30 S 190 6, 238 10" fill="none" stroke="#e0408f" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div data-speed="1.8" className={`${CARD} absolute right-[12%] bottom-[10%] flex items-center gap-3 p-4 pr-6`}>
                        <span className="grid size-11 place-items-center rounded-xl bg-forest text-rose">
                            <IconTrendingUp size={22} />
                        </span>
                        <span>
                            <span data-count="34" data-suffix="%" className="block font-(family-name:--font-anton) text-3xl leading-none text-forest">
                                34%
                            </span>
                            <span className="text-[13px] text-ink/60">of visitors tap a link</span>
                        </span>
                    </div>
                </div>
            </Chapter>
        </section>
    );
}

function Chapter({ number, title, body, children }: { number: string; title: [string, string]; body: string; children: React.ReactNode }) {
    return (
        <div data-chapter className="relative mx-auto grid min-h-svh max-w-[1360px] items-center gap-16 px-5 py-28 lg:grid-cols-2 lg:gap-10 lg:px-10">
            <div className="relative z-10">
                <p className="font-(family-name:--font-anton) text-2xl text-(--accent)">{number}</p>
                <h2 data-heading className="mt-4 font-(family-name:--font-anton) text-[clamp(3.4rem,7vw,7rem)] leading-[0.88] uppercase">
                    <span className="block">{title[0]}</span>
                    <span className="block text-(--accent)">{title[1]}</span>
                </h2>
                <p data-rise className="mt-7 max-w-md text-[18px] leading-relaxed opacity-80">
                    {body}
                </p>
            </div>
            <div className="relative z-10">{children}</div>
        </div>
    );
}
