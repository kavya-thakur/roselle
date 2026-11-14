import { Skeleton } from "@/components/Skeleton";

// The editor's shape while it loads: the list of blocks on the left, the page preview on the right
export default function Loading() {
    return (
        <div aria-busy="true" aria-label="Loading the editor" className="flex flex-1 flex-col overflow-hidden">
            <div className="flex h-18 shrink-0 items-center justify-between px-5">
                <Skeleton className="size-10 rounded-full" />
                <Skeleton className="h-10 w-40 rounded-full" />
                <Skeleton className="h-11 w-28 rounded-full" />
            </div>
            <div className="flex min-h-0 flex-1 gap-6 px-3 pb-3 lg:px-5">
                <div className="w-full rounded-[2rem] bg-paper p-6 lg:max-w-[620px]">
                    <Skeleton className="h-7 w-32" />
                    <div className="mt-6 flex items-center gap-4">
                        <Skeleton className="size-16 rounded-full" />
                        <Skeleton className="h-5 w-40 rounded-full" />
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-2.5">
                        <Skeleton className="h-12 rounded-full" />
                        <Skeleton className="h-12 rounded-full" />
                    </div>
                    {[0, 1, 2, 3].map((i) => (
                        <Skeleton key={i} className="mt-3 h-20 rounded-3xl" />
                    ))}
                </div>
                <div className="hidden flex-1 items-center justify-center lg:flex">
                    <Skeleton className="h-[min(760px,calc(100dvh-140px))] w-[380px] rounded-[1.75rem]" />
                </div>
            </div>
        </div>
    );
}
