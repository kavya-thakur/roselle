"use client";

import { useEffect } from "react";

// The dashboard is exactly one screen tall and scrolls inside its panels. When a phone's keyboard
// opens, Safari scrolls the whole window up to make room, and after it closes it sometimes leaves
// it there: the app sits too high with a blank strip under it. Once typing ends, put it back.
export function KeyboardFix() {
    useEffect(() => {
        const settle = () =>
            // after the focus has moved: tapping from one field to the next must not jump
            setTimeout(() => {
                if (!document.activeElement?.matches("input, textarea, select") && window.scrollY !== 0) window.scrollTo(0, 0);
            }, 100);
        window.addEventListener("focusout", settle);
        return () => window.removeEventListener("focusout", settle);
    }, []);

    return null;
}
