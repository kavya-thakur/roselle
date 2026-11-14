// A placeholder in the shape of what's loading, with a soft light sweeping across it.
// Still for people who ask for less motion.
export function Skeleton({ className = "" }: { className?: string }) {
    return (
        <div
            aria-hidden
            className={`animate-[shimmer_1.6s_ease-in-out_infinite] rounded-2xl bg-[linear-gradient(90deg,var(--color-sand)_0%,#f5f5f1_50%,var(--color-sand)_100%)] bg-[length:200%_100%] motion-reduce:animate-none ${className}`}
        />
    );
}
