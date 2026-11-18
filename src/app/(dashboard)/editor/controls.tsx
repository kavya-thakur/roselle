"use client";
/* eslint-disable @next/next/no-img-element -- photos come from any host */

import { useRef, useState, type ReactNode } from "react";
import { IconArrowLeft, IconArrowRight, IconBan, IconCrop, IconGripVertical, IconLoader2, IconPhoto, IconPhotoUp, IconPlus, IconTrash } from "@tabler/icons-react";

import { smallInputClass } from "@/components/Field";
import { LinkIcon } from "@/components/SocialIcon";
import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";
import { LINK_ICONS, type LinkIconName } from "@/lib/validations/page";
import { safeHref } from "@/lib/pages/links";
import { sized } from "@/lib/media/sized";
import { moved, useSortable } from "./sortable";
import { PhotoEditor, rememberEdit, type Edit } from "./PhotoEditor";
import { useBackToClose } from "@/components/useBackToClose";

// The small building blocks the editor's three panels share

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
    return (
        <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-muted">
            {children}
        </label>
    );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            {label}
            {/* a real checkbox, so it works with the keyboard and screen readers; the pill is just its look */}
            <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
            <span className="relative h-5 w-9 shrink-0 rounded-full bg-line-strong transition peer-checked:bg-forest peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-forest after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-4" />
        </label>
    );
}

