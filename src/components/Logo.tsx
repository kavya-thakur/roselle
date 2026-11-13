import Link from "next/link";

// The mark: an R built from four modules on a grid with even 5-unit gutters. The stem is two
// blocks, the bowl a half-disc, the leg a pink slab. Same drawing as app/icon.svg minus the tile;
// the white parts take the text colour.
export function LogoMark({ className = "size-7" }: { className?: string }) {
    return (
        <svg viewBox="0 0 100 100" aria-hidden className={className}>
            <g fill="currentColor">
                <rect x="22" y="16" width="20" height="34" />
                <rect x="22" y="55" width="20" height="29" />
                <path d="M47 16h7a17 17 0 0 1 0 34h-7Z" />
            </g>
            <path d="M47 55h13l18 29H65Z" fill="#e0408f" className="transition-transform duration-500 ease-(--ease-soft) group-hover:translate-x-[3px] group-hover:translate-y-[4px]" />
        </svg>
    );
}

// The lockup: mark + ROSELLE in Archivo at its widest. On hover the pink leg kicks out a little
export function Logo({ className = "text-ink" }: { className?: string }) {
    return (
        <Link
            href="/"
            aria-label="Roselle home"
            className={`group inline-flex items-center gap-1.5 font-(family-name:--font-archivo) text-[21px] leading-none font-extrabold tracking-[0.04em] uppercase [font-stretch:125%] ${className}`}
        >
            <LogoMark className="size-[1.6em]" />
            Roselle
        </Link>
    );
}
