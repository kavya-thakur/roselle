import Link from "next/link";

// A missing page, or a creator page that was never published
export default function NotFound() {
    return (
        <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-forest px-6 text-center text-white">
            <p className="text-xs font-bold tracking-[0.3em] text-blush uppercase">Not found</p>
            <h1 className="mt-5 font-display text-6xl sm:text-8xl">
                Nothing here, <span className="text-rose">yet.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-sm text-[15px] text-blush">This page doesn&apos;t exist, or its owner hasn&apos;t published it. The name might even be free.</p>
            <div className="mt-9 flex justify-center gap-3">
                <Link href="/register" className="flex h-12 items-center rounded-full bg-paper px-6 text-sm font-bold text-ink shadow-pop transition hover:-translate-y-0.5">
                    Claim a page
                </Link>
                <Link href="/" className="flex h-12 items-center rounded-full border-2 border-white/40 px-6 text-sm font-bold transition hover:bg-white/10">
                    Back to Roselle
                </Link>
            </div>
        </main>
    );
}
