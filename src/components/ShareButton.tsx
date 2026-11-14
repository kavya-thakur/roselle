"use client";

import { IconShare3 } from "@tabler/icons-react";
import { toast } from "./Toast";

// The share button in the page's top corner (like Linktree's): the phone's own share sheet where
// there is one, otherwise the link copied
export function ShareButton({ name }: { name: string }) {
    async function share() {
        const url = window.location.href.split("#")[0];
        if (navigator.share) {
            // closing the share sheet without sharing throws; that's not an error worth showing
            await navigator.share({ title: name, url }).catch(() => {});
            return;
        }
        try {
            await navigator.clipboard.writeText(url);
            toast("Link copied", { detail: url.replace(/^https?:\/\//, "") });
        } catch {
            toast.error("Couldn't copy the link", url);
        }
    }

    return (
        <button
            type="button"
            onClick={share}
            aria-label={`Share ${name}'s page`}
            className="absolute top-4 right-4 z-10 flex size-10 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--page-base)_55%,transparent)] text-(--page-text) backdrop-blur-md transition hover:bg-[color-mix(in_oklab,var(--page-base)_75%,transparent)]"
        >
            <IconShare3 size={18} />
        </button>
    );
}
