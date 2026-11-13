"use client";

import { IconPlus, IconX } from "@tabler/icons-react";

import { smallInputClass } from "@/components/Field";
import { TIP_LABELS, tipHref } from "@/lib/pages/links";
import { TIP_PROVIDERS, type Block, type TipProvider } from "@/lib/validations/page";
import { fromLocalInput, ImageInput, Label, Toggle, toLocalInput } from "./controls";

// The fields for one block, by its type. Every keystroke updates the
// block straight away (the preview follows, autosave waits for a pause).
export function BlockForm({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
    // one helper for a text field bound to a property of this block
    const text = (key: string, label: string, options: { placeholder?: string; long?: boolean } = {}) => {
        const id = `${block.id}-${key}`;
        const value = (block as Record<string, unknown>)[key] as string;
        const change = (next: string) => onChange({ ...block, [key]: next } as Block);

        return (
            <div>
                <Label htmlFor={id}>{label}</Label>
                {options.long ? (
                    <textarea id={id} value={value} onChange={(event) => change(event.target.value)} placeholder={options.placeholder} rows={4} className={`${smallInputClass} h-auto py-2 leading-relaxed`} />
                ) : (
                    <input id={id} value={value} onChange={(event) => change(event.target.value)} placeholder={options.placeholder} className={smallInputClass} />
                )}
            </div>
        );
    };

    return (
        <div className="space-y-3.5">
            {block.type === "link" && (
                <>
                    {text("title", "Title", { placeholder: "Listen to my new record" })}
                    {text("url", "Link", { placeholder: "https://" })}
                    <div>
                        <Label htmlFor={`${block.id}-thumbnail`}>Thumbnail (optional)</Label>
                        <ImageInput id={`${block.id}-thumbnail`} value={block.thumbnail} onChange={(thumbnail) => onChange({ ...block, thumbnail })} />
                    </div>
                    <Toggle label="Feature it (a larger button)" checked={block.featured} onChange={(featured) => onChange({ ...block, featured })} />
                </>
            )}

            {block.type === "heading" && text("text", "Heading", { placeholder: "Selected work" })}

            {block.type === "text" && text("text", "Text", { long: true })}

            {block.type === "image" && (
                <>
                    <div>
                        <Label htmlFor={`${block.id}-src`}>Image</Label>
                        <ImageInput id={`${block.id}-src`} value={block.src} onChange={(src) => onChange({ ...block, src })} />
                    </div>
                    {text("alt", "Description, for screen readers", { placeholder: "A ceramic bowl in morning light" })}
                    {text("caption", "Caption (optional)")}
                    {text("url", "Link (optional)", { placeholder: "https://" })}
                </>
            )}

            {block.type === "video" && (
                <>
                    {text("url", "YouTube or Vimeo link", { placeholder: "https://youtube.com/watch?v=…" })}
                    {text("title", "Title")}
                </>
            )}

            {block.type === "gallery" && (
                <>
                    {text("title", "Title (optional)")}
                    <div className="space-y-2">
                        <Label>Images</Label>
                        {block.images.map((image, i) => {
                            const setImage = (patch: Partial<typeof image>) => onChange({ ...block, images: block.images.map((existing, j) => (j === i ? { ...existing, ...patch } : existing)) });
                            return (
                                <div key={i} className="flex gap-1.5 rounded-lg bg-sand/60 p-2">
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <ImageInput id={`${block.id}-image-${i}`} value={image.src} onChange={(src) => setImage({ src })} />
                                        <input value={image.alt} onChange={(event) => setImage({ alt: event.target.value })} placeholder="Description" aria-label="Image description" className={smallInputClass} />
                                    </div>
                                    <button
                                        onClick={() => onChange({ ...block, images: block.images.filter((_, j) => j !== i) })}
                                        aria-label="Remove image"
                                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-faint hover:bg-paper hover:text-danger"
                                    >
                                        <IconX size={15} />
                                    </button>
                                </div>
                            );
                        })}
                        {block.images.length < 12 && (
                            <button onClick={() => onChange({ ...block, images: [...block.images, { src: "", alt: "" }] })} className="flex items-center gap-1 text-[13px] font-semibold text-pink hover:underline">
                                <IconPlus size={14} /> Add image
                            </button>
                        )}
                    </div>
                </>
            )}

            {block.type === "project" && (
                <>
                    {text("title", "Title")}
                    {text("description", "Description", { long: true })}
                    <div>
                        <Label htmlFor={`${block.id}-image`}>Cover image</Label>
                        <ImageInput id={`${block.id}-image`} value={block.image} onChange={(image) => onChange({ ...block, image })} />
                    </div>
                    {text("url", "Link (optional)", { placeholder: "https://" })}
                    <div>
                        <Label htmlFor={`${block.id}-tags`}>Tags, separated by commas</Label>
                        <input
                            id={`${block.id}-tags`}
                            // edited as one line of text, stored as a list
                            defaultValue={block.tags.join(", ")}
                            onChange={(event) =>
                                onChange({
                                    ...block,
                                    tags: event.target.value
                                        .split(",")
                                        .map((tag) => tag.trim())
                                        .filter(Boolean)
                                        .slice(0, 6),
                                })
                            }
                            placeholder="Branding, Print, 2026"
                            className={smallInputClass}
                        />
                    </div>
                </>
            )}

            {block.type === "music" && (
                <>
                    {text("url", "Spotify, Apple Music or SoundCloud link", { placeholder: "https://open.spotify.com/track/…" })}
                    {text("title", "Title (for screen readers)")}
                </>
            )}

            {block.type === "map" && (
                <>
                    {text("address", "Address or place", { placeholder: "Studio 4, 12 Rose Lane, London" })}
                    {text("title", "Name (optional)", { placeholder: "My studio" })}
                </>
            )}

            {block.type === "tip" && (
                <>
                    {text("title", "Button text", { placeholder: "Buy me a coffee" })}
                    <div>
                        <Label htmlFor={`${block.id}-provider`}>Paid through</Label>
                        <select
                            id={`${block.id}-provider`}
                            value={block.provider}
                            onChange={(event) => onChange({ ...block, provider: event.target.value as TipProvider })}
                            className={smallInputClass}
                        >
                            {TIP_PROVIDERS.map((provider) => (
                                <option key={provider} value={provider}>
                                    {TIP_LABELS[provider]}
                                </option>
                            ))}
                        </select>
                    </div>
                    {text("handle", TIP_HANDLE[block.provider].label, { placeholder: TIP_HANDLE[block.provider].placeholder })}
                    {block.handle.trim() && !tipHref(block.provider, block.handle) && <p className="text-xs text-danger">{TIP_HANDLE[block.provider].hint}</p>}
                    <p className="text-xs text-muted">The money goes straight to you. Roselle never touches it and takes no fee.</p>
                </>
            )}
        </div>
    );
}

// What the tip block asks for, per provider
const TIP_HANDLE: Record<TipProvider, { label: string; placeholder: string; hint: string }> = {
    paypal: { label: "PayPal.me name", placeholder: "adalovelace", hint: "Just the name after paypal.me/" },
    kofi: { label: "Ko-fi name", placeholder: "adalovelace", hint: "Just the name after ko-fi.com/" },
    buymeacoffee: { label: "Buy Me a Coffee name", placeholder: "adalovelace", hint: "Just the name after buymeacoffee.com/" },
    patreon: { label: "Patreon name", placeholder: "adalovelace", hint: "Just the name after patreon.com/" },
    cashapp: { label: "$Cashtag", placeholder: "$adalovelace", hint: "Your $Cashtag, like $adalovelace" },
    venmo: { label: "Venmo username", placeholder: "ada-lovelace", hint: "Your Venmo username" },
    upi: { label: "UPI ID", placeholder: "ada@okbank", hint: "A UPI ID looks like name@bank" },
    link: { label: "Payment page link", placeholder: "https://buy.stripe.com/…", hint: "Paste the full address, starting with https://" },
};

// When visitors see a block: from, until, or both. Empty means no limit.
export function ScheduleFields({ block, onChange }: { block: Block; onChange: (block: Block) => void }) {
    return (
        <div>
            <p className="text-xs text-muted">Show this only between these times. Leave either empty for no limit.</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
                <div>
                    <Label htmlFor={`${block.id}-starts`}>From</Label>
                    <input
                        id={`${block.id}-starts`}
                        type="datetime-local"
                        value={toLocalInput(block.startsAt)}
                        onChange={(event) => onChange({ ...block, startsAt: fromLocalInput(event.target.value) })}
                        className={`${smallInputClass} px-2 text-xs`}
                    />
                </div>
                <div>
                    <Label htmlFor={`${block.id}-ends`}>Until</Label>
                    <input
                        id={`${block.id}-ends`}
                        type="datetime-local"
                        value={toLocalInput(block.endsAt)}
                        onChange={(event) => onChange({ ...block, endsAt: fromLocalInput(event.target.value) })}
                        className={`${smallInputClass} px-2 text-xs`}
                    />
                </div>
            </div>
        </div>
    );
}
