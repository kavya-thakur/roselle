import Link from "next/link";

import { Logo } from "@/components/Logo";

import { Pill } from "./Pill";

const LINKS = [
    { href: "#features", label: "Features" },
    { href: "#templates", label: "Templates" },
    { href: "#pricing", label: "Pricing" },
];

// One quiet row over the hero that scrolls away with it: the wordmark, three anchors, and the
// two ways in. Nothing follows you down the page; every section ends with its own way to sign up.
export function Nav() {
    return (
        <header className="absolute inset-x-0 top-0 z-40">
            <div className="mx-auto flex h-20 max-w-[1360px] items-center justify-between px-5 lg:h-24 lg:px-10">
                <Logo className="text-forest" />

                <nav aria-label="Main" className="hidden md:block">
                    <ul className="flex gap-10 text-[15px] font-semibold text-forest">
                        {LINKS.map((link) => (
                            <li key={link.href}>
                                <a href={link.href} className="transition-colors duration-300 hover:text-pink">
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="flex items-center gap-4 sm:gap-6">
                    <Link href="/login" className="text-[14px] font-semibold whitespace-nowrap text-forest max-[379px]:hidden sm:text-[15px] transition-colors duration-300 hover:text-pink">
                        Log in
                    </Link>
                    <Pill href="/register" tone="forest" size="small">
                        Start free
                    </Pill>
                </div>
            </div>
        </header>
    );
}
