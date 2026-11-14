import { Skeleton } from "@/components/Skeleton";

// The reviews page's shape while it loads
export default function Loading() {
    return (
        <main aria-busy="true" aria-label="Loading your reviews" className="flex-1 overflow-hidden">
            <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-full" />
                <Skeleton className="mt-10 h-6 w-40 rounded-full" />
                {[0, 1].map((i) => (
                    <div key={i} className="mt-4 rounded-2xl border border-line bg-paper p-5">
                        <Skeleton className="h-4 w-24 rounded-full" />
                        <Skeleton className="mt-4 h-3.5 w-full rounded-full" />
                        <Skeleton className="mt-2 h-3.5 w-4/5 rounded-full" />
                        <Skeleton className="mt-5 h-8 w-32 rounded-full" />
                    </div>
                ))}
            </div>
        </main>
    );
}
