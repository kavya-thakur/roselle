import { Skeleton } from "@/components/Skeleton";

// Shown while a dashboard page without a skeleton of its own loads (the welcome steps): the shape
// of a page, so the screen doesn't jump when the real one arrives
export default function Loading() {
    return (
        <div aria-busy="true" aria-label="Loading" className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="mt-12 h-12 w-80 max-w-full" />
            <Skeleton className="mt-3 h-4 w-96 max-w-full rounded-full" />
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-3xl" />
                ))}
            </div>
        </div>
    );
}
