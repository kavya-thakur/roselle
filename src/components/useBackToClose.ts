"use client";

import { useEffect, useRef } from "react";

// Full-screen things that aren't pages (the editor's preview, a photo opened full screen, a
// dialog) close with the phone's Back gesture or the browser's Back button, like a page would,
// instead of leaving the site. Opening one adds an entry to the history; Back takes it away
// and closes it. Closed any other way (its own ✕), the entry is taken back too, so the next
// Back isn't a step that does nothing.
//
// They can be open inside each other (Design → Text, then the preview over it). Each entry
// knows how deep it is, and each one only closes when Back goes below its own entry: closing
// the preview leaves you in Design → Text, where you were.
const depthOf = (state: unknown) => (state as { overlayDepth?: number } | null)?.overlayDepth ?? 0;

export function useBackToClose(open: boolean, close: () => void) {
    const closeRef = useRef(close);
    useEffect(() => {
        closeRef.current = close;
    });

    useEffect(() => {
        if (!open) return;
        const id = Math.random();
        const depth = depthOf(window.history.state) + 1;
        window.history.pushState({ overlay: id, overlayDepth: depth }, "");
        let popped = false;
        const onPop = () => {
            // Back from something open on top of this one: not ours to close
            if (depthOf(window.history.state) >= depth) return;
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
