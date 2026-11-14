import type { ReactNode } from "react";

// What a screen says when there's nothing on it yet: a small drawing, what's missing, and how to
// get it. One look everywhere; each screen picks the drawing and the words.

type Picture = "inbox" | "reviews" | "chart" | "tray" | "shield" | "blocks";

export function EmptyState({ picture, title, children, compact = false }: { picture: Picture; title: string; children?: ReactNode; compact?: boolean }) {
    return (
        <div className={`flex flex-col items-center text-center ${compact ? "py-8" : "rounded-3xl border border-dashed border-line-strong px-6 py-12 sm:py-14"}`}>
            <Drawing picture={picture} className={compact ? "h-20" : "h-28"} />
            <p className={`mt-5 font-display ${compact ? "text-xl" : "text-2xl"}`}>{title}</p>
            {children && <div className="mx-auto mt-1.5 max-w-sm text-sm text-muted">{children}</div>}
        </div>
    );
}

// The drawings: one soft blush shape behind, the subject in forest green lines, a touch of pink
function Drawing({ picture, className }: { picture: Picture; className: string }) {
    // the green outline; `line` is an outline alone, filled shapes add their own fill
    const stroke = { stroke: "var(--color-forest)", strokeWidth: 3, strokeLinecap: "round", strokeLinejoin: "round" } as const;
    const line = { ...stroke, fill: "none" } as const;
    const pink = "var(--color-pink)";

    return (
        <svg viewBox="0 0 160 120" aria-hidden className={`w-auto ${className}`}>
            <ellipse cx="80" cy="64" rx="62" ry="48" fill="var(--color-blush)" />
            {picture === "inbox" && (
                <>
                    {/* an envelope, a heart floating out of it */}
                    <rect x="38" y="48" width="84" height="54" rx="8" fill="white" {...stroke} />
                    <path d="M40 52 L80 80 L120 52" {...line} />
                    <path d="M80 30 c-6 -9 -19 -3 -13 7 l13 12 l13 -12 c6 -10 -7 -16 -13 -7 z" fill={pink} />
                    <circle cx="124" cy="34" r="3" fill={pink} />
                    <circle cx="34" cy="40" r="2.5" fill="var(--color-forest)" />
                </>
            )}
            {picture === "reviews" && (
                <>
                    {/* a speech card with three stars */}
                    <path d="M36 40 h88 a8 8 0 0 1 8 8 v34 a8 8 0 0 1 -8 8 h-52 l-16 14 v-14 h-20 a8 8 0 0 1 -8 -8 v-34 a8 8 0 0 1 8 -8 z" fill="white" {...stroke} />
                    {[60, 80, 100].map((x) => (
                        <path key={x} d={`M${x} 56 l3.5 7 l7.5 1 l-5.5 5.3 l1.4 7.6 l-6.9 -3.7 l-6.9 3.7 l1.4 -7.6 l-5.5 -5.3 l7.5 -1 z`} fill={pink} />
                    ))}
                    <circle cx="128" cy="28" r="3" fill={pink} />
                </>
            )}
            {picture === "chart" && (
                <>
                    {/* a card with a line climbing */}
                    <rect x="34" y="34" width="92" height="66" rx="10" fill="white" {...stroke} />
                    <path d="M46 86 L66 70 L82 78 L112 50" {...line} />
                    <circle cx="112" cy="50" r="5" fill={pink} />
                    <path d="M46 92 h68" stroke="var(--color-line-strong)" strokeWidth={2} strokeLinecap="round" />
                </>
            )}
            {picture === "tray" && (
                <>
                    {/* an empty tray */}
                    <path d="M36 70 l14 -28 h60 l14 28 v22 a6 6 0 0 1 -6 6 h-70 a6 6 0 0 1 -6 -6 z" fill="white" {...stroke} />
                    <path d="M36 70 h26 a18 10 0 0 0 36 0 h26" {...line} />
                    <circle cx="80" cy="30" r="3.5" fill={pink} />
                </>
            )}
            {picture === "shield" && (
                <>
                    {/* a shield with a tick: all clear */}
                    <path d="M80 26 l36 12 v24 c0 22 -16 36 -36 44 c-20 -8 -36 -22 -36 -44 v-24 z" fill="white" {...stroke} />
                    <path d="M64 66 l11 11 l22 -24" stroke={pink} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </>
            )}
            {picture === "blocks" && (
                <>
                    {/* three stacked cards and a plus: the page waiting for its first piece */}
                    <rect x="44" y="36" width="72" height="16" rx="8" fill="white" {...stroke} />
                    <rect x="44" y="58" width="72" height="16" rx="8" fill="white" {...stroke} />
                    <rect x="44" y="80" width="46" height="16" rx="8" fill="white" stroke="var(--color-line-strong)" strokeWidth={3} strokeDasharray="5 6" />
                    <circle cx="108" cy="88" r="11" fill={pink} />
                    <path d="M108 82 v12 M102 88 h12" stroke="white" strokeWidth={3} strokeLinecap="round" />
                </>
            )}
        </svg>
    );
}
