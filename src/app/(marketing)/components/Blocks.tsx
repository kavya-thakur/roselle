"use client";

/* eslint-disable @next/next/no-img-element -- the photographs come from Unsplash, which next/image isn't set up for */
import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconBrandSpotify, IconCalendarEvent, IconCoffee, IconMapPin, IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";

import { photo, PHOTOS } from "./photos";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Facts about the product, not made-up usage numbers
const FACTS = [
    { value: 60, suffix: "s", label: "from sign-up to a live page" },
    { value: 10, suffix: "", label: "kinds of block" },
    { value: 8, suffix: "", label: "printed patterns" },
    { value: 0, suffix: "", label: "trackers following your visitors" },
];

// "More than links": the kinds of block a page can hold, each drawn as a little piece of a real
// page doing its thing: the record playing, the pin dropping on the map, the tip landing. The
// tiles rise in one after another, the facts above count up.
export function Blocks() {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                gsap.from("[data-tile]", {
                    y: 70,
                    autoAlpha: 0,
                    rotation: (i) => (i % 2 ? 2 : -2),
                    duration: 1.1,
                    ease: "expo.out",
                    stagger: 0.08,
                    scrollTrigger: { trigger: "[data-tiles]", start: "top 80%" },
                });

                gsap.utils.toArray<HTMLElement>("[data-fact]").forEach((fact) => {
                    const counter = { value: 0 };
                    const target = Number(fact.dataset.fact);
                    gsap.to(counter, {
                        value: target,
                        duration: 1.8,
                        ease: "power3.out",
                        scrollTrigger: { trigger: fact, start: "top 90%" },
                        onUpdate: () => (fact.textContent = String(Math.round(counter.value)) + (fact.dataset.suffix ?? "")),
                    });
                });

                // the pin drops onto the map, the coin onto the tip button, once each
                gsap.from("[data-pin]", { y: -60, autoAlpha: 0, duration: 1, ease: "bounce.out", scrollTrigger: { trigger: "[data-pin]", start: "top 85%" } });
                gsap.from("[data-coin]", { y: -50, rotation: -200, autoAlpha: 0, duration: 1.1, ease: "back.out(2)", scrollTrigger: { trigger: "[data-coin]", start: "top 85%" } });
                // the scheduled link switches itself on
                gsap.fromTo("[data-switch]", { x: 0 }, { x: 20, duration: 0.5, ease: "power2.inOut", delay: 0.6, scrollTrigger: { trigger: "[data-switch]", start: "top 85%" } });
                gsap.fromTo("[data-switch-track]", { backgroundColor: "#d1d1cb" }, { backgroundColor: "#0b4d2c", duration: 0.5, delay: 0.6, scrollTrigger: { trigger: "[data-switch]", start: "top 85%" } });
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} id="blocks" aria-labelledby="blocks-title" className="bg-shell py-28 text-forest lg:py-40">
            <div className="mx-auto max-w-[1360px] px-5 lg:px-10">
                <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
                    <h2 id="blocks-title" data-heading className="font-(family-name:--font-anton) text-[clamp(3.4rem,7vw,7rem)] leading-[0.88] uppercase lg:col-span-7">
                        More than
                        <span className="block text-pink">a list of links.</span>
                    </h2>
                    <p data-rise className="max-w-md text-[18px] leading-relaxed text-ink/65 lg:col-span-4 lg:col-start-9 lg:pb-3">
                        Play your record, show where to find you, take a tip, schedule the drop. Every block is one tap to add.
                    </p>
                </div>

                <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-y border-forest/15 py-10 lg:grid-cols-4">
                    {FACTS.map((fact) => (
                        <div key={fact.label}>
                            <dt className="sr-only">{fact.label}</dt>
                            <dd>
                                <span data-fact={fact.value} data-suffix={fact.suffix} className="block font-(family-name:--font-anton) text-6xl leading-none text-forest">
                                    {fact.value}
                                    {fact.suffix}
                                </span>
                                <span className="mt-2 block text-[15px] text-ink/60">{fact.label}</span>
                            </dd>
                        </div>
                    ))}
                </dl>

                {/* a bento of tiles: two big ones, four small */}
                <div data-tiles className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:grid-rows-[repeat(2,minmax(300px,auto))]">
                    {/* music: a record playing */}
                    <Tile tone="forest" title="Music" text="Spotify, Apple Music or SoundCloud, playing right on your page." className="lg:col-span-2">
                        <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur">
                            <img src={photo(PHOTOS.chair.id, 200)} alt="" className="size-20 shrink-0 rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                                <p className="flex items-center gap-1.5 text-[13px] text-white/60">
                                    <IconBrandSpotify size={15} /> Sasha Lin
                                </p>
                                <p className="truncate text-lg font-bold text-white">Velvet Hours</p>
                                {/* the bars dance while it "plays" (CSS, so it costs nothing) */}
                                <div aria-hidden className="mt-2 flex h-6 items-end gap-1">
                                    {[0.6, 1, 0.4, 0.8, 0.5, 0.9, 0.3, 0.7, 1, 0.5, 0.8, 0.4].map((h, i) => (
                                        <span key={i} className="w-1.5 origin-bottom animate-[equalizer_1s_ease-in-out_infinite] rounded-full bg-rose" style={{ height: `${h * 100}%`, animationDelay: `${i * 0.09}s` }} />
                                    ))}
                                </div>
                            </div>
                            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-pink text-white">
                                <IconPlayerPauseFilled size={20} />
                            </span>
                        </div>
                    </Tile>

                    {/* map: a drawn street map with a pin */}
                    <Tile tone="blush" title="Map" text="Your studio, shop or next gig. Directions in a tap." className="lg:row-span-2">
                        <div className="relative h-64 overflow-hidden rounded-2xl bg-[#f7efe9] lg:h-full lg:min-h-80">
                            <svg aria-hidden viewBox="0 0 300 320" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
                                <rect width="300" height="320" fill="#f3ece4" />
                                <path d="M40 0 V320 M150 0 C 160 120, 120 200, 170 320 M0 90 H300 M0 210 C 100 190, 200 240, 300 220" stroke="#ffffff" strokeWidth="14" fill="none" />
                                <path d="M230 0 V320 M0 150 H300" stroke="#ffffff" strokeWidth="7" fill="none" />
                                <rect x="62" y="108" width="70" height="80" rx="10" fill="#cfe5d4" />
                                <rect x="185" y="20" width="35" height="55" rx="8" fill="#e8dcd2" />
                                <rect x="245" y="235" width="50" height="70" rx="8" fill="#e8dcd2" />
                            </svg>
                            <div data-pin className="absolute top-[42%] left-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                                <span className="rounded-full bg-forest px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-white shadow-lifted">Mira&rsquo;s studio</span>
                                <IconMapPin size={40} className="-mt-1 fill-pink text-white" stroke={1.5} />
                            </div>
                        </div>
                    </Tile>

                    {/* tips */}
                    <Tile tone="pink" title="Tips & payments" text="PayPal, Ko-fi or UPI. The money goes straight to you, no fees from us.">
                        <div className="relative pt-8">
                            <span data-coin className="absolute top-0 left-1/2 grid size-10 -translate-x-1/2 place-items-center rounded-full bg-rose font-(family-name:--font-anton) text-lg text-forest shadow-lifted">
                                $
                            </span>
                            <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3.5 text-[15px] font-bold text-pink">
                                <IconCoffee size={20} /> Buy me a coffee
                            </div>
                        </div>
                    </Tile>

                    {/* scheduling */}
                    <Tile tone="white" title="Scheduling" text="Set a link to appear for the drop and vanish when it's over.">
                        <div className="flex items-center gap-3 rounded-2xl border border-line bg-paper p-3.5">
                            <span className="grid size-10 place-items-center rounded-xl bg-blush text-pink">
                                <IconCalendarEvent size={19} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-bold text-ink">Spring drop</span>
                                <span className="block text-[12px] text-ink/55">Fri 9:00 → Sun 23:59</span>
                            </span>
                            <span data-switch-track className="relative h-6 w-11 shrink-0 rounded-full bg-line-strong">
                                <span data-switch className="absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow" />
                            </span>
                        </div>
                    </Tile>

                    {/* gallery */}
                    <Tile tone="white" title="Galleries" text="Your latest work, in a grid that looks after itself.">
                        <div className="grid grid-cols-3 gap-1.5">
                            {[PHOTOS.cup, PHOTOS.cupHand, PHOTOS.desk].map((item) => (
                                <img key={item.id} src={photo(item.id, 240)} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
                            ))}
                        </div>
                    </Tile>

                    {/* video */}
                    <Tile tone="forest" title="Video" text="YouTube or Vimeo, right where people already are.">
                        <div className="relative overflow-hidden rounded-2xl">
                            <img src={photo(PHOTOS.piano.id, 500)} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                            <span className="absolute inset-0 grid place-items-center bg-black/20">
                                <span className="grid size-12 place-items-center rounded-full bg-white text-forest shadow-lifted">
                                    <IconPlayerPlayFilled size={20} />
                                </span>
                            </span>
                        </div>
                    </Tile>
                </div>
            </div>
        </section>
    );
}

const TONES = {
    forest: "bg-forest text-white",
    blush: "bg-blush text-forest",
    pink: "bg-pink text-white",
    white: "bg-paper text-forest ring-1 ring-line",
};

function Tile({ tone, title, text, className = "", children }: { tone: keyof typeof TONES; title: string; text: string; className?: string; children: ReactNode }) {
    return (
        <article data-tile className={`flex flex-col justify-between gap-8 rounded-[2rem] p-6 sm:p-7 ${TONES[tone]} ${className}`}>
            {children}
            <div>
                <h3 className="font-(family-name:--font-anton) text-3xl leading-none uppercase">{title}</h3>
                <p className="mt-2 max-w-sm text-[15px] leading-relaxed opacity-75">{text}</p>
            </div>
        </article>
    );
}
