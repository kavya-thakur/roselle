"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails and avatars come from any host */

import { useRef, useState, type DragEvent } from "react";
import { IconCalendarEvent, IconCopy, IconDots, IconGripVertical, IconHeading, IconPencil, IconPlus, IconStar, IconTrash } from "@tabler/icons-react";

import { LinkIcon, SocialIcon } from "@/components/SocialIcon";
import { smallInputClass } from "@/components/Field";
import { BLOCK_TYPES, newBlock } from "@/lib/pages/blocks";
import { safeHref } from "@/lib/pages/links";
import { formatNumber } from "@/lib/utils/format";
import type { Block, PageDoc } from "@/lib/validations/page";
import { AddDialog, BLOCK_ICONS } from "./AddDialog";
import { BlockForm, ScheduleFields } from "./BlockForm";
import { IconPicker, ImageInput, Label, Toggle } from "./controls";

interface ContentPanelProps {
    page: PageDoc;
    username: string;
    clicks: Record<string, number>;
    onChange: (page: PageDoc) => void;
    // the profile row is a shortcut to the Header section, where it's edited
    onEditHeader: () => void;
}

// What's on the page, top to bottom. Each block is a card you can open to edit, switch off,
// or drag by its handle (focus the handle and use the arrow keys to move it without a mouse).
export function ContentPanel({ page, username, clicks, onChange, onEditHeader }: ContentPanelProps) {
    const { blocks, profile } = page;
    const setBlocks = (next: Block[]) => onChange({ ...page, blocks: next });

    const [adding, setAdding] = useState(false);
    const [openId, setOpenId] = useState<string | null>(null);
    const [dragFrom, setDragFrom] = useState<number | null>(null);
    const [dropAt, setDropAt] = useState<number | null>(null);
    const rows = useRef<(HTMLLIElement | null)[]>([]);

    function move(from: number, to: number) {
        if (to < 0 || to >= blocks.length || from === to) return;
        const next = [...blocks];
        const [block] = next.splice(from, 1);
        next.splice(to, 0, block);
        setBlocks(next);
    }

    // new blocks go on top and open straight away, ready to fill in
    function add(block: Block) {
        setBlocks([block, ...blocks]);
        setOpenId(block.id);
    }

    const update = (block: Block) => setBlocks(blocks.map((existing) => (existing.id === block.id ? block : existing)));
    const remove = (id: string) => setBlocks(blocks.filter((block) => block.id !== id));
    const duplicate = (index: number) => setBlocks([...blocks.slice(0, index + 1), { ...blocks[index], id: crypto.randomUUID().slice(0, 8) }, ...blocks.slice(index + 1)]);

    function startDrag(event: DragEvent, index: number) {
        setDragFrom(index);
        setOpenId(null);
        event.dataTransfer.effectAllowed = "move";
        // Firefox won't start a drag without some data
        event.dataTransfer.setData("text/plain", blocks[index].id);
        const row = rows.current[index];
        if (row) event.dataTransfer.setDragImage(row, 24, 24);
    }

    const avatar = safeHref(profile.avatar);

    return (
        <div>
            {/* who the page is about; a tap goes to the Header section */}
            <button onClick={onEditHeader} className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-4 rounded-2xl p-2 text-left transition hover:bg-sand/60">
                <span className="size-16 shrink-0 overflow-hidden rounded-full bg-sand">
                    {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center font-display text-xl text-muted">{profile.name[0]?.toUpperCase() ?? "R"}</span>}
                </span>
                <span className="min-w-0">
                    <span className="block truncate text-[17px] font-semibold">{profile.name || `@${username}`}</span>
                    <span className="mt-1 flex items-center gap-2 text-muted">
                        {profile.socials.map((social) => (
                            <SocialIcon key={social.platform} platform={social.platform} size={18} />
                        ))}
                        <span className="flex size-6 items-center justify-center rounded-full bg-sand text-ink">
                            <IconPlus size={14} />
                        </span>
                    </span>
                </span>
            </button>

            <div className="mt-6 border-b border-line">
                <span className="inline-block border-b-2 border-ink pb-3 text-[15px] font-semibold">Links</span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2.5">
                <button onClick={() => add(newBlock("heading"))} className="flex h-12 items-center justify-center gap-2 rounded-full bg-sand text-[15px] font-semibold transition hover:bg-line">
                    <IconHeading size={18} /> Add heading
                </button>
                <button
                    onClick={() => setAdding(true)}
                    disabled={blocks.length >= 100}
                    className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white transition hover:bg-[#2e2e2e] disabled:opacity-50"
                >
                    <IconPlus size={18} /> Add
                </button>
            </div>

            {blocks.length === 0 && (
                <div className="mt-6 rounded-3xl border border-dashed border-line-strong px-6 py-12 text-center">
                    <p className="font-display text-2xl">Nothing here yet</p>
                    <p className="mt-1.5 text-sm text-muted">Tap Add and paste your first link. That&apos;s all it takes.</p>
                </div>
            )}

            <ol className="mt-5 space-y-3">
                {blocks.map((block, index) => (
                    <li
                        key={block.id}
                        ref={(element) => {
                            rows.current[index] = element;
                        }}
                        onDragOver={(event) => {
                            if (dragFrom === null) return;
                            event.preventDefault();
                            setDropAt(index);
                        }}
                        onDrop={(event) => {
                            event.preventDefault();
                            if (dragFrom !== null) move(dragFrom, index);
                            setDragFrom(null);
                            setDropAt(null);
                        }}
                        className={`group rounded-3xl border bg-paper transition-[border-color,opacity] ${dragFrom === index ? "opacity-40" : ""} ${dropAt === index && dragFrom !== index ? "border-ink" : "border-line"}`}
                    >
                        <BlockCard
                            block={block}
                            clicks={clicks[block.id] ?? 0}
                            open={openId === block.id}
                            onToggle={() => setOpenId(openId === block.id ? null : block.id)}
                            onChange={update}
                            onDuplicate={() => duplicate(index)}
                            onRemove={() => remove(block.id)}
                            handle={
                                <button
                                    draggable
                                    onDragStart={(event) => startDrag(event, index)}
                                    onDragEnd={() => {
                                        setDragFrom(null);
                                        setDropAt(null);
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                                            event.preventDefault();
                                            move(index, index + (event.key === "ArrowUp" ? -1 : 1));
                                        }
                                    }}
                                    aria-label="Drag to move. Or use the arrow keys."
                                    className="flex w-7 shrink-0 cursor-grab items-center justify-center text-faint opacity-60 transition group-hover:opacity-100 hover:text-ink focus-visible:opacity-100 active:cursor-grabbing"
                                >
                                    <IconGripVertical size={16} />
                                </button>
                            }
                        />
                    </li>
                ))}
            </ol>

            <AddDialog open={adding} onClose={() => setAdding(false)} onAdd={add} />
        </div>
    );
}

interface BlockCardProps {
    block: Block;
    clicks: number;
    open: boolean;
    onToggle: () => void;
    onChange: (block: Block) => void;
    onDuplicate: () => void;
    onRemove: () => void;
    handle: React.ReactNode;
}

function BlockCard({ block, clicks, open, onToggle, onChange, onDuplicate, onRemove, handle }: BlockCardProps) {
    const [menu, setMenu] = useState(false);
    const [scheduleOpen, setScheduleOpen] = useState(!!(block.startsAt || block.endsAt));
    const Icon = BLOCK_ICONS[block.type];
    const thumbnail = block.type === "link" ? safeHref(block.thumbnail) : undefined;

    // the card's two lines: what it's called, and the detail people check most
    const label = BLOCK_TYPES.find((type) => type.type === block.type)!.label;
    const title =
        block.type === "heading" || block.type === "text"
            ? block.text || "Empty"
            : block.type === "image"
              ? block.alt || "Image"
              : block.type === "map"
                ? block.title || block.address || label
                : block.title || label;
    const detail = block.type === "link" || block.type === "tip" ? `${formatNumber(clicks)} click${clicks === 1 ? "" : "s"}` : label;
    const scheduled = !!(block.startsAt || block.endsAt);

    return (
        <div>
            <div className="flex items-stretch">
                {handle}
                <button onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3.5 py-4 text-left">
                    <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-paper">
                        {thumbnail ? (
                            <img src={thumbnail} alt="" className="size-full object-cover" />
                        ) : block.type === "link" && block.icon ? (
                            <LinkIcon name={block.icon} size={20} />
                        ) : (
                            <Icon size={20} stroke={1.6} />
                        )}
                    </span>
                    <span className="min-w-0">
                        <span className={`block truncate text-[15px] font-semibold ${block.type === "heading" ? "tracking-wide uppercase" : ""}`}>{title}</span>
                        <span className="flex items-center gap-1.5 text-[13px] text-muted">
                            {detail}
                            {scheduled && <span className="rounded-full bg-sand px-1.5 py-px text-[11px] font-semibold text-ink">Scheduled</span>}
                            {block.type === "link" && block.featured && <IconStar size={12} className="fill-pink text-pink" />}
                        </span>
                    </span>
                </button>

                <div className="relative flex items-center gap-1 pr-3">
                    {/* on = visitors see it */}
                    <button
                        role="switch"
                        aria-checked={block.visible}
                        aria-label={block.visible ? "Hide from visitors" : "Show to visitors"}
                        onClick={() => onChange({ ...block, visible: !block.visible })}
                        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${block.visible ? "bg-forest" : "bg-line-strong"}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${block.visible ? "translate-x-4" : ""}`} />
                    </button>
                    <button onClick={() => setMenu(!menu)} aria-label="More" aria-expanded={menu} className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
                        <IconDots size={18} />
                    </button>

                    {menu && (
                        <>
                            {/* a click anywhere else closes the menu */}
                            <span className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
                            <div className="absolute top-11 right-2 z-20 w-44 overflow-hidden rounded-2xl border border-line bg-paper py-1.5 shadow-lifted animate-[fade-in_0.15s_ease-out]">
                                {[
                                    { label: "Edit", icon: IconPencil, action: onToggle },
                                    { label: "Duplicate", icon: IconCopy, action: onDuplicate },
                                    { label: "Delete", icon: IconTrash, action: onRemove, danger: true },
                                ].map(({ label, icon: ItemIcon, action, danger }) => (
                                    <button
                                        key={label}
                                        onClick={() => {
                                            setMenu(false);
                                            action();
                                        }}
                                        className={`flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-sand ${danger ? "text-danger" : ""}`}
                                    >
                                        <ItemIcon size={16} /> {label}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {open && (
                <div className="space-y-4 border-t border-line px-5 py-5 animate-[fade-in_0.2s_ease-out]">
                    {block.type === "link" ? (
                        <>
                            <div>
                                <Label htmlFor={`${block.id}-title`}>Title</Label>
                                <input id={`${block.id}-title`} autoFocus value={block.title} onChange={(event) => onChange({ ...block, title: event.target.value })} className={smallInputClass} />
                            </div>
                            <div>
                                <Label htmlFor={`${block.id}-url`}>URL</Label>
                                <input id={`${block.id}-url`} value={block.url} onChange={(event) => onChange({ ...block, url: event.target.value })} placeholder="https://" className={smallInputClass} />
                            </div>
                            <div>
                                <Label htmlFor={`${block.id}-thumbnail`}>Thumbnail</Label>
                                <ImageInput id={`${block.id}-thumbnail`} value={block.thumbnail} onChange={(value) => onChange({ ...block, thumbnail: value })} />
                            </div>
                            <div>
                                <Label>Icon {block.thumbnail && <span className="font-normal text-muted">(the thumbnail shows instead while there is one)</span>}</Label>
                                <IconPicker value={block.icon} onChange={(icon) => onChange({ ...block, icon })} />
                            </div>
                            <Toggle label="Highlight this link (a larger button)" checked={block.featured} onChange={(featured) => onChange({ ...block, featured })} />
                        </>
                    ) : (
                        <BlockForm block={block} onChange={onChange} />
                    )}

                    <div className="border-t border-line pt-4">
                        <button onClick={() => setScheduleOpen(!scheduleOpen)} className="flex items-center gap-2 text-sm font-semibold" aria-expanded={scheduleOpen}>
                            <IconCalendarEvent size={17} /> Schedule
                        </button>
                        {scheduleOpen && (
                            <div className="mt-3">
                                <ScheduleFields block={block} onChange={onChange} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
