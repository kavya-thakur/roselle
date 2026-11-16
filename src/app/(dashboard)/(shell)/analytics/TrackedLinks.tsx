"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "@tabler/icons-react";

import { LinkIcon } from "@/components/SocialIcon";
import { toast } from "@/components/Toast";
import { TAGGED_LINKS } from "@/lib/analytics/sources";

// The page address with a short tag for each place it's shared (?via=whatsapp). WhatsApp, email
// and most apps don't say where a visitor came from; a tagged link does, so "Where they come
// from" can show it, and which of those places bring enquiries.
export function TrackedLinks({ username }: { username: string }) {
    const [copied, setCopied] = useState<string | null>(null);

    async function copy(tag: string, name: string) {
        // the address the app is served at, read on click: the server doesn't know it
        await navigator.clipboard.writeText(`${window.location.origin}/${username}?via=${tag}`);
        setCopied(tag);
        toast(`${name} link copied`, { detail: "Visits through it will show up under that name." });
        setTimeout(() => setCopied((current) => (current === tag ? null : current)), 1800);
    }

    return (
        <section className="mt-3 rounded-3xl bg-paper p-5 shadow-soft sm:p-6">
            <h2 className="text-lg font-semibold">Links that tell you where people come from</h2>
            <p className="mt-1 text-sm text-muted">
                WhatsApp, email and many apps hide where a visit came from. Share the link made for each place and you&apos;ll see it above. Your QR code is already tagged.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {TAGGED_LINKS.map((link) => (
                    <li key={link.tag} className="flex min-w-0 items-center gap-3 rounded-2xl border border-line p-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sand">
                            <LinkIcon name={link.icon} size={19} />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold">{link.name}</span>
                            <span className="block truncate text-xs text-muted">
                                {/* no host: on a phone it would push the part that matters out of sight */}/{username}
                                <span className="font-semibold text-ink">?via={link.tag}</span>
                            </span>
                        </span>
                        <button
                            onClick={() => copy(link.tag, link.name)}
                            aria-label={`Copy your ${link.name} link`}
                            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold transition ${copied === link.tag ? "bg-success text-white" : "bg-ink text-white hover:bg-[#2e2e2e]"}`}
                        >
                            {copied === link.tag ? <IconCheck size={15} /> : <IconCopy size={15} />}
                            {copied === link.tag ? "Copied" : "Copy"}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}
