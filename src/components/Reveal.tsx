"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

// Fades and lifts its content in the first time it scrolls into view (the .reveal rules in
// globals.css). `order` staggers neighbours: 0, 1, 2 arrive one after another.
export function Reveal({ children, order = 0, className = "" }: { children: ReactNode; order?: number; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const element = ref.current!;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                element.dataset.shown = "";
                observer.disconnect();
            },
            // a little before it's fully in, so it's already moving as it arrives
            { rootMargin: "0px 0px -10% 0px" }
        );
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`reveal ${className}`} style={{ "--order": order } as CSSProperties}>
            {children}
        </div>
    );
}
