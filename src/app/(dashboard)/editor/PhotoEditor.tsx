"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { IconFlipHorizontal, IconLoader2, IconRotate2, IconRotateClockwise2, IconX } from "@tabler/icons-react";

import { sized } from "@/lib/media/sized";

// Crop, rotate and flip a photo before it goes on the page, drawn on a canvas in the browser:
// no library, and the server only ever sees the finished picture.
// The crop box is kept as fractions (0-1) of the turned photo, so it doesn't care how big the
// photo is on screen; it's dragged to move it and by its corners to resize it.
// Whoever opens it also wires the Back gesture to close it (useBackToClose): it can't do that
// itself, as it's always open while it exists.

type Box = { x: number; y: number; w: number; h: number };
type Corner = "nw" | "ne" | "sw" | "se";

const ASPECTS = [
    { label: "Free", value: null },
    { label: "Square", value: 1 },
    { label: "4:5", value: 4 / 5 },
    { label: "3:2", value: 3 / 2 },
    { label: "16:9", value: 16 / 9 },
] as const;
const WHOLE: Box = { x: 0, y: 0, w: 1, h: 1 };
// the smallest crop, as a fraction of a side, so the box can't vanish under a finger
const MIN = 0.08;
// as big as uploads get anyway (controls.tsx, LONGEST_SIDE)
const LONGEST_SIDE = 1800;

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

// The largest box of this shape (width/height in pixels) that fits, centred
function fitted(aspect: number | null, width: number, height: number): Box {
    if (!aspect) return WHOLE;
    const w = Math.min(1, (aspect * height) / width);
    const h = Math.min(1, width / aspect / height);
    return { x: (1 - w) / 2, y: (1 - h) / 2, w, h };
}

async function load(source: File | string) {
    const image = new Image();
    // a photo from another address (Cloudinary, Unsplash) has to allow it, or the canvas won't hand its pixels back
    image.crossOrigin = "anonymous";
    image.src = typeof source === "string" ? sized(source, LONGEST_SIDE, "jpg") : URL.createObjectURL(source);
    await image.decode();
    return image;
}

