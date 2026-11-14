import { Skeleton } from "@/components/Skeleton";

// The admin page's shape while it loads: the same cards as the inbox
export default function Loading() {
    return (
        <main aria-busy="true" aria-label="Loading reports" className="flex-1 overflow-hidden">
            <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 sm:py-12">
                <Skeleton className="h-12 w-44" />
                <Skeleton className="mt-3 h-4 w-72 rounded-full" />
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                    <Skeleton className="h-32 rounded-3xl" />
                </div>
                <Skeleton className="mt-8 h-10 w-80 max-w-full rounded-full" />
                {[0, 1, 2].map((i) => (
                    <div key={i} className="mt-4 rounded-2xl border border-line bg-paper p-5">
                        <Skeleton className="h-4 w-48 rounded-full" />
                        <Skeleton className="mt-4 h-3.5 w-full rounded-full" />
                        <Skeleton className="mt-2 h-3.5 w-2/3 rounded-full" />
                        <Skeleton className="mt-5 h-8 w-36 rounded-full" />
                    </div>
                ))}
            </div>
        </main>
    );
}
