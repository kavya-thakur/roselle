"use client";

import { IconRefresh } from "@tabler/icons-react";

// Something broke while loading a dashboard page. Nothing is lost: drafts are saved on the
// server, so trying again is always safe.
export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
    return (
        <main className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
            <p className="flex size-16 rotate-[-6deg] items-center justify-center rounded-2xl bg-blush text-pink font-display text-3xl shadow-pop">!</p>
            <h1 className="mt-8 font-display text-4xl">That didn&apos;t load</h1>
            <p className="mt-3 max-w-sm text-muted">Your page and its changes are safe. Give it another go; if it keeps happening, check your connection.</p>
            <button
                onClick={reset}
                className="mt-8 flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white transition hover:bg-[#2e2e2e]"
            >
                <IconRefresh size={16} /> Try again
            </button>
        </main>
    );
}
