"use client";

import { useEffect } from "react";

// Tells analytics someone opened the page, with where they came from. Sent from the browser
// with sendBeacon, which doesn't hold the page up and still goes through if they leave at once.
export function TrackView({ pageId }: { pageId: number }) {
    useEffect(() => {
        // ?via=whatsapp: the short tag the analytics screen hands out; ?utm_source= is the usual long one
        const params = new URLSearchParams(window.location.search);
        const utmSource = params.get("via") ?? params.get("utm_source") ?? undefined;
        const body = JSON.stringify({ pageId, referrer: document.referrer || undefined, utmSource });

        navigator.sendBeacon("/api/public/views", new Blob([body], { type: "application/json" }));
    }, [pageId]);

    return null;
}