// A row of options where exactly one is chosen: "Solid | Gradient | Glow"
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; label: string }) {
    return (
        <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-sand p-0.5">
            {options.map((option) => (
                <button
                    key={option.value}
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`h-8 flex-1 rounded-md text-[13px] font-semibold transition ${value === option.value ? "bg-paper text-ink shadow-soft" : "text-muted hover:text-ink"}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

// Phone photos are 5-15 MB and 4000+ pixels wide: far more than a page shows, and over the 4 MB
// upload limit. Pictures larger than 1800px (or 1 MB) are redrawn at that size in the browser
// first, which makes them about a tenth of the size and keeps pages fast. 1800px is still sharp
// full screen on a laptop (the lightbox). GIFs are left alone (redrawing would stop the animation).
const LONGEST_SIDE = 1800;
const MAX_UPLOAD = 4 * 1024 * 1024;
// what the server takes; anything else (an iPhone's HEIC) has to be redrawn as one of these
const WEB_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

// Draws the file through an <img>, not createImageBitmap: phones decode huge photos into an
// <img> without running out of memory, it follows the photo's rotation, and Safari reads HEIC
async function decode(file: File) {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
    } catch {
        return null;
    } finally {
        // decode() has finished with the file by now, and drawImage reads the decoded picture
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

const toBlob = (canvas: HTMLCanvasElement, type: string) => new Promise<Blob | null>((done) => canvas.toBlob(done, type, 0.86));

async function shrink(file: File) {
    if (file.type === "image/gif") return file;
    const webType = WEB_TYPES.includes(file.type);

    const image = await decode(file);
    if (!image) {
        throw new Error(webType ? "This file looks damaged or isn't really a photo. Try exporting it again." : "This photo's format can't be opened here. Save it as a JPG or PNG and try again.");
    }

    const scale = Math.min(1, LONGEST_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
    if (webType && scale === 1 && file.size < 1_000_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Safari can't write WebP: asked for it, it quietly hands back a PNG several times the size.
    // So check what came back, and use a JPG when it isn't WebP.
    let blob = await toBlob(canvas, "image/webp");
    if (blob?.type !== "image/webp") blob = await toBlob(canvas, "image/jpeg");
    if (!blob) return file;

    const smaller = blob.size < file.size || !webType;
    return smaller ? new File([blob], file.name.replace(/\.\w+$/, "") + (blob.type === "image/webp" ? ".webp" : ".jpg"), { type: blob.type }) : file;
}

// Sends a picture to our media store and answers with its address (/media/...). Problems the
// server would only refuse after a long upload are caught here first, with a reason people can act on.
export async function uploadImage(original: File) {
    if (!original.type.startsWith("image/") && !/\.(heic|heif)$/i.test(original.name)) {
        throw new Error("That isn't a photo. Choose a JPG, PNG, WebP or GIF.");
    }
    const file = await shrink(original);
    if (file.size > MAX_UPLOAD) {
        throw new Error(
            file.type === "image/gif"
                ? `This GIF is ${(file.size / 1024 / 1024).toFixed(1)} MB; GIFs can be up to 4 MB. Try a shorter or smaller one.`
                : `This photo is still ${(file.size / 1024 / 1024).toFixed(1)} MB after resizing; the limit is 4 MB. Try exporting it smaller.`,
        );
    }
    const form = new FormData();
    form.append("file", file);
    const { url } = await api<{ url: string }>("/media", { method: "POST", body: form });
    return url;
}

// An image address: paste one, or upload a file and get our own /media/... address back
export function ImageInput({ id, value, onChange, placeholder = "https://… or upload" }: { id: string; value: string; onChange: (url: string) => void; placeholder?: string }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // crop & rotate: the photo already here, the result uploaded as a new one
    const [editing, setEditing] = useState(false);
    useBackToClose(editing, () => setEditing(false));

    async function upload(file: File, edit?: Edit) {
        setUploading(true);
        setError(null);
        try {
            const url = await uploadImage(file);
            if (edit) rememberEdit(url, edit);
            onChange(url);
        } catch (uploadError) {
            setError((uploadError as Error).message);
        } finally {
            setUploading(false);
        }
    }

    return (
        <div>
            <div className="flex gap-1.5">
                <input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={smallInputClass} />
                <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    aria-label="Upload an image"
                    title="Upload an image"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50"
                >
                    {uploading ? <IconLoader2 size={16} className="animate-spin" /> : <IconPhotoUp size={16} />}
                </button>
                {safeHref(value) && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        disabled={uploading}
                        aria-label="Crop or rotate"
                        title="Crop or rotate"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-paper text-muted transition hover:border-line-strong hover:text-ink disabled:opacity-50"
                    >
                        <IconCrop size={16} />
                    </button>
                )}
                {editing && (
                    <PhotoEditor
                        source={value}
                        onCancel={() => setEditing(false)}
                        onDone={(file, edit) => {
                            setEditing(false);
                            upload(file, edit);
                        }}
                    />
                )}
                <input
                    ref={fileRef}
                    type="file"
                    accept={ACCEPT}
                    hidden
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) upload(file);
                        // so choosing the same file again still counts as a change
                        event.target.value = "";
                    }}
                />
            </div>
            {error && (
                <p role="alert" className="mt-1 text-xs text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

// <input type="datetime-local"> speaks the visitor's local time ("2026-11-12T18:30"), the page
// stores ISO time (UTC); these two convert between them
export const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const date = new Date(iso);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};
export const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null);

// One setting per line: what it is on the left, the control on the right
export function FieldRow({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string; children: ReactNode }) {
    return (
        <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="sm:w-36 sm:shrink-0 sm:pt-2.5">
                <label htmlFor={htmlFor} className="text-[15px] font-semibold">
                    {label}
                </label>
                {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
            </div>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

// A choice shown as small pictures with a name under each: "Fill", "Gradient", "Photo"
export function StyleTiles<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; preview: ReactNode }[]; onChange: (value: T) => void; label: string }) {
    return (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {options.map((option) => (
                <button
                    key={option.value}
                    role="radio"
                    aria-checked={value === option.value}
                    onClick={() => onChange(option.value)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border bg-paper p-2 pb-2.5 text-[13px] font-medium transition ${
                        value === option.value ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong"
                    }`}
                >
                    <span className="flex h-14 w-full items-center justify-center overflow-hidden rounded-xl bg-sand">{option.preview}</span>
                    {option.label}
                </button>
            ))}
        </div>
    );
}

