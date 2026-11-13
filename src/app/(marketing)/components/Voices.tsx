"use client";

/* eslint-disable @next/next/no-img-element -- the portraits come from Unsplash, which next/image isn't set up for */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import { ProfileCard } from "./ProfileCard";
import type { Voice } from "./voiceData";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Three creators, one at a time, on a screen that holds still while you scroll through it.
// Each one's portrait wipes up over the last, their quote lights up word by word as you read
// down it, and the Roselle page they made swings in beside them, so every claim comes with its
// proof. On phones, or with reduced motion, the three simply stack.
export function Voices({ voices }: { voices: Voice[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
                const quotes = gsap.utils.toArray<HTMLElement>("[data-voice-quote]");
                const words = quotes.map((quote) => SplitText.create(quote.querySelector("blockquote"), { type: "words" }).words);
                const portraits = gsap.utils.toArray<HTMLElement>("[data-voice-portrait]");
                const cards = gsap.utils.toArray<HTMLElement>("[data-voice-card]");
                const bars = gsap.utils.toArray<HTMLElement>("[data-voice-bar]");
                const counter = ref.current!.querySelector("[data-voice-count]")!;

                // every voice gets one unit of the timeline: arrive, then read
                const story = gsap.timeline({
                    defaults: { ease: "power3.inOut" },
                    scrollTrigger: { trigger: ref.current, start: "top top", end: `+=${voices.length * 100}%`, pin: true, scrub: 0.7 },
                });

                voices.forEach((_, i) => {
                    const at = i;
                    if (i > 0) {
                        story
                            .to(quotes[i - 1], { autoAlpha: 0, y: -50, duration: 0.25 }, at)
                            .fromTo(quotes[i], { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.3 }, at + 0.1)
                            // the new portrait wipes up over the old one
                            .fromTo(portraits[i], { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35 }, at)
                            .fromTo(portraits[i].querySelector("img"), { scale: 1.25 }, { scale: 1, duration: 0.5 }, at)
                            .to(cards[i - 1], { autoAlpha: 0, x: 120, rotation: 14, duration: 0.25 }, at)
                            .fromTo(cards[i], { autoAlpha: 0, x: -80, y: 80, rotation: -16 }, { autoAlpha: 1, x: 0, y: 0, rotation: -5, duration: 0.35 }, at + 0.12)
                            .call(() => (counter.textContent = String(i + 1).padStart(2, "0")), [], at + 0.15);
                    }
                    // reading: the words light up from faint to full, the bar fills
                    story
                        .fromTo(words[i], { opacity: 0.18 }, { opacity: 1, stagger: 0.02, duration: 0.05, ease: "none" }, at + (i ? 0.35 : 0.05))
                        .fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: "none" }, at);
                });
                // going back up, the counter has to follow too
                story.eventCallback("onUpdate", () => {
                    counter.textContent = String(Math.min(voices.length, Math.floor(story.time() - 0.15) + 1) || 1).padStart(2, "0");
                });
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} aria-labelledby="voices-title" className="relative overflow-hidden bg-forest text-shell [--focus:var(--color-rose)]">
            {/* ---------- the pinned stage, desktop ---------- */}
            <div className="mx-auto hidden h-svh max-w-[1360px] grid-cols-12 items-center gap-6 px-10 motion-safe:lg:grid">
                {/* the portrait, with their page leaning on its edge */}
                <div className="relative col-span-5 h-[78svh]">
                    <div className="relative h-full overflow-hidden rounded-[2.5rem]">
                        {voices.map((voice, i) => (
                            <div key={voice.name} data-voice-portrait className="absolute inset-0" style={{ clipPath: i ? "inset(100% 0% 0% 0%)" : undefined }}>
                                <img src={voice.portrait} alt={voice.name} className="size-full object-cover" />
                            </div>
                        ))}
                        <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgb(11_77_44/0.55))]" />
                    </div>
                    {voices.map((voice, i) => (
                        <div key={voice.name} data-voice-card className={`absolute -right-24 bottom-[-4%] z-10 rotate-[-5deg] ${i ? "invisible" : ""}`}>
                            <ProfileCard page={voice.page} scale={{ phone: 0.4, desktop: 0.48 }} />
                        </div>
                    ))}
                </div>

                {/* the words */}
                <div className="relative col-span-6 col-start-7 flex h-[78svh] flex-col">
                    <div className="flex items-baseline justify-between">
                        <h2 id="voices-title" className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">
                            Kind words
                        </h2>
                        <p className="font-(family-name:--font-anton) text-2xl text-rose">
                            <span data-voice-count>01</span>
                            <span className="text-shell/40"> / {String(voices.length).padStart(2, "0")}</span>
                        </p>
                    </div>

                    <div className="relative mt-auto mb-auto">
                        {/* the big quote mark hangs above, out of the text's way */}
                        <span aria-hidden className="absolute -top-28 -left-3 font-(family-name:--font-anton) text-[12rem] leading-none text-pink">
                            &ldquo;
                        </span>
                        {voices.map((voice, i) => (
                            <figure key={voice.name} data-voice-quote className={`${i ? "invisible absolute inset-x-0 top-0" : "relative"}`}>
                                <blockquote className="font-display text-[clamp(2rem,3.1vw,3.4rem)] leading-[1.08] font-bold tracking-[-0.03em] text-balance">{voice.quote}</blockquote>
                                <figcaption className="mt-10 flex items-end justify-between gap-6">
                                    <span>
                                        <span className="block text-[19px] font-bold">{voice.name}</span>
                                        <span className="block text-[15px] text-shell/60">{voice.role}</span>
                                    </span>
                                    <span className="rounded-2xl bg-shell/10 px-5 py-3 text-right">
                                        <span className="block font-(family-name:--font-anton) text-3xl leading-none text-rose">{voice.stat.value}</span>
                                        <span className="mt-1 block text-[13px] text-shell/70">{voice.stat.label}</span>
                                    </span>
                                </figcaption>
                            </figure>
                        ))}
                    </div>

                    {/* one bar per voice, filling as you read */}
                    <div aria-hidden className="flex gap-2">
                        {voices.map((voice) => (
                            <span key={voice.name} className="h-1 flex-1 overflow-hidden rounded-full bg-shell/15">
                                <span data-voice-bar className="block h-full origin-left scale-x-0 rounded-full bg-rose" />
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ---------- the stack, phones and reduced motion ---------- */}
            <div className="mx-auto max-w-2xl px-5 py-28 motion-safe:lg:hidden">
                <p className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">Kind words</p>
                <ul className="mt-12 flex flex-col gap-20">
                    {voices.map((voice) => (
                        <li key={voice.name}>
                            <figure>
                                <img src={voice.portrait} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-[2rem] object-cover" />
                                <blockquote className="mt-8 font-display text-[clamp(1.6rem,6vw,2.4rem)] leading-[1.1] font-bold tracking-[-0.025em] text-balance">
                                    &ldquo;{voice.quote}&rdquo;
                                </blockquote>
                                <figcaption className="mt-6 flex items-end justify-between gap-4">
                                    <span>
                                        <span className="block font-bold">{voice.name}</span>
                                        <span className="block text-[14px] text-shell/60">{voice.role}</span>
                                    </span>
                                    <span className="text-right">
                                        <span className="block font-(family-name:--font-anton) text-2xl leading-none text-rose">{voice.stat.value}</span>
                                        <span className="block text-[12px] text-shell/70">{voice.stat.label}</span>
                                    </span>
                                </figcaption>
                            </figure>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
