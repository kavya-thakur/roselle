"use client";

import { useRouter } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

// "← Back": to wherever you came from (a creator's page, the landing page), or, opened straight
// from a link with nothing to go back to, to `fallback`
export function BackButton({ fallback = "/", label = "Back" }: { fallback?: string; label?: string }) {
    const router = useRouter();

    return (
        <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
            className="flex h-10 items-center gap-1.5 rounded-full bg-paper px-4 text-sm font-semibold shadow-soft transition hover:bg-sand"
        >
            <IconArrowLeft size={16} /> {label}
        </button>
    );
}
