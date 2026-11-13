"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconChartBar, IconInbox, IconLayoutGrid, IconSettings, IconShieldCheck } from "@tabler/icons-react";

const PAGES = [
    { href: "/editor", label: "My page", icon: IconLayoutGrid },
    { href: "/analytics", label: "Analytics", icon: IconChartBar },
    { href: "/inbox", label: "Inbox", icon: IconInbox },
    { href: "/settings", label: "Settings", icon: IconSettings },
];

// Client component only because it needs the current address to show which page you're on.
// Admins (ADMIN_EMAILS) also get the reports screen.
// `unread`: new messages, shown as a count beside Inbox.
export function SidebarNav({ admin = false, unread = 0 }: { admin?: boolean; unread?: number }) {
    const pathname = usePathname();
    const pages = admin ? [...PAGES, { href: "/admin", label: "Admin", icon: IconShieldCheck }] : PAGES;

    return (
        <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto md:flex-col">
            {pages.map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                    <Link
                        key={href}
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={`flex h-10 shrink-0 items-center gap-3 rounded-xl px-3 text-[15px] font-semibold transition ${
                            active ? "bg-paper text-ink shadow-soft" : "text-muted hover:bg-paper/60 hover:text-ink"
                        }`}
                    >
                        <Icon size={19} stroke={active ? 2.2 : 1.8} />
                        {label}
                        {href === "/inbox" && unread > 0 && (
                            <span className="ml-auto rounded-full bg-pink px-1.5 py-px text-[11px] font-bold text-white" aria-label={`${unread} new`}>
                                {unread}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );
}
