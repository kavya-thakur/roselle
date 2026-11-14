"use client";

import { useEffect } from "react";
import Link from "next/link";

// When something breaks while a page is shown (the database unreachable for a moment, say),
// people get this instead of a blank screen, and a way to try again without losing their place.
// Dressed like the not-found page.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-forest px-6 text-center text-white">
            <p className="text-xs font-bold tracking-[0.3em] text-blush uppercase">Something went wrong</p>
            <h1 className="mt-5 font-display text-6xl sm:text-8xl">
                Not this time, <span className="text-rose">sorry.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-[15px] text-blush">That didn&apos;t load, and it&apos;s on our side. It usually works on the next try.</p>
            <div className="mt-9 flex justify-center gap-3">
                <button onClick={reset} className="flex h-12 items-center rounded-full bg-paper px-6 text-sm font-bold text-ink shadow-pop transition hover:-translate-y-0.5">
                    Try again
                </button>
                <Link href="/" className="flex h-12 items-center rounded-full border-2 border-white/40 px-6 text-sm font-bold transition hover:bg-white/10">
                    Back to Roselle
                </Link>
            </div>
        </main>
    );
}
