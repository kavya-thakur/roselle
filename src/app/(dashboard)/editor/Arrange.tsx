"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { IconArrowDown, IconArrowUp, IconEye, IconEyeOff, IconGripVertical, IconPhoto } from "@tabler/icons-react";

import { PageRenderer } from "@/components/PageRenderer";
import { BLOCK_TYPES } from "@/lib/pages/blocks";
import type { PublicReview } from "@/lib/reviews";
import type { Block, PageDoc } from "@/lib/validations/page";
import { PhotoGrid } from "./controls";
import { moved, useSortable } from "./sortable";

// The preview's Arrange mode: the real page, full size, with a small bar over each block to drag
// it (or step it up and down), hide it, and, for a gallery or a case study, put its photos in
// order right there. For pages with many photos and blocks, where the list in the panel is too
// far from what visitors will see.
export function ArrangeView({ page, onChange, reviews }: { page: PageDoc; onChange: Dispatch<SetStateAction<PageDoc>>; reviews: PublicReview[] }) {
    const setBlocks = (change: (blocks: Block[]) => Block[]) => onChange((current) => ({ ...current, blocks: change(current.blocks) }));
    const move = (from: number, to: number) => {
        if (to >= 0 && to < page.blocks.length) setBlocks((blocks) => moved(blocks, from, to));
    };
    const sortable = useSortable(move);
    // the block whose photos are open
    const [photosOf, setPhotosOf] = useState<string | null>(null);

    return (
        <PageRenderer
            page={page}
            mode="preview"
            reviews={reviews}
            // arranging is about the blocks; the foot of the page is left out
            badge={false}
            wrap={(block, index, view) => {
                const label = BLOCK_TYPES.find((type) => type.type === block.type)?.label ?? "Block";
                const photos = "images" in block ? block.images : null;
                const active = sortable.dragging === index;
                return (
                    <div ref={sortable.item(index)} className={`relative rounded-2xl transition-[box-shadow,transform] ${active ? "z-10 scale-[1.01] shadow-lifted ring-2 ring-pink" : "ring-1 ring-black/10"}`}>
                        {/* the app's own look, not the page's: dark on any theme */}
                        <div className="relative z-20 mb-1.5 flex items-center gap-0.5 rounded-full bg-ink/90 p-1 font-sans text-white shadow-soft backdrop-blur-sm">
                            <button {...sortable.handle(index)} aria-label={`Drag ${label} to move it`} className="flex size-8 cursor-grab items-center justify-center rounded-full bg-white/15 active:cursor-grabbing">
                                <IconGripVertical size={16} />
                            </button>
                            <span className="min-w-0 flex-1 truncate px-1.5 text-xs font-semibold">{label}</span>
                            {photos && (
                                <button
                                    onClick={() => setPhotosOf(photosOf === block.id ? null : block.id)}
                                    aria-expanded={photosOf === block.id}
                                    className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold ${photosOf === block.id ? "bg-white text-ink" : "hover:bg-white/15"}`}
                                >
                                    <IconPhoto size={15} /> {photos.length}
                                </button>
                            )}
                            <button onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Move up" className="flex size-8 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30">
                                <IconArrowUp size={16} />
                            </button>
                            <button onClick={() => move(index, index + 1)} disabled={index === page.blocks.length - 1} aria-label="Move down" className="flex size-8 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-30">
                                <IconArrowDown size={16} />
                            </button>
                            <button
                                onClick={() => setBlocks((blocks) => blocks.map((existing) => (existing.id === block.id ? { ...existing, visible: !existing.visible } : existing)))}
                                aria-label={block.visible ? "Hide from visitors" : "Show to visitors"}
                                title={block.visible ? "Hide from visitors" : "Show to visitors"}
                                className="flex size-8 items-center justify-center rounded-full hover:bg-white/15"
                            >
                                {block.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                            </button>
                        </div>

                        {photos && photosOf === block.id && (
                            <div className="relative z-20 mb-2 rounded-2xl bg-paper p-2.5 font-sans text-ink shadow-soft">
                                {photos.length ? (
                                    <>
                                        <PhotoGrid
                                            images={photos}
                                            onChange={(update) => setBlocks((blocks) => blocks.map((existing) => (existing.id === block.id && "images" in existing ? { ...existing, images: update(existing.images) } : existing)))}
                                        />
                                        <p className="mt-2 text-xs text-muted">Drag a photo by its handle; the page below follows.</p>
                                    </>
                                ) : (
                                    <p className="text-xs text-muted">No photos yet. Add them in the Content panel.</p>
                                )}
                            </div>
                        )}

                        {view}
                    </div>
                );
            }}
        />
    );
}
