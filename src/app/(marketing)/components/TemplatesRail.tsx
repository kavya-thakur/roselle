"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

import type { PageDoc } from "@/lib/validations/page";
import { PageCard } from "./PageCard";
import { Pill } from "./Pill";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// The templates, as a row of real pages that slides sideways while the screen holds still:
// scrolling down moves the row left. Each page leans a little and straightens as it passes the
// middle. With reduced motion it's a plain row you can swipe.
export function TemplatesRail({ looks }: { looks: { name: string; page: PageDoc }[] }) {
    const ref = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                const track = ref.current!.querySelector<HTMLElement>("[data-track]")!;
                // how far the row has to travel for its last page to reach the screen's edge
                const distance = () => track.scrollWidth - window.innerWidth + 40;

                const slide = gsap.to(track, {
                    x: () => -distance(),
                    ease: "none",
                    scrollTrigger: { trigger: ref.current, start: "top top", end: () => `+=${distance()}`, pin: true, scrub: 0.6, invalidateOnRefresh: true },
                });

                gsap.utils.toArray<HTMLElement>("[data-look]").forEach((look, i) => {
                    gsap.fromTo(
                        look,
                        { rotation: i % 2 ? 6 : -6, y: i % 2 ? 50 : -30 },
                        { rotation: 0, y: 0, ease: "none", scrollTrigger: { trigger: look, containerAnimation: slide, start: "left right", end: "center center", scrub: true } },
                    );
                });
            });
        },
        { scope: ref },
    );

    return (
        <section ref={ref} id="templates" aria-labelledby="templates-title" className="flex min-h-svh flex-col justify-center overflow-hidden bg-shell py-20 text-forest">
            <div data-track className="flex w-max items-center gap-10 px-5 lg:gap-14 lg:px-10 motion-reduce:w-auto motion-reduce:overflow-x-auto">
                <div className="w-[min(78vw,460px)] shrink-0">
                    <h2 id="templates-title" className="font-(family-name:--font-anton) text-[clamp(3.4rem,7vw,7rem)] leading-[0.88] uppercase">
                        Pick a look.
                        <span className="block text-pink">Make it yours.</span>
                    </h2>
                    <p className="mt-6 max-w-sm text-[18px] leading-relaxed text-ink/65">Every page here is real, built with Roselle. Start from one, then change anything.</p>
                    <Pill href="/register" tone="forest" className="mt-8">
                        Start with a look
                    </Pill>
                </div>

                {looks.map((look) => (
                    <figure key={look.name} data-look className="w-[min(70vw,290px)] shrink-0">
                        <PageCard page={look.page} className="h-[min(560px,64svh)]" />
                        <figcaption className="mt-4 flex items-baseline justify-between px-1 text-[15px] font-semibold">
                            {look.name}
                            <span className="text-[13px] font-medium text-ink/45">Template</span>
                        </figcaption>
                    </figure>
                ))}
            </div>
        </section>
    );
}
