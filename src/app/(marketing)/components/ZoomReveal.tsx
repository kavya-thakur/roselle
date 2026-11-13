"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconLink, IconTrendingUp, IconUsers } from "@tabler/icons-react";

import type { PageDoc } from "@/lib/validations/page";
import { ProfileCard } from "./ProfileCard";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The wall is 5 pages across and 3 down, 15 different people; the star sits in the very middle
// (row 2, column 3). On phones only the middle three columns show, so she's still in the middle.
const COLUMNS = 5;
const STAR = 7;

const CARD = "rounded-2xl bg-paper text-ink shadow-[0_2px_6px_rgb(0_0_0/0.08),0_24px_48px_-20px_rgb(0_0_0/0.45)]";

// A screen that holds still while you scroll through it. "ZOOM IN" rushes past you, a wall of
// creator pages settles into place, then you fly into the one in the middle while the others fall
// away, until it stands alone, big, with her story on one side and what the page does for her
// on the other.
export function ZoomReveal({ star, pages }: { star: PageDoc; pages: PageDoc[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const starCard = ref.current!.querySelector<HTMLElement>("[data-zoom-star]")!;
                // How far to grow the wall so the star ends up 80% of the screen tall. On phones the caption
                // needs the bottom of the screen, so she stops at 58% and the wall rises to make room.
                const phone = () => window.innerWidth < 1024;
                const zoom = () => (window.innerHeight * (phone() ? 0.58 : 0.8)) / starCard.offsetHeight;
                const lift = () => (phone() ? -window.innerHeight * 0.12 : 0);

                // While the wall moves it lives on its own layer: drawn once, then only enlarged like a
                // picture, instead of 15 pages being redrawn bigger on every frame. Once the zoom is
                // over the layer is let go, so the star page is drawn again, sharp, at its full size.
                const wall = ref.current!.querySelector<HTMLElement>("[data-zoom-wall]")!;
                const story = gsap.timeline({
                    defaults: { ease: "none" },
                    scrollTrigger: { trigger: ref.current, start: "top top", end: "+=320%", pin: true, scrub: 0.7, invalidateOnRefresh: true },
                    onUpdate: () => {
                        const moving = story.time() < 0.9;
                        if ((wall.style.willChange === "transform") !== moving) wall.style.willChange = moving ? "transform" : "auto";
                    },
                });

                story
                    .fromTo("[data-zoom-word]", { scale: 1, autoAlpha: 1 }, { scale: 9, autoAlpha: 0, duration: 0.3, ease: "power2.in" })
                    .fromTo("[data-zoom-wall]", { scale: 0.62, rotation: -6 }, { scale: 1, rotation: 0, duration: 0.32, ease: "power2.out" }, 0)
                    // a small stagger across the wall, so it settles like cards being laid down
                    .from("[data-zoom-tile]", { y: 80, autoAlpha: 0, duration: 0.2, stagger: { each: 0.008, from: "center" }, ease: "power2.out" }, 0.02)
                    // the wall holds still for a moment, so you can take it in, then you fly in
                    .to("[data-zoom-wall]", { scale: zoom, y: lift, duration: 0.42, ease: "power3.inOut" }, 0.5)
                    .to("[data-zoom-other]", { autoAlpha: 0, scale: 0.85, duration: 0.25, stagger: { each: 0.004, from: "center" } }, 0.52)
                    .from("[data-zoom-side]", { autoAlpha: 0, y: 50, duration: 0.12, stagger: 0.04, ease: "power2.out" }, 0.88);
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} aria-labelledby="zoom-title" className="relative h-svh overflow-hidden bg-forest text-shell">
            {/* a soft light where the star will stand */}
            <span aria-hidden className="absolute top-1/2 left-1/2 size-[min(1000px,140vw)] -translate-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(246_181_207/0.18),transparent)]" />

            {/* the wall of pages */}
            <div aria-hidden className="absolute inset-0 grid place-content-center">
                <div data-zoom-wall className="grid grid-cols-3 gap-3 md:grid-cols-5 md:gap-4">
                    {Array.from({ length: COLUMNS * 3 }, (_, i) => {
                        const column = i % COLUMNS;
                        const outer = column === 0 || column === COLUMNS - 1;
                        const isStar = i === STAR;
                        return (
                            <div key={i} data-zoom-tile className={outer ? "hidden md:block" : ""}>
                                <div {...(isStar ? { "data-zoom-star": "" } : { "data-zoom-other": "" })}>
                                    <ProfileCard page={isStar ? star : pages[i < STAR ? i : i - 1]} scale={{ phone: 0.24, desktop: 0.34 }} photoWidth={isStar ? 900 : 300} flat />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* the word you fly through */}
            {/* will-change: drawn once on its own layer and enlarged as a picture, instead of redrawing
                letters several screens tall on every frame; it's fading out, so the softness never shows */}
            <p data-zoom-word aria-hidden className="pointer-events-none absolute inset-0 z-10 flex will-change-transform items-center justify-center font-(family-name:--font-anton) text-[clamp(5rem,20vw,22rem)] leading-none text-rose uppercase">
                Zoom in
            </p>

            {/* ---------- once she stands alone ---------- */}
            <div className="pointer-events-none absolute inset-0 z-10 mx-auto flex max-w-[1360px] items-end justify-center px-5 pb-[4svh] lg:items-center lg:justify-between lg:px-10 lg:pb-0">
                <div data-zoom-side className="max-w-[22rem] text-center lg:max-w-[19rem] lg:text-left">
                    <p className="text-[13px] font-bold tracking-[0.16em] text-rose uppercase">Mira, ceramicist</p>
                    <h2 id="zoom-title" className="mt-4 font-(family-name:--font-anton) text-[clamp(2.2rem,4.6vw,4.6rem)] leading-[0.9] uppercase">
                        Her whole world,
                        <span className="block text-rose">one page.</span>
                    </h2>
                    <p className="mt-4 hidden text-[16px] leading-relaxed text-shell/75 lg:block">Her studio, her shop, her latest pieces. Everything she is, one tap from her bio.</p>
                </div>

                <ul className="hidden w-[17rem] flex-col gap-3 lg:flex">
                    <li data-zoom-side className={`${CARD} flex items-center gap-3 p-4`}>
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-forest text-rose">
                            <IconUsers size={20} />
                        </span>
                        <span>
                            <span className="block font-(family-name:--font-anton) text-2xl leading-none text-forest">1,284</span>
                            <span className="text-[13px] text-ink/60">visitors this week</span>
                        </span>
                    </li>
                    <li data-zoom-side className={`${CARD} ml-6 flex items-center gap-3 p-4`}>
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-pink text-white">
                            <IconTrendingUp size={20} />
                        </span>
                        <span>
                            <span className="block font-(family-name:--font-anton) text-2xl leading-none text-forest">+38%</span>
                            <span className="text-[13px] text-ink/60">clicks on her shop</span>
                        </span>
                    </li>
                    <li data-zoom-side className={`${CARD} flex items-center gap-3 p-4`}>
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blush text-pink">
                            <IconLink size={20} />
                        </span>
                        <span className="text-[14px] leading-tight">
                            <span className="block font-bold">Spring collection</span>
                            <span className="text-[13px] text-ink/60">added in 20 seconds</span>
                        </span>
                    </li>
                </ul>
            </div>
        </section>
    );
}
