// Shown while a dashboard page loads on the server: the shape of a page, gently pulsing,
// so the screen doesn't jump when the real one arrives
export default function Loading() {
    return (
        <div aria-busy="true" aria-label="Loading" className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
            <div className="h-12 w-64 animate-pulse rounded-2xl bg-sand" />
            <div className="mt-3 h-4 w-80 animate-pulse rounded-full bg-sand" />
            <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="h-32 animate-pulse rounded-3xl bg-sand" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
            </div>
            <div className="mt-3 h-72 animate-pulse rounded-3xl bg-sand" />
        </div>
    );
}