// A colour as Linktree-style pill: the swatch and its hex, opening the browser's own picker
export function ColorPill({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
    return (
        <label className="flex h-11 w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-paper pr-4 pl-1.5 transition hover:border-line-strong">
            <input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
            <span className="font-mono text-sm uppercase">{value}</span>
        </label>
    );
}

// The icon a link button wears: a grid of small squares, the first one meaning "none"
export function IconPicker({ value, onChange }: { value: LinkIconName | ""; onChange: (icon: LinkIconName | "") => void }) {
    const options: (LinkIconName | "")[] = ["", ...LINK_ICONS];
    return (
        <div role="radiogroup" aria-label="Icon" className="grid grid-cols-8 gap-1">
            {options.map((name) => (
                <button
                    key={name || "none"}
                    role="radio"
                    aria-checked={value === name}
                    aria-label={name || "No icon"}
                    title={name || "No icon"}
                    onClick={() => onChange(name)}
                    className={`flex aspect-square items-center justify-center rounded-lg transition ${value === name ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink"}`}
                >
                    {name ? <LinkIcon name={name} size={17} /> : <IconBan size={17} stroke={1.6} />}
                </button>
            ))}
        </div>
    );
}

// HEIC is left out on purpose: then iPhones hand over a JPG copy of their HEIC photos
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";

// The list with item `i` one place earlier: how short lists (photos, services) are reordered
export const moveUp = <T,>(list: T[], i: number) => list.map((_, j) => list[j === i - 1 ? i : j === i ? i - 1 : j]);

// A list of pictures (a gallery, a case study): add many at once by uploading several files,
// or paste addresses one by one; each has a description for screen readers and the full-screen view
type Picture = { src: string; alt: string };

// Every change is a function of the latest list, because uploads finish one at a time while the
// creator may be typing descriptions or removing pictures
export function ImageListField({ id, images, max, onChange }: { id: string; images: Picture[]; max: number; onChange: (update: (images: Picture[]) => Picture[]) => void }) {
    const fileRef = useRef<HTMLInputElement>(null);
    // the photo whose details are open under the grid
    const [open, setOpen] = useState<number | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // one after another, so the order is the order they were picked in, and each one that
    // arrives shows up straight away
    async function uploadAll(files: File[]) {
        setError(null);
        const room = files.slice(0, max - images.length);
        const failed: string[] = [];
        let added = 0;
        for (const [i, file] of room.entries()) {
            setProgress(`Uploading ${i + 1} of ${room.length}…`);
            try {
                const src = await uploadImage(file);
                onChange((current) => (current.length < max ? [...current, { src, alt: "" }] : current));
                added += 1;
            } catch (uploadError) {
                failed.push(`${file.name}: ${(uploadError as Error).message}`);
            }
        }
        if (files.length > room.length) failed.push(`Only ${max} pictures fit, so the last ${files.length - room.length} were left out.`);
        // every problem, one per line, so nobody has to guess which photos are missing
        setError(failed.length ? failed.join("\n") : null);
        setProgress(null);
        if (added && failed.length) toast.error(`${added} of ${room.length} photos added`, "The ones that didn't upload are listed under the photos, with the reason.");
        else if (added) toast(`${added} photo${added === 1 ? "" : "s"} added`, { detail: "Add a short description to each, for screen readers and the full-screen view." });
        else if (failed.length) toast.error(room.length === 1 ? "That photo didn't upload" : "None of those photos uploaded", failed[0]);
    }

    const setImage = (i: number, patch: Partial<Picture>) => onChange((current) => current.map((image, j) => (j === i ? { ...image, ...patch } : image)));

    const chosen = open !== null && open < images.length ? open : null;
    const moveTo = (to: number) => {
        onChange((current) => moved(current, chosen!, to));
        setOpen(to);
    };

    return (
        <div className="space-y-2.5">
            <PhotoGrid images={images} onChange={onChange} open={chosen} onOpen={(i) => setOpen(chosen === i ? null : i)} />

            {/* the chosen photo: its address, its description, and moving or removing it */}
            {chosen !== null && (
                <div className="space-y-1.5 rounded-xl bg-sand/60 p-2.5 animate-[fade-in_0.15s_ease-out]">
                    <p className="text-xs font-semibold text-muted">Photo {chosen + 1}</p>
                    <ImageInput id={`${id}-image-${chosen}`} value={images[chosen].src} onChange={(src) => setImage(chosen, { src })} />
                    <input value={images[chosen].alt} onChange={(event) => setImage(chosen, { alt: event.target.value })} placeholder="Description, for screen readers" aria-label="Image description" className={smallInputClass} />
                    <div className="flex gap-1 pt-0.5">
                        <button type="button" onClick={() => moveTo(chosen - 1)} disabled={chosen === 0} className="flex h-8 items-center gap-1 rounded-full bg-paper px-3 text-xs font-semibold disabled:opacity-40">
                            <IconArrowLeft size={14} /> Earlier
                        </button>
                        <button type="button" onClick={() => moveTo(chosen + 1)} disabled={chosen === images.length - 1} className="flex h-8 items-center gap-1 rounded-full bg-paper px-3 text-xs font-semibold disabled:opacity-40">
                            Later <IconArrowRight size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onChange((current) => current.filter((_, j) => j !== chosen));
                                setOpen(null);
                            }}
                            className="ml-auto flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold text-danger hover:bg-paper"
                        >
                            <IconTrash size={14} /> Remove
                        </button>
                    </div>
                </div>
            )}

            {images.length < max && (
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={!!progress} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-[#2e2e2e] disabled:opacity-60">
                        {progress ? <IconLoader2 size={15} className="animate-spin" /> : <IconPhotoUp size={15} />}
                        {progress ?? "Upload photos"}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onChange((current) => [...current, { src: "", alt: "" }]);
                            setOpen(images.length);
                        }}
                        className="flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-pink hover:bg-sand">
                        <IconPlus size={14} /> Add by address
                    </button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept={ACCEPT}
                        multiple
                        hidden
                        onChange={(event) => {
                            const files = [...(event.target.files ?? [])];
                            event.target.value = "";
                            if (files.length) uploadAll(files);
                        }}
                    />
                </div>
            )}
            <p className="text-xs text-muted">
                {images.length} of {max}. Pick several at once; big photos are made web-sized for you.{images.length > 1 && " Drag a photo by its handle to reorder; tap one to edit it."}
            </p>
            {error && (
                <p role="alert" className="rounded-lg bg-blush px-3 py-2 text-xs whitespace-pre-line text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

// The photos as a grid of thumbnails in page order, each dragged by the handle in its corner
// (a mouse or a finger). Tapping one opens it (onOpen). The editor's photo lists and the
// preview's Arrange mode both use it.
export function PhotoGrid({ images, onChange, open, onOpen }: { images: Picture[]; onChange: (update: (images: Picture[]) => Picture[]) => void; open?: number | null; onOpen?: (i: number) => void }) {
    const sortable = useSortable((from, to) => onChange((current) => moved(current, from, to)));
    if (images.length === 0) return null;

    return (
        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((image, i) => {
                const src = safeHref(image.src);
                return (
                    <li
                        key={i}
                        ref={sortable.item(i)}
                        className={`relative aspect-square overflow-hidden rounded-xl bg-sand transition-[transform,box-shadow] ${sortable.dragging === i ? "z-10 scale-105 shadow-lifted ring-2 ring-ink" : open === i ? "ring-2 ring-pink" : ""}`}
                    >
                        <button type="button" onClick={() => onOpen?.(i)} aria-label={`Photo ${i + 1}${image.alt ? `: ${image.alt}` : ""}`} className="size-full">
                            {src ? <img src={sized(src, 300)} alt="" draggable={false} className="size-full object-cover" /> : <IconPhoto size={22} className="m-auto text-faint" />}
                        </button>
                        <span className="pointer-events-none absolute bottom-1 left-1 rounded-full bg-black/55 px-1.5 text-[10px] font-semibold text-white tabular-nums">{i + 1}</span>
                        <button
                            type="button"
                            {...sortable.handle(i)}
                            aria-label={`Drag photo ${i + 1} to move it`}
                            className="absolute top-1 right-1 flex size-8 cursor-grab items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm active:cursor-grabbing"
                        >
                            <IconGripVertical size={15} />
                        </button>
                    </li>
                );
            })}
        </ol>
    );
}
