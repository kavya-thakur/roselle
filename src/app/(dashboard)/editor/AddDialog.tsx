"use client";

import { useEffect, useRef, useState } from "react";
import {
    IconAlignLeft,
    IconBriefcase,
    IconChevronRight,
    IconHeading,
    IconHeartHandshake,
    IconLayoutGrid,
    IconLink,
    IconMapPin,
    IconMessageCircle,
    IconMusic,
    IconPhoto,
    IconPlayerPlay,
    IconSearch,
    IconStar,
    IconTag,
    IconX,
} from "@tabler/icons-react";

import { SocialIcon } from "@/components/SocialIcon";
import { BLOCK_TYPES, iconFromUrl, newBlock, titleFromUrl } from "@/lib/pages/blocks";
import type { Block, BlockType, Social } from "@/lib/validations/page";

export const BLOCK_ICONS: Record<BlockType, typeof IconLink> = {
    link: IconLink,
    heading: IconHeading,
    text: IconAlignLeft,
    image: IconPhoto,
    video: IconPlayerPlay,
    gallery: IconLayoutGrid,
    project: IconBriefcase,
    music: IconMusic,
    map: IconMapPin,
    tip: IconHeartHandshake,
    services: IconTag,
    contact: IconMessageCircle,
    reviews: IconStar,
};

// Ready-made links for the places people link to most: pick one, then just add your handle
const SUGGESTED: { platform: Social; title: string; hint: string; url: string }[] = [
    { platform: "instagram", title: "Instagram", hint: "Your profile, posts and reels", url: "https://instagram.com/" },
    { platform: "tiktok", title: "TikTok", hint: "Send people to your TikToks", url: "https://tiktok.com/@" },
    { platform: "youtube", title: "YouTube", hint: "Your channel or a favourite video", url: "https://youtube.com/@" },
    { platform: "spotify", title: "Spotify", hint: "An artist page, album or playlist", url: "https://open.spotify.com/" },
    { platform: "x", title: "X", hint: "Your profile on X", url: "https://x.com/" },
    { platform: "linkedin", title: "LinkedIn", hint: "Your professional profile", url: "https://linkedin.com/in/" },
    { platform: "website", title: "Website", hint: "Your own site or shop", url: "https://" },
    { platform: "email", title: "Email", hint: "Let people write to you", url: "mailto:" },
];

// The "Add" window: paste a link and press Enter, or pick what kind of block to add.
// A native <dialog>, so Esc, the backdrop and keeping focus inside come for free.
export function AddDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (block: Block) => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        const dialog = ref.current!;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    function add(block: Block) {
        onAdd(block);
        setQuery("");
        onClose();
    }

    // something that looks like an address is a link to add; anything else filters the list
    const looksLikeLink = /^(https?:\/\/|mailto:|[\w-]+\.[a-z]{2,})/i.test(query.trim());
    const suggestions = SUGGESTED.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));

    return (
        <dialog
            ref={ref}
            onClose={onClose}
            // a click on the dialog element itself (not its content) is a click on the backdrop
            onClick={(event) => event.target === ref.current && onClose()}
            className="popup m-auto w-[min(860px,calc(100%-24px))] max-w-none rounded-[2rem] bg-paper p-0 text-ink shadow-lifted"
        >
            <div className="relative border-b border-line px-6 py-5 text-center">
                <h2 className="text-lg font-semibold">Add</h2>
                <button onClick={onClose} aria-label="Close" className="absolute top-1/2 right-5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand">
                    <IconX size={20} />
                </button>
            </div>

            <div className="max-h-[70dvh] overflow-y-auto px-6 pt-5 pb-7 sm:px-10">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (looksLikeLink) add({ ...newBlock("link"), title: titleFromUrl(query), url: query.trim(), icon: iconFromUrl(query) } as Block);
                    }}
                    className="flex h-13 items-center gap-3 rounded-full bg-sand px-5"
                >
                    <IconSearch size={20} className="shrink-0 text-muted" />
                    <input
                        autoFocus
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Paste a link or search…"
                        aria-label="Paste a link or search"
                        className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
                    />
                    {looksLikeLink && (
                        <button type="submit" className="h-9 shrink-0 rounded-full bg-ink px-4 text-sm font-semibold text-white">
                            Add link
                        </button>
                    )}
                </form>

                <div className="mt-6 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                    {BLOCK_TYPES.map(({ type, label }) => {
                        const Icon = BLOCK_ICONS[type];
                        return (
                            <button key={type} onClick={() => add(newBlock(type))} className="flex h-24 flex-col justify-between rounded-2xl bg-sand/70 p-3.5 text-left transition hover:bg-sand">
                                <span className="text-[15px] font-medium">{label}</span>
                                <Icon size={20} stroke={1.6} />
                            </button>
                        );
                    })}
                </div>

                <p className="mt-7 mb-2 text-sm font-semibold">Suggested</p>
                <ul>
                    {suggestions.map((item) => (
                        <li key={item.platform}>
                            <button
                                onClick={() => add({ ...newBlock("link"), title: item.title, url: item.url, icon: item.platform } as Block)}
                                className="flex w-full items-center gap-4 rounded-2xl px-2 py-3 text-left transition hover:bg-sand/70"
                            >
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-sand">
                                    <SocialIcon platform={item.platform} size={20} />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[15px] font-medium">{item.title}</span>
                                    <span className="block text-[13px] text-muted">{item.hint}</span>
                                </span>
                                <IconChevronRight size={18} className="text-faint" />
                            </button>
                        </li>
                    ))}
                    {suggestions.length === 0 && !looksLikeLink && <p className="px-2 py-3 text-sm text-muted">Nothing called that. Paste a link to add it.</p>}
                </ul>
            </div>
        </dialog>
    );
}
