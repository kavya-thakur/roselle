import { Skeleton } from "@/components/Skeleton";

// The analytics page's shape while it loads: four numbers, the chart, the funnel
export default function Loading() {
    return (
        <main aria-busy="true" aria-label="Loading your analytics" className="flex-1 overflow-hidden">
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Skeleton className="h-12 w-56" />
                        <Skeleton className="mt-3 h-4 w-72 max-w-full rounded-full" />
                    </div>
                    <Skeleton className="h-10 w-64 rounded-full" />
                </div>
                <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-36 rounded-3xl" />
                    ))}
                </div>
                <Skeleton className="mt-3 h-80 rounded-3xl" />
                <Skeleton className="mt-3 h-44 rounded-3xl" />
            </div>
        </main>
    );
}
