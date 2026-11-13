"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

// Wraps the whole landing page and adds the one quiet motion the sections share: as a heading
// (data-heading) comes into view its lines slide up out of a mask, and blocks marked data-rise
// fade up. Its effect runs after the sections' own, so these are measured after their pins.
// Also sets the focus ring; sections on dark or pink backgrounds switch it with --focus.
export function Motion({ children }: { children: ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia(ref);
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                // split again whenever the lines change (resize, fonts arriving)
                gsap.utils.toArray<HTMLElement>("[data-heading]").forEach((heading) => {
                    SplitText.create(heading, {
                        type: "lines",
                        mask: "lines",
                        autoSplit: true,
                        onSplit: (split) =>
                            gsap.from(split.lines, {
                                yPercent: 100,
                                duration: 1.2,
                                ease: "power3.out",
                                stagger: 0.1,
                                scrollTrigger: { trigger: heading, start: "top 85%" },
                            }),
                    });
                });

                gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((block) =>
                    gsap.from(block, { y: 32, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: block, start: "top 88%" } }),
                );
            });
        },
        { scope: ref },
    );

    return (
        <div
            ref={ref}
            className="flex-1 overflow-x-clip bg-shell [--focus:var(--color-forest)] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-(--focus)"
        >
            {children}
        </div>
    );
}
