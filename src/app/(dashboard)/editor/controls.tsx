"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconArrowUp, IconBan, IconLoader2, IconPhotoUp, IconPlus, IconX } from "@tabler/icons-react";

import { smallInputClass } from "@/components/Field";
import { LinkIcon } from "@/components/SocialIcon";
import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";
import { LINK_ICONS, type LinkIconName } from "@/lib/validations/page";

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
// upload limit. Pictures larger than 1800px (or 1 MB) are redrawn at that size as WebP in the
// browser first, which makes them about a tenth of the size, keeps pages fast and the free
// database small. GIFs are left alone (redrawing would stop the animation), and so is anything
// the redraw wouldn't make smaller. 1800px is still sharp full screen on a laptop (the
// lightbox), and a third the weight of 2400px on a phone, which shows a page 400px wide.
const LONGEST_SIDE = 1800;

async function shrink(file: File) {
    if (file.type === "image/gif") return file;
    const bitmap = await createImageBitmap(file).catch(() => null);
    if (!bitmap) return file;

    const scale = Math.min(1, LONGEST_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_000_000) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((done) => canvas.toBlob(done, "image/webp", 0.86));

    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" }) : file;
}

// Sends a picture to our media store and answers with its address (/media/...)
export async function uploadImage(original: File) {
    const file = await shrink(original);
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

    async function upload(file: File) {
        setUploading(true);
        setError(null);
        try {
            onChange(await uploadImage(file));
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
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
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
    const [progress, setProgress] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // one after another, so the order is the order they were picked in, and each one that
    // arrives shows up straight away
    async function uploadAll(files: File[]) {
        setError(null);
        const room = files.slice(0, max - images.length);
        let added = 0;
        for (const [i, file] of room.entries()) {
            setProgress(`Uploading ${i + 1} of ${room.length}…`);
            try {
                const src = await uploadImage(file);
                onChange((current) => (current.length < max ? [...current, { src, alt: "" }] : current));
                added += 1;
            } catch (uploadError) {
                setError(`${file.name}: ${(uploadError as Error).message}`);
            }
        }
        if (files.length > room.length) setError(`Only ${max} pictures fit, so the last ${files.length - room.length} were left out`);
        setProgress(null);
        if (added) toast(`${added} photo${added === 1 ? "" : "s"} added`, { detail: "Add a short description to each, for screen readers and the full-screen view." });
    }

    const setImage = (i: number, patch: Partial<Picture>) => onChange((current) => current.map((image, j) => (j === i ? { ...image, ...patch } : image)));

    return (
        <div className="space-y-2">
            {images.map((image, i) => (
                <div key={i} className="flex gap-1.5 rounded-lg bg-sand/60 p-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <ImageInput id={`${id}-image-${i}`} value={image.src} onChange={(src) => setImage(i, { src })} />
                        <input value={image.alt} onChange={(event) => setImage(i, { alt: event.target.value })} placeholder="Description" aria-label="Image description" className={smallInputClass} />
                    </div>
                    <div className="flex flex-col">
                        <button type="button" onClick={() => onChange((current) => current.filter((_, j) => j !== i))} aria-label="Remove image" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-paper hover:text-danger">
                            <IconX size={15} />
                        </button>
                        {/* move it one place earlier: the simplest way to reorder a short list */}
                        {i > 0 && (
                            <button type="button" onClick={() => onChange((current) => moveUp(current, i))} aria-label="Move image up" className="flex size-9 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-paper hover:text-ink">
                                <IconArrowUp size={15} />
                            </button>
                        )}
                    </div>
                </div>
            ))}

            {images.length < max && (
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={!!progress} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-[#2e2e2e] disabled:opacity-60">
                        {progress ? <IconLoader2 size={15} className="animate-spin" /> : <IconPhotoUp size={15} />}
                        {progress ?? "Upload photos"}
                    </button>
                    <button type="button" onClick={() => onChange((current) => [...current, { src: "", alt: "" }])} className="flex h-9 items-center gap-1 rounded-full px-3 text-[13px] font-semibold text-pink hover:bg-sand">
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
                {images.length} of {max}. Pick several at once; big photos are made web-sized for you.
            </p>
            {error && <p className="text-xs text-danger">{error}</p>}
        </div>
    );
}