export function PhotoEditor({ source, onDone, onCancel }: { source: File | string; onDone: (file: File) => void; onCancel: () => void }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const frame = useRef<HTMLDivElement>(null);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [failed, setFailed] = useState(false);
    const [turns, setTurns] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [aspect, setAspect] = useState<number | null>(null);
    const [box, setBox] = useState<Box>(WHOLE);
    const drag = useRef<{ kind: "move" | Corner; x: number; y: number; start: Box } | null>(null);

    useEffect(() => {
        dialog.current?.showModal();
        load(source).then(setImage, () => setFailed(true));
    }, [source]);

    // the photo turned a quarter at a time: on its side, its width and height swap
    const sideways = turns % 2 === 1;
    const width = image ? (sideways ? image.naturalHeight : image.naturalWidth) : 1;
    const height = image ? (sideways ? image.naturalWidth : image.naturalHeight) : 1;

    // the turned, flipped photo, drawn at up to LONGEST_SIDE; the crop is cut from this
    useEffect(() => {
        const target = canvas.current;
        if (!image || !target) return;
        const scale = Math.min(1, LONGEST_SIDE / Math.max(width, height));
        target.width = Math.round(width * scale);
        target.height = Math.round(height * scale);
        const context = target.getContext("2d")!;
        context.save();
        context.translate(target.width / 2, target.height / 2);
        context.rotate((turns * Math.PI) / 2);
        if (flipped) context.scale(-1, 1);
        const [drawWidth, drawHeight] = [image.naturalWidth * scale, image.naturalHeight * scale];
        context.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        context.restore();
    }, [image, turns, flipped, width, height]);

    function turn(step: 1 | -1) {
        setTurns((current) => (current + step + 4) % 4);
        // the box no longer means the same part of the photo; start again with the chosen shape
        setBox(fitted(aspect, height, width));
    }

    function chooseAspect(value: number | null) {
        setAspect(value);
        setBox(fitted(value, width, height));
    }

    function startDrag(event: PointerEvent, kind: "move" | Corner) {
        event.stopPropagation();
        (event.target as HTMLElement).setPointerCapture(event.pointerId);
        drag.current = { kind, x: event.clientX, y: event.clientY, start: box };
    }

    function onMove(event: PointerEvent) {
        const current = drag.current;
        const area = frame.current?.getBoundingClientRect();
        if (!current || !area) return;
        const dx = (event.clientX - current.x) / area.width;
        const dy = (event.clientY - current.y) / area.height;
        const { start } = current;

        if (current.kind === "move") {
            setBox({ ...start, x: clamp(start.x + dx, 0, 1 - start.w), y: clamp(start.y + dy, 0, 1 - start.h) });
            return;
        }

        // the corner opposite the one held stays where it is
        const west = current.kind.includes("w");
        const north = current.kind.includes("n");
        const right = start.x + start.w;
        const bottom = start.y + start.h;
        let w = clamp(west ? start.w - dx : start.w + dx, MIN, west ? right : 1 - start.x);
        let h = clamp(north ? start.h - dy : start.h + dy, MIN, north ? bottom : 1 - start.y);
        if (aspect) {
            // keep the shape: follow whichever side moved more, within the room there is
            const ratio = (aspect * height) / width;
            const roomW = west ? right : 1 - start.x;
            const roomH = north ? bottom : 1 - start.y;
            if (w / ratio > h) h = w / ratio;
            else w = h * ratio;
            if (w > roomW) [w, h] = [roomW, roomW / ratio];
            if (h > roomH) [w, h] = [roomH * ratio, roomH];
        }
        setBox({ x: west ? right - w : start.x, y: north ? bottom - h : start.y, w, h });
    }

    async function done() {
        const source = canvas.current!;
        const out = document.createElement("canvas");
        out.width = Math.round(box.w * source.width);
        out.height = Math.round(box.h * source.height);
        out.getContext("2d")!.drawImage(source, box.x * source.width, box.y * source.height, out.width, out.height, 0, 0, out.width, out.height);
        // a JPG: every browser can write one (Safari can't write WebP), and photos are what this is for
        const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, "image/jpeg", 0.9));
        if (blob) onDone(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    }

    const corners: Corner[] = ["nw", "ne", "sw", "se"];

    return (
        <dialog
            ref={dialog}
            onCancel={(event) => {
                event.preventDefault();
                onCancel();
            }}
            aria-label="Edit photo"
            className="popup m-auto h-[min(720px,calc(100dvh-24px))] w-[min(560px,calc(100%-24px))] overflow-hidden rounded-[2rem] bg-paper p-0 text-ink shadow-lifted"
        >
            <div className="flex h-full flex-col">
                <div className="flex h-14 shrink-0 items-center justify-between px-4">
                    <h2 className="text-[15px] font-semibold">Crop & rotate</h2>
                    <button onClick={onCancel} aria-label="Close without saving" className="flex size-9 items-center justify-center rounded-full bg-sand hover:bg-line">
                        <IconX size={17} />
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#1b1b1b] p-4" onPointerMove={onMove} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
                    {failed ? (
                        <p className="max-w-xs text-center text-sm text-white/80">This photo can&apos;t be edited here (its website doesn&apos;t allow it). Upload the photo from your device to crop or rotate it.</p>
                    ) : !image ? (
                        <IconLoader2 size={24} className="animate-spin text-white/70" />
                    ) : (
                        <div ref={frame} className="relative max-h-full touch-none select-none" style={{ aspectRatio: `${width} / ${height}`, width: `min(100%, calc((min(720px, 100dvh - 24px) - 14rem) * ${width / height}))` }}>
                            <canvas ref={canvas} className="block size-full" />
                            {/* the dimmed outside, the crop itself, its thirds and corners */}
                            <div
                                onPointerDown={(event) => startDrag(event, "move")}
                                className="absolute cursor-move border-2 border-white shadow-[0_0_0_9999px_rgb(0_0_0/0.55)]"
                                style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }}
                            >
                                <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_33.2%,rgb(255_255_255/0.4)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/0.4)_66.6%,transparent_66.8%),linear-gradient(to_bottom,transparent_33.2%,rgb(255_255_255/0.4)_33.3%,transparent_33.5%,transparent_66.5%,rgb(255_255_255/0.4)_66.6%,transparent_66.8%)]" />
                                {corners.map((corner) => (
                                    <span
                                        key={corner}
                                        onPointerDown={(event) => startDrag(event, corner)}
                                        aria-hidden
                                        className={`absolute size-7 ${corner.includes("n") ? "-top-3.5" : "-bottom-3.5"} ${corner.includes("w") ? "-left-3.5" : "-right-3.5"} ${corner === "nw" || corner === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`}
                                    >
                                        <span className="absolute inset-2 rounded-full border-2 border-ink bg-white" />
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="shrink-0 space-y-3 px-4 pt-3 pb-4">
                    <div role="radiogroup" aria-label="Shape" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                        {ASPECTS.map((option) => (
                            <button
                                key={option.label}
                                role="radio"
                                aria-checked={aspect === option.value}
                                onClick={() => chooseAspect(option.value)}
                                disabled={!image}
                                className={`h-8 shrink-0 rounded-full px-3.5 text-[13px] font-semibold transition ${aspect === option.value ? "bg-ink text-white" : "bg-sand hover:bg-line"}`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => turn(-1)} disabled={!image} aria-label="Rotate left" title="Rotate left" className="flex size-10 items-center justify-center rounded-full bg-sand hover:bg-line disabled:opacity-40">
                            <IconRotate2 size={18} />
                        </button>
                        <button onClick={() => turn(1)} disabled={!image} aria-label="Rotate right" title="Rotate right" className="flex size-10 items-center justify-center rounded-full bg-sand hover:bg-line disabled:opacity-40">
                            <IconRotateClockwise2 size={18} />
                        </button>
                        <button onClick={() => setFlipped(!flipped)} disabled={!image} aria-pressed={flipped} aria-label="Flip" title="Flip (mirror)" className="flex size-10 items-center justify-center rounded-full bg-sand hover:bg-line disabled:opacity-40">
                            <IconFlipHorizontal size={18} />
                        </button>
                        <button
                            onClick={() => {
                                setTurns(0);
                                setFlipped(false);
                                chooseAspect(null);
                            }}
                            disabled={!image}
                            className="h-10 rounded-full px-3 text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-40"
                        >
                            Reset
                        </button>
                        <button onClick={done} disabled={!image} className="ml-auto h-10 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-[#2e2e2e] disabled:opacity-40">
                            Save photo
                        </button>
                    </div>
                </div>
            </div>
        </dialog>
    );
}
