"use client";

import { IconCopy } from "@tabler/icons-react";
import { toast } from "./Toast";

// A discount code under a link ("Code YSSANE10"), copied with one tap
export function CodeChip({ code }: { code: string }) {
    async function copy() {
        try {
            await navigator.clipboard.writeText(code);
            toast(`Code ${code} copied`, { detail: "Paste it at checkout." });
        } catch {
            toast.error("Couldn't copy the code", `It's ${code}.`);
        }
    }

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={`Copy the code ${code}`}
            className="mx-auto flex items-center gap-2 rounded-full border border-dashed border-[color-mix(in_oklab,var(--page-text)_40%,transparent)] px-3.5 py-1.5 text-xs transition hover:bg-[color-mix(in_oklab,var(--page-text)_8%,transparent)]"
        >
            <span className="opacity-75">Code</span>
            <span className="font-semibold tracking-[0.08em]">{code}</span>
            <IconCopy size={13} className="opacity-70" />
        </button>
    );
}
