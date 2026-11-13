"use client";

import { IconArrowUp, IconPlus, IconX } from "@tabler/icons-react";

import { smallInputClass } from "@/components/Field";
import { TIP_LABELS, tipHref } from "@/lib/pages/links";
import { MAX_GALLERY, TIP_PROVIDERS, type Block, type TipProvider } from "@/lib/validations/page";

const LAYOUT_HINTS = {
    grid: "Even squares, neat and calm.",
    masonry: "Every photo keeps its own shape, portrait or landscape.",
    carousel: "One row people swipe through, photos shown large.",
};
import { fromLocalInput, ImageInput, ImageListField, Label, moveUp, Segmented, Toggle, toLocalInput } from "./controls";

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
                    <div>
                        <Label>Layout</Label>
                        <Segmented
                            label="Gallery layout"
                            value={block.layout}
                            onChange={(layout) => onChange({ ...block, layout })}
                            options={[
                                { value: "grid", label: "Grid" },
                                { value: "masonry", label: "Masonry" },
                                { value: "carousel", label: "Carousel" },
                            ]}
                        />
                        <p className="mt-1.5 text-xs text-muted">{LAYOUT_HINTS[block.layout]}</p>
                    </div>
                    <div>
                        <Label>Photos</Label>
                        <ImageListField id={block.id} images={block.images} max={MAX_GALLERY} onChange={(images) => onChange({ ...block, images })} />
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

                    {/* the case study: optional, and it changes what the card does, so it says so */}
                    <div className="rounded-xl border border-line p-3.5">
                        <p className="text-sm font-semibold">Case study</p>
                        <p className="mt-0.5 text-xs text-muted">Tell the story and add more pictures, and the card opens its own page for this project.</p>
                        <div className="mt-3 space-y-3">
                            {text("body", "The story", { long: true, placeholder: "The brief, what you made, how it went…" })}
                            <div>
                                <Label>Pictures</Label>
                                <ImageListField id={`${block.id}-case`} images={block.images} max={MAX_GALLERY} onChange={(images) => onChange({ ...block, images })} />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {block.type === "services" && (
                <>
                    {text("title", "Heading (optional)", { placeholder: "Services" })}
                    <ServiceList block={block} onChange={onChange} />
                </>
            )}

            {block.type === "reviews" && (
                <>
                    {text("title", "Heading", { placeholder: "Kind words" })}
                    <p className="text-xs text-muted">
                        Shows the reviews you approve. To get one, mark a finished job Paid in your Inbox and press <span className="font-semibold text-ink">Ask for a review</span>: your client gets a link,
                        and only they can use it.
                    </p>
                </>
            )}

            {block.type === "contact" && (
                <>
                    {text("title", "Heading", { placeholder: "Work with me" })}
                    {text("text", "A line about what you take on", { long: true })}
                    {text("button", "Button", { placeholder: "Send message" })}
                    <p className="text-xs text-muted">Visitors leave their name, email and a message. It arrives in your Inbox and by email, and Reply goes straight to them.</p>
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

type Services = Extract<Block, { type: "services" }>;

// The services in a Services block, each a small card: name and price on one line, what's
// included under them. Moved up one place at a time, like gallery pictures.
function ServiceList({ block, onChange }: { block: Services; onChange: (block: Block) => void }) {
    const { items } = block;
    const setItems = (next: Services["items"]) => onChange({ ...block, items: next });
    const setItem = (i: number, patch: Partial<Services["items"][number]>) => setItems(items.map((item, j) => (j === i ? { ...item, ...patch } : item)));

    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={item.id} className="flex gap-1.5 rounded-lg bg-sand/60 p-2">
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="grid grid-cols-[1fr_8.5rem] gap-1.5">
                            <input value={item.name} onChange={(event) => setItem(i, { name: event.target.value })} placeholder="Portrait session" aria-label="Service name" maxLength={80} className={smallInputClass} />
                            <input value={item.price} onChange={(event) => setItem(i, { price: event.target.value })} placeholder="from $300" aria-label="Price" maxLength={40} className={smallInputClass} />
                        </div>
                        <textarea
                            value={item.description}
                            onChange={(event) => setItem(i, { description: event.target.value })}
                            placeholder="What's included"
                            aria-label="What's included"
                            maxLength={400}
                            rows={2}
                            className={`${smallInputClass} h-auto py-2 leading-relaxed`}
                        />
                    </div>
                    <div className="flex flex-col">
                        <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label={`Remove ${item.name || "service"}`} className="flex size-9 items-center justify-center rounded-lg text-faint hover:bg-paper hover:text-danger">
                            <IconX size={15} />
                        </button>
                        {i > 0 && (
                            <button type="button" onClick={() => setItems(moveUp(items, i))} aria-label="Move up" className="flex size-9 items-center justify-center rounded-lg text-faint hover:bg-paper hover:text-ink">
                                <IconArrowUp size={15} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {items.length < 12 && (
                <button type="button" onClick={() => setItems([...items, { id: crypto.randomUUID().slice(0, 8), name: "", price: "", description: "" }])} className="flex items-center gap-1 text-[13px] font-semibold text-pink hover:underline">
                    <IconPlus size={14} /> Add a service
                </button>
            )}
            <p className="text-xs text-muted">Each one gets an Enquire button. Enquiries arrive in your Inbox with the service already named, ready to turn into a booking.</p>
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
