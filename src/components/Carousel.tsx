"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

// A row that scrolls sideways, with round arrows on its edges so people know there's more (a
// swipe isn't obvious, and a mouse can't swipe at all). Each arrow shows only while there's more
// that way, and moves the row by most of a screen. The items snap into place.
export function Carousel({ label, children }: { label: string; children: ReactNode }) {
    const row = useRef<HTMLDivElement>(null);
    const [more, setMore] = useState({ back: false, forward: false });

    useEffect(() => {
        const element = row.current;
        if (!element) return;
        const check = () =>
            setMore({
                back: element.scrollLeft > 4,
                forward: element.scrollLeft + element.clientWidth < element.scrollWidth - 4,
            });
        check();
        element.addEventListener("scroll", check, { passive: true });
        // pictures load later and the screen can turn, both of which change what's left to see
        const observer = new ResizeObserver(check);
        observer.observe(element);
        return () => {
            element.removeEventListener("scroll", check);
            observer.disconnect();
        };
    }, []);

    const move = (direction: 1 | -1) => row.current?.scrollBy({ left: direction * row.current.clientWidth * 0.8, behavior: "smooth" });
    const arrow = "absolute top-[38%] z-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1b1416] shadow-[0_4px_16px_rgb(0_0_0/0.18)] backdrop-blur transition hover:scale-105 active:scale-95";

    return (
        <div className="relative">
            {/* runs to the screen's edges on a phone, so the next item peeks in */}
            <div ref={row} role="region" aria-label={label} className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] @md:mx-0 @md:scroll-px-0 @md:px-0 [&::-webkit-scrollbar]:hidden">
                {children}
            </div>
            {more.back && (
                <button type="button" onClick={() => move(-1)} aria-label="Previous" className={`${arrow} -left-1 @md:-left-4`}>
                    <IconChevronLeft size={20} />
                </button>
            )}
            {more.forward && (
                <button type="button" onClick={() => move(1)} aria-label="Next" className={`${arrow} -right-1 @md:-right-4`}>
                    <IconChevronRight size={20} />
                </button>
            )}
        </div>
    );
}
