"use client";

import { useSyncExternalStore } from "react";

const neverChanges = () => () => {};

// A date in the viewer's own time zone and language. The server knows neither, so it sends the
// plain date ("2026-11-13", the same everywhere) and the browser swaps in the local wording once
// it runs. Formatting on both sides would make them disagree (a React hydration error).
export function LocalTime({ iso, format = "datetime" }: { iso: string; format?: "date" | "datetime" }) {
    const inBrowser = useSyncExternalStore(neverChanges, () => true, () => false);
    const text = inBrowser ? new Date(iso).toLocaleString(undefined, format === "date" ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" }) : iso.slice(0, 10);
    return <time dateTime={iso}>{text}</time>;
}
