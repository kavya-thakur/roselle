"use client";

import { useEffect, useRef } from "react";

// Full-screen things that aren't pages (the editor's preview, a photo opened full screen, a
// dialog) close with the phone's Back gesture or the browser's Back button, like a page would,
// instead of leaving the site. Opening one adds an entry to the history; Back takes it away
// and closes it. Closed any other way (its own ✕), the entry is taken back too, so the next
// Back isn't a step that does nothing.
export function useBackToClose(open: boolean, close: () => void) {
    const closeRef = useRef(close);
    useEffect(() => {
        closeRef.current = close;
    });

    useEffect(() => {
        if (!open) return;
        const id = Math.random();
        window.history.pushState({ overlay: id }, "");
        let popped = false;
        const onPop = () => {
            popped = true;
            closeRef.current();
        };
        window.addEventListener("popstate", onPop);

        return () => {
            window.removeEventListener("popstate", onPop);
            // only when our entry is still on top: after a link inside it took us to another page, it isn't
            if (!popped && window.history.state?.overlay === id) window.history.back();
        };
    }, [open]);
}
