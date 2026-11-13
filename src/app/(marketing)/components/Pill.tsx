import type { ReactNode } from "react";
import Link from "next/link";

const TONES = {
    pink: "bg-pink text-white hover:bg-pink-hover",
    forest: "bg-forest text-white hover:bg-forest/90",
    white: "bg-paper text-forest hover:bg-blush",
};

// Pink only comes large: white on pink needs 19px bold to stay readable, so the small size is
// for forest and white
const SIZES = {
    large: "h-13 px-7 text-[19px]",
    small: "h-11 px-5 text-[15px]",
};

// The marketing site's button: a plain pill
export function Pill({
    href,
    tone = "pink",
    size = "large",
    className = "",
    children,
}: {
    href: string;
    tone?: keyof typeof TONES;
    size?: keyof typeof SIZES;
    className?: string;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center justify-center rounded-full font-bold whitespace-nowrap transition-colors duration-300 ${SIZES[size]} ${TONES[tone]} ${className}`}
        >
            {children}
        </Link>
    );
}
