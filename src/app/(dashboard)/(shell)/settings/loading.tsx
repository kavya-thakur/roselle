import { Skeleton } from "@/components/Skeleton";

// The settings page's shape while it loads: a stack of cards
export default function Loading() {
    return (
        <main aria-busy="true" aria-label="Loading your settings" className="flex-1 overflow-hidden">
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
                <Skeleton className="h-12 w-44" />
                <Skeleton className="mt-3 h-4 w-72 max-w-full rounded-full" />
                <div className="mt-8 grid items-start gap-3 lg:grid-cols-[1.4fr_1fr]">
                    <div className="grid gap-3">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className="rounded-3xl bg-paper p-6 shadow-soft">
                                <Skeleton className="h-5 w-36 rounded-full" />
                                <Skeleton className="mt-3 h-3.5 w-3/4 rounded-full" />
                                <Skeleton className="mt-5 h-11 w-full rounded-xl" />
                            </div>
                        ))}
                    </div>
                    <Skeleton className="-order-1 h-80 rounded-3xl lg:order-none" />
                </div>
            </div>
        </main>
    );
}
