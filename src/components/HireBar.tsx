"use client";

import { useEffect, useState } from "react";
import { IconArrowDown, IconArrowUp } from "@tabler/icons-react";

// Once the top of the page has scrolled away: a slim bar with the way to hire the creator, always one
// tap from wherever the visitor is reading. It steps aside while the services (or the contact form)
// are on screen, and comes back once they're scrolled past, pointing up at them then. On a big
// screen it's as wide as the page's card.
export function HireBar({ target, label, detail }: { target: string; label: string; detail?: string }) {
    const [show, setShow] = useState(false);
    // the services are behind the visitor (scrolled past), so the arrow points up
    const [above, setAbove] = useState(false);

    useEffect(() => {
        const intro = document.getElementById("page-intro");
        const goal = document.getElementById(target);
        if (!intro || !goal) return;

        const onScreen = new Map<Element, boolean>();
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                onScreen.set(entry.target, entry.isIntersecting);
                if (entry.target === goal && !entry.isIntersecting) setAbove(entry.boundingClientRect.top < 0);
            }
            setShow(onScreen.get(intro) === false && onScreen.get(goal) === false);
        });
        observer.observe(intro);
        observer.observe(goal);
        return () => observer.disconnect();
    }, [target]);

    return (
        <a
            href={`#${target}`}
            aria-hidden={!show}
            tabIndex={show ? 0 : -1}
            className={`fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-[556px] items-center gap-3 rounded-full bg-(--page-text) py-2 pr-2 pl-5 text-(--page-base) shadow-[0_18px_40px_-12px_rgb(0_0_0/0.5)] transition duration-300 ${
                show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[150%] opacity-0"
            }`}
        >
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{label}</span>
                {detail && <span className="block truncate text-xs opacity-70">{detail}</span>}
            </span>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--page-base) text-(--page-text)">
                {above ? <IconArrowUp size={18} /> : <IconArrowDown size={18} />}
            </span>
        </a>
    );
}
