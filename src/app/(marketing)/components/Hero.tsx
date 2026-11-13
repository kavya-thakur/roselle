"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

import type { PageDoc } from "@/lib/validations/page";
import { ClaimForm } from "./ClaimForm";
import { ProfileCard } from "./ProfileCard";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Where the profile cards float round the headline. `depth` is how near each feels: near ones
// move more with the mouse and fly further when you scroll. On phones the four sit in the corners.
const SPOTS = [
    { left: "2%", top: "13%", tilt: -7, depth: 1.1, scale: { phone: 0.27, desktop: 0.5 } },
    { left: "17%", top: "50%", tilt: 5, depth: 0.8, scale: { phone: 0.25, desktop: 0.42 } },
    { right: "2%", top: "11%", tilt: 6, depth: 1.1, scale: { phone: 0.27, desktop: 0.5 } },
    { right: "17%", top: "49%", tilt: -5, depth: 0.8, scale: { phone: 0.25, desktop: 0.42 } },
];

// The opening screen: one big two-tone headline with the claim box under it, and real creator
// pages floating all around it, each in a different look: a poster, a printed pattern, a banner.
// What a visitor sees first is what they could have by the end of the minute.
//
// Every card has three wrappers, each with one job, so the motions never fight: the outer
// one flies outward as you scroll, the middle one follows the mouse, the inner one drifts on its
// own. On load the headline rises letter by letter while the cards open up out of nothing.
export function Hero({ profiles }: { profiles: PageDoc[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const split = SplitText.create("[data-hero-line]", { type: "lines,chars", mask: "lines" });
                const floaters = gsap.utils.toArray<HTMLElement>("[data-floater]");

                // arriving
                const intro = gsap.timeline({ defaults: { ease: "expo.out" } });
                intro.set("[data-hero-hidden]", { autoAlpha: 1 });
                intro.from(split.chars, { yPercent: 120, duration: 1.4, stagger: 0.025 });
                intro.from("[data-hero-copy]", { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.12 }, 0.6);
                floaters.forEach((floater, i) => {
                    const tilt = Number(floater.dataset.tilt);
                    intro.fromTo(
                        floater.querySelector("[data-float]"),
                        { autoAlpha: 0, scale: 0.6, y: 120, rotation: tilt * 3 },
                        { autoAlpha: 1, scale: 1, y: 0, rotation: tilt, duration: 1.8 },
                        0.35 + i * 0.07,
                    );
                });

                // drifting on their own, each at its own pace, after they've arrived
                floaters.forEach((floater) => {
                    gsap.to(floater.querySelector("[data-float]"), {
                        y: gsap.utils.random(-22, 22),
                        rotation: `+=${gsap.utils.random(-3, 3)}`,
                        duration: gsap.utils.random(3, 5),
                        ease: "sine.inOut",
                        repeat: -1,
                        yoyo: true,
                        delay: 2,
                    });
                });

                // following the mouse: the nearer the photo, the further it leans
                const movers = floaters.map((floater) => ({
                    depth: Number(floater.dataset.depth),
                    x: gsap.quickTo(floater.querySelector("[data-parallax]"), "x", { duration: 1.2, ease: "power3.out" }),
                    y: gsap.quickTo(floater.querySelector("[data-parallax]"), "y", { duration: 1.2, ease: "power3.out" }),
                }));
                const onMove = (event: PointerEvent) => {
                    const dx = event.clientX / window.innerWidth - 0.5;
                    const dy = event.clientY / window.innerHeight - 0.5;
                    movers.forEach(({ depth, x, y }) => {
                        x(dx * 60 * depth);
                        y(dy * 40 * depth);
                    });
                };
                window.addEventListener("pointermove", onMove);

                // scrolling away: the photos burst outward and up, the headline sinks back
                const scrub = { trigger: ref.current, start: "top top", end: "bottom top", scrub: 0.8 };
                floaters.forEach((floater) => {
                    const depth = Number(floater.dataset.depth);
                    const side = floater.dataset.side === "left" ? -1 : 1;
                    gsap.to(floater, { x: side * 260 * depth, y: -380 * depth, scale: 1 + 0.35 * depth, ease: "none", scrollTrigger: scrub });
                });
                gsap.to("[data-hero-centre]", { y: 160, scale: 0.9, autoAlpha: 0.15, ease: "none", scrollTrigger: scrub });

                return () => window.removeEventListener("pointermove", onMove);
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} aria-labelledby="hero-title" className="relative flex min-h-[max(100svh,720px)] items-center justify-center overflow-hidden bg-shell px-5 pt-24 pb-16 text-forest max-lg:min-h-0 max-lg:flex-col max-lg:pb-14">
            {/* without JavaScript nothing would reveal the hidden pieces */}
            <noscript>
                <style>{".motion-safe\\:invisible{visibility:visible!important}"}</style>
            </noscript>

            {/* ---------- the floating profiles ---------- */}
            {/* Below laptop width there's no room round the words, so the four cards become a fanned row under
                the claim box (order-2): same cards, same motion, just placed in the flow */}
            <div aria-hidden className="absolute inset-0 max-lg:relative max-lg:inset-auto max-lg:order-2 max-lg:mt-12 max-lg:flex max-lg:w-full max-lg:justify-center">
                {SPOTS.map((spot, i) => (
                    <div
                        key={i}
                        data-floater
                        data-depth={spot.depth}
                        data-tilt={spot.tilt}
                        data-side={spot.left ? "left" : "right"}
                        // phones and tablets: in the row, overlapping a little, the middle two lifted
                        className={`absolute max-lg:relative max-lg:inset-auto! max-lg:-mx-2.5 ${i === 1 || i === 2 ? "max-lg:-mt-4" : "max-lg:mt-6"}`}
                        style={{ left: spot.left, right: spot.right, top: spot.top, zIndex: Math.round(spot.depth * 10) }}
                    >
                        <div data-parallax>
                            <div data-float data-hero-hidden className="motion-safe:invisible" style={{ transform: `rotate(${spot.tilt}deg)` }}>
                                <ProfileCard page={profiles[i % profiles.length]} scale={spot.scale} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ---------- the words ---------- */}
            <div data-hero-centre className="relative z-20 flex max-w-5xl flex-col items-center text-center">
                <p data-hero-copy data-hero-hidden className="flex items-center gap-2 rounded-full bg-paper/80 px-4 py-2 text-[13px] font-bold text-pink shadow-soft backdrop-blur motion-safe:invisible">
                    <span className="size-1.5 rounded-full bg-pink" />
                    The link in bio, with taste
                </p>

                <h1 id="hero-title" className="mt-7 font-(family-name:--font-anton) text-[clamp(3.4rem,10vw,10rem)] leading-[0.86] uppercase">
                    <span data-hero-line data-hero-hidden className="block motion-safe:invisible">
                        Everything
                    </span>
                    <span data-hero-line data-hero-hidden className="block motion-safe:invisible">
                        you are,
                    </span>
                    <span data-hero-line data-hero-hidden className="block text-pink motion-safe:invisible">
                        one link.
                    </span>
                </h1>

                <p data-hero-copy data-hero-hidden className="mt-7 max-w-[30rem] text-[17px] leading-relaxed text-ink/65 motion-safe:invisible sm:text-[19px]">
                    A beautiful page for everything you make, sell and share. Pick a look, paste your links, live in minutes.
                </p>

                <div data-hero-copy data-hero-hidden className="mt-8 flex w-full max-w-md flex-col items-center gap-3 motion-safe:invisible">
                    <ClaimForm />
                    <p className="text-[13px] text-ink/50">Free forever · No card needed</p>
                </div>
            </div>
        </section>
    );
}
