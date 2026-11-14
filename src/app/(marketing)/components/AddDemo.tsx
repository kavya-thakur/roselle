"use client";

/* eslint-disable @next/next/no-img-element -- the photographs come from Unsplash, which next/image isn't set up for */
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconArrowUpRight, IconBrandSpotify, IconCheck, IconLink, IconPointerFilled } from "@tabler/icons-react";

import type { PageDoc } from "@/lib/validations/page";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const URL = "open.spotify.com/album/velvet-hours";
const STEPS = ["Named it “Velvet Hours”", "Found the Spotify icon", "Styled it to match your page"];

// "Paste a link. That's it.", acted out as you scroll: an address types itself into the Add box,
// the pointer presses Add, Roselle ticks off what it did with it, and the new link drops into the
// page underneath, pushing the others down. The markup is the finished state, so with reduced
// motion (or no script) you simply see the link already added.
export function AddDemo({ page }: { page: PageDoc }) {
    const ref = useRef<HTMLDivElement>(null);
    const { profile } = page;
    const links = page.blocks.filter((block) => block.type === "link").slice(0, 2);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const field = ref.current!.querySelector<HTMLElement>("[data-typed]")!;
                const typed = { n: 0 };

                const demo = gsap.timeline({
                    defaults: { ease: "power2.out" },
                    scrollTrigger: { trigger: ref.current, start: "top 75%", end: "bottom 45%", scrub: 0.6 },
                });

                demo
                    // the address types itself in, letter by letter
                    .fromTo(typed, { n: 0 }, { n: URL.length, duration: 1.2, ease: "none", onUpdate: () => (field.textContent = URL.slice(0, Math.round(typed.n))) })
                    .from("[data-caret]", { autoAlpha: 0, duration: 0.1 }, 0)
                    // the pointer travels to Add and presses it
                    .from("[data-pointer]", { x: -120, y: 90, autoAlpha: 0, duration: 0.6 }, 0.5)
                    .to("[data-add-button]", { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" }, 1.15)
                    .to("[data-pointer]", { autoAlpha: 0, duration: 0.2 }, 1.45)
                    // Roselle ticks off what it did
                    .from("[data-step]", { autoAlpha: 0, x: -14, duration: 0.3, stagger: 0.2 }, 1.4)
                    .from("[data-step-tick]", { scale: 0, duration: 0.25, stagger: 0.2, ease: "back.out(3)" }, 1.5)
                    // and the new link drops into the page, the others making room
                    .from("[data-new-slot]", { height: 0, marginTop: 0, duration: 0.5, ease: "power3.inOut" }, 2.1)
                    .from("[data-new-link]", { y: -40, scale: 0.85, autoAlpha: 0, duration: 0.5, ease: "back.out(1.8)" }, 2.3)
                    .from("[data-new-badge]", { scale: 0, rotation: -30, duration: 0.3, ease: "back.out(3)" }, 2.65);
            });
        },
        { scope: ref },
    );

    return (
        <div ref={ref} aria-hidden className="relative mx-auto h-[540px] w-full max-w-[500px] sm:h-[580px]">
            {/* ---------- the page it lands on ---------- */}
            <div className="absolute bottom-0 left-0 w-[76%] rotate-[-3deg] overflow-hidden rounded-[2rem] bg-paper p-5 shadow-[0_2px_6px_rgb(20_20_20/0.06),0_40px_80px_-30px_rgb(11_77_44/0.45)] sm:w-[70%] sm:p-6">
                <div className="flex flex-col items-center text-center">
                    <img src={profile.avatar} alt="" className="size-20 rounded-full object-cover ring-4 ring-blush" />
                    <p className="mt-3 text-xl font-extrabold tracking-tight text-forest">{profile.name}</p>
                    <p className="mt-1 text-[12px] leading-snug text-ink/55">{profile.bio}</p>
                </div>

                <div className="mt-5 flex flex-col">
                    {/* the slot opens, then the new link drops into it */}
                    <div data-new-slot className="h-14 overflow-visible">
                        <div data-new-link className="relative flex h-14 items-center gap-3 rounded-full bg-forest pr-4 pl-2 text-white shadow-[0_12px_24px_-12px_rgb(11_77_44/0.8)]">
                            <span className="grid size-10 place-items-center rounded-full bg-[#1ed760] text-forest">
                                <IconBrandSpotify size={22} />
                            </span>
                            <span className="flex-1 text-center text-[14px] font-bold">Velvet Hours</span>
                            <IconArrowUpRight size={16} className="opacity-60" />
                            <span data-new-badge className="absolute -top-2 -right-1 rounded-full bg-pink px-2 py-0.5 text-[10px] font-bold">
                                New
                            </span>
                        </div>
                    </div>
                    {links.map((link) => (
                        <div key={link.id} className="mt-2.5 flex h-12 items-center justify-center rounded-full border-2 border-forest/15 px-4 text-[13px] font-semibold text-forest">
                            {"title" in link ? link.title : ""}
                        </div>
                    ))}
                </div>
            </div>

            {/* ---------- the Add box, floating over the page ---------- */}
            <div className="absolute top-0 right-0 w-[86%] rounded-[1.75rem] bg-paper p-4 text-ink shadow-[0_2px_6px_rgb(20_20_20/0.06),0_30px_60px_-24px_rgb(20_20_20/0.35)] sm:w-[78%] sm:p-5">
                <p className="text-[13px] font-bold text-ink/55">Add a link</p>
                <div className="mt-2 flex items-center gap-2 rounded-full bg-sand py-1.5 pr-1.5 pl-3.5">
                    <IconLink size={16} className="shrink-0 text-ink/45" />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                        <span data-typed>{URL}</span>
                        <span data-caret className="ml-px inline-block h-3.5 w-px translate-y-0.5 animate-pulse bg-ink" />
                    </span>
                    <span data-add-button className="relative shrink-0 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-white">
                        Add
                        <IconPointerFilled data-pointer size={26} className="absolute top-5 left-7 -rotate-12 text-ink drop-shadow-[0_2px_2px_rgb(255_255_255/0.9)]" />
                    </span>
                </div>
                <ul className="mt-3.5 space-y-2">
                    {STEPS.map((step) => (
                        <li key={step} data-step className="flex items-center gap-2 text-[13px] font-semibold text-forest">
                            <span data-step-tick className="grid size-5 shrink-0 place-items-center rounded-full bg-forest text-white">
                                <IconCheck size={12} stroke={3} />
                            </span>
                            {step}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
