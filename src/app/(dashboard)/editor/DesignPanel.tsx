"use client";
/* eslint-disable @next/next/no-img-element -- the avatar can come from any host */

import { Dropdown } from "@/components/Dropdown";
import { useBackToClose } from "@/components/useBackToClose";
import { useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { IconAlertTriangle, IconArrowLeft, IconArrowsShuffle, IconChevronRight, IconColorPicker, IconPhoto } from "@tabler/icons-react";

import { FONTS, TEMPLATES, templateOf, wearTemplate } from "@/lib/pages/theme";
import { PATTERN_KEYS, PATTERN_LABELS, patternBackground } from "@/lib/pages/patterns";
import type { PageDoc, Theme } from "@/lib/validations/page";
import { smallInputClass } from "@/components/Field";
import { toast } from "@/components/Toast";
import { boxColour, dominantColour, patternInk, readabilityIssues, themeFromColour } from "@/lib/pages/colour";
import { safeHref } from "@/lib/pages/links";
import { ColorPill, FieldRow, ImageInput, Label, Segmented, StyleTiles, Toggle } from "./controls";

type FontKey = keyof typeof FONTS;
type Part = "theme" | "wallpaper" | "buttons" | "boxes" | "text" | "seo";

const FONT_OPTIONS = Object.entries(FONTS) as [FontKey, (typeof FONTS)[FontKey]][];
// a script face is for a name or a heading; a paragraph of it is hard to read
// (nor of tall poster capitals)
const BODY_FONTS = FONT_OPTIONS.filter(([, font]) => !("script" in font) && !("display" in font));
const BACKGROUND_NAMES = { solid: "Solid colour", gradient: "Gradient", glow: "Glow", image: "Photo", pattern: "Pattern" };
const BUTTON_NAMES = { pop: "Sticker", solid: "Solid", outline: "Outline", soft: "Soft", glass: "Glass" };
// what a page saved before these settings existed looks like
const DEFAULT_TYPE: NonNullable<Theme["type"]> = { headingWeight: "auto", headingSize: "medium", textSize: "medium", textWeight: "regular" };
const DEFAULT_CARD: NonNullable<Theme["card"]> = { color: "", fill: 5 };

// The main colour of the lower middle of a photo: where, in a poster header, the picture melts
// into the page. Read from a small copy drawn on a canvas.
async function photoColour(src: string) {
    const image = new Image();
    // the photo comes from another address; without this the canvas refuses to give its pixels
    image.crossOrigin = "anonymous";
    image.src = src;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 48;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, 48, 48);
    return dominantColour(context.getImageData(8, 26, 32, 18).data);
}

// A template's background as CSS, for its tile in the picker
function swatchOf(theme: Theme) {
    const [base, middle, light] = theme.background.colors;
    if (theme.background.kind === "image") return `linear-gradient(${base}8c, ${base}8c), url("${theme.background.image}") center / cover`;
    if (theme.background.kind === "solid") return base;
    if (theme.background.kind === "pattern") return patternBackground(theme.background.pattern, base, patternInk(theme.background));
    return `linear-gradient(160deg, ${base}, ${middle}, ${light})`;
}

// How the page looks: a short list of parts, each opening its own small panel. Seeing
// "Buttons · Sticker" at a glance beats scrolling through every control at once.
export function DesignPanel({ page, onChange: onPageChange }: { page: PageDoc; onChange: Dispatch<SetStateAction<PageDoc>> }) {
    const [part, setPart] = useState<Part | null>(null);
    // Back (the gesture, the button) goes from a part to the list, like the arrow beside its title
    useBackToClose(part !== null, () => setPart(null));
    const { theme, seo, profile } = page;
    // applied to the latest page (see HeaderPanel), so a background photo still uploading can't undo other changes
    const set = <K extends keyof Theme>(key: K, value: Theme[K]) => onPageChange((current) => ({ ...current, theme: { ...current.theme, [key]: value } }));
    const setBackground = (patch: Partial<Theme["background"]>) => onPageChange((current) => ({ ...current, theme: { ...current.theme, background: { ...current.theme.background, ...patch } } }));
    const setSeo = (patch: Partial<PageDoc["seo"]>) => onPageChange((current) => ({ ...current, seo: { ...current.seo, ...patch } }));
    const templateName = templateOf(theme)?.name ?? "Custom";
    // a template changes the look; the Header section's choices and the text settings stay (wearTemplate)
    const wear = (template: Theme) => onPageChange((current) => ({ ...current, theme: wearTemplate(current.theme, template) }));

    const issues = readabilityIssues(theme);
    const type = theme.type ?? DEFAULT_TYPE;
    const card = theme.card ?? DEFAULT_CARD;

    if (part === null) {
        return (
            <div className="space-y-2.5">
                {/* text visitors would struggle to read, with a one-tap fix for each */}
                {issues.length > 0 && (
                    <div role="status" className="mb-4 space-y-3 rounded-2xl border border-[#f2c94c] bg-[#fff8e1] p-3.5">
                        {issues.map((issue) => (
                            <div key={issue.id}>
                                <p className="flex gap-2 text-sm font-semibold">
                                    <IconAlertTriangle size={18} className="mt-px shrink-0 text-[#b7791f]" /> {issue.message}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1.5 pl-6.5">
                                    {issue.fixes.map((fix) => (
                                        <button
                                            key={fix.label}
                                            onClick={() => {
                                                onPageChange((current) => ({ ...current, theme: fix.apply(current.theme) }));
                                                toast("Fixed", { detail: "Undo brings the old look back." });
                                            }}
                                            className="h-8 rounded-full bg-ink px-3.5 text-xs font-semibold text-white transition hover:bg-[#2e2e2e]"
                                        >
                                            {fix.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Row label="Theme" value={templateName} onClick={() => setPart("theme")} swatch={<span className="block size-full" style={{ background: swatchOf(theme) }} />} />

                <p className="px-1 pt-4 pb-1 text-xs font-bold tracking-[0.14em] text-faint uppercase">Customise</p>
                <Row label="Wallpaper" value={BACKGROUND_NAMES[theme.background.kind]} onClick={() => setPart("wallpaper")} swatch={<span className="block size-full" style={{ background: swatchOf(theme) }} />} />
                <Row
                    label="Buttons"
                    value={BUTTON_NAMES[theme.button.style]}
                    onClick={() => setPart("buttons")}
                    swatch={<span className="m-auto block h-3 w-6 rounded-full border-2" style={{ background: theme.button.color, borderColor: theme.button.style === "pop" ? theme.button.textColor : theme.button.color }} />}
                />
                <Row
                    label="Boxes"
                    value={card.color ? `${card.fill}% solid` : "See-through"}
                    onClick={() => setPart("boxes")}
                    swatch={
                        <span className="flex size-full items-center justify-center" style={{ background: swatchOf(theme) }}>
                            <span className="h-5 w-7 rounded-md border" style={{ background: boxColour(theme), borderColor: `${theme.text}33` }} />
                        </span>
                    }
                />
                <Row
                    label="Text"
                    value={FONTS[theme.font.heading].label}
                    onClick={() => setPart("text")}
                    swatch={
                        <span className="flex size-full items-center justify-center text-lg" style={{ fontFamily: FONTS[theme.font.heading].css, color: theme.text, background: theme.background.colors[0] }}>
                            Aa
                        </span>
                    }
                />

                <p className="px-1 pt-4 pb-1 text-xs font-bold tracking-[0.14em] text-faint uppercase">Sharing</p>
                <Row label="Search & sharing" value={seo.title || seo.description ? "Custom" : "Automatic"} onClick={() => setPart("seo")} swatch={<span className="m-auto font-display text-pink">G</span>} />
            </div>
        );
    }

    const titles: Record<Part, string> = { theme: "Theme", wallpaper: "Wallpaper", buttons: "Buttons", boxes: "Boxes", text: "Text", seo: "Search & sharing" };

    return (
        <div className="animate-[fade-in_0.25s_ease-out]">
            <div className="mb-5 flex items-center gap-2">
                <button onClick={() => setPart(null)} aria-label="Back to design" className="flex size-9 items-center justify-center rounded-full bg-sand text-ink transition hover:bg-line">
                    <IconArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-bold">{titles[part]}</h2>
                {part === "theme" && (
                    <button
                        // a different template each time, never the one already showing
                        onClick={() => {
                            const others = TEMPLATES.filter((template) => template.name !== templateName);
                            wear(others[Math.floor(Math.random() * others.length)].theme);
                        }}
                        className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-bold transition hover:border-ink"
                    >
                        <IconArrowsShuffle size={16} /> Shuffle
                    </button>
                )}
            </div>

            {part === "theme" && safeHref(profile.avatar) && (
                // the page in the colour of the creator's own photo, keeping their fonts and layout
                <button
                    onClick={async () => {
                        try {
                            const colours = themeFromColour(await photoColour(profile.avatar));
                            onPageChange((current) => {
                                const { theme } = current;
                                return {
                                    ...current,
                                    theme: { ...theme, ...colours, background: { ...theme.background, ...colours.background }, button: { ...theme.button, ...colours.button } },
                                };
                            });
                            toast("Matched to your photo", { detail: "Change any colour under Wallpaper, Buttons or Text." });
                        } catch {
                            toast.error("Couldn't read the colours of that photo", "Try uploading it again.");
                        }
                    }}
                    className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-line p-2.5 text-left transition hover:border-ink"
                >
                    <img src={safeHref(profile.avatar)} alt="" className="size-11 rounded-xl object-cover" />
                    <span className="flex-1">
                        <span className="block text-[15px] font-bold">Match my photo</span>
                        <span className="block text-xs text-muted">Your page in the colours of your picture</span>
                    </span>
                    <IconColorPicker size={19} className="mr-1.5 text-muted" />
                </button>
            )}

            {part === "theme" && (
                <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((template) => {
                        const chosen = templateName === template.name;
                        const { button } = template.theme;
                        return (
                            <button key={template.id} onClick={() => wear(template.theme)} aria-pressed={chosen} className="group text-center">
                                {/* a tiny page: its background, "Aa" in its heading font and one of its buttons */}
                                <span
                                    className={`flex aspect-3/4 flex-col justify-between overflow-hidden rounded-2xl p-3 text-left transition group-hover:-translate-y-0.5 ${chosen ? "ring-3 ring-pink ring-offset-2" : "ring-1 ring-line"}`}
                                    style={{ background: swatchOf(template.theme) }}
                                >
                                    <span className="text-2xl" style={{ color: template.theme.text, fontFamily: FONTS[template.theme.font.heading].css, fontWeight: FONTS[template.theme.font.heading].weight }}>
                                        Aa
                                    </span>
                                    <span
                                        className="block h-5 w-full"
                                        style={{
                                            background: button.style === "outline" ? "transparent" : button.style === "glass" || button.style === "soft" ? `${button.color}33` : button.color,
                                            border: `${button.style === "pop" ? 2 : 1}px solid ${button.style === "pop" ? button.textColor : button.color}`,
                                            borderRadius: { sharp: 3, rounded: 8, pill: 999 }[button.shape],
                                            boxShadow: button.style === "pop" ? `2px 2px 0 ${button.textColor}` : undefined,
                                        }}
                                    />
                                </span>
                                <span className="mt-1.5 block text-[13px] font-semibold">{template.name}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {part === "wallpaper" && (
                <div>
                    <p className="mb-3 text-[15px] font-semibold">Wallpaper style</p>
                    <StyleTiles
                        label="Wallpaper style"
                        value={theme.background.kind}
                        onChange={(kind) => setBackground({ kind })}
                        options={[
                            { value: "solid", label: "Fill", preview: <span className="size-full" style={{ background: theme.background.colors[0] }} /> },
                            { value: "gradient", label: "Gradient", preview: <span className="size-full" style={{ background: `linear-gradient(160deg, ${theme.background.colors.join(", ")})` }} /> },
                            { value: "glow", label: "Glow", preview: <span className="size-full" style={{ background: `radial-gradient(circle at 80% 10%, ${theme.background.colors[2]}, ${theme.background.colors[0]} 70%)` }} /> },
                            { value: "pattern", label: "Pattern", preview: <span className="size-full" style={{ background: patternBackground(theme.background.pattern, theme.background.colors[0], theme.background.colors[1]) }} /> },
                            { value: "image", label: "Photo", preview: <IconPhoto size={22} className="text-muted" /> },
                        ]}
                    />

                    {theme.background.kind === "pattern" && (
                        <>
                            <p className="mt-6 mb-3 text-[15px] font-semibold">Pattern</p>
                            <StyleTiles
                                label="Pattern"
                                value={theme.background.pattern}
                                onChange={(pattern) => setBackground({ pattern })}
                                options={PATTERN_KEYS.map((key) => ({
                                    value: key,
                                    label: PATTERN_LABELS[key],
                                    preview: <span className="size-full" style={{ background: patternBackground(key, theme.background.colors[0], patternInk(theme.background)) }} />,
                                }))}
                            />
                            <div className="mt-5">
                                <div className="mb-1 flex items-baseline justify-between">
                                    <label htmlFor="pattern-strength" className="text-[15px] font-semibold">
                                        Pattern strength
                                    </label>
                                    <span className="text-xs text-muted tabular-nums">{theme.background.patternStrength ?? 100}%</span>
                                </div>
                                <p className="mb-2 text-xs text-muted">Turn it down so a busy pattern sits quietly behind your text.</p>
                                <input
                                    id="pattern-strength"
                                    type="range"
                                    min={10}
                                    max={100}
                                    step={5}
                                    value={theme.background.patternStrength ?? 100}
                                    onChange={(event) => setBackground({ patternStrength: Number(event.target.value) })}
                                    className="w-full accent-ink"
                                />
                            </div>
                        </>
                    )}

                    <div className="mt-6 divide-y divide-line border-t border-line">
                        {theme.background.kind === "image" && (
                            <FieldRow label="Photo" htmlFor="background-image" hint="Your colour is laid over it, so text stays readable">
                                <ImageInput id="background-image" value={theme.background.image} onChange={(image) => setBackground({ image })} />
                            </FieldRow>
                        )}
                        {/* solid and photo backgrounds use one colour, patterns two (the page and the print), the others three */}
                        {theme.background.colors.slice(0, theme.background.kind === "solid" || theme.background.kind === "image" ? 1 : theme.background.kind === "pattern" ? 2 : 3).map((color, i) => (
                            <FieldRow key={i} label={i === 0 ? "Background colour" : theme.background.kind === "pattern" ? "Pattern colour" : i === 1 ? "Middle colour" : "Light colour"}>
                                <div className="flex sm:justify-end">
                                    <ColorPill
                                        label={["Background colour", "Middle colour", "Light colour"][i]}
                                        value={color}
                                        onChange={(value) => {
                                            const colors = [...theme.background.colors] as Theme["background"]["colors"];
                                            colors[i] = value;
                                            // one-colour backgrounds keep all three the same, so a switch to a gradient starts calm
                                            const single = theme.background.kind === "solid" || theme.background.kind === "image";
                                            setBackground({ colors: single ? [value, value, value] : colors });
                                        }}
                                    />
                                </div>
                            </FieldRow>
                        ))}
                        {(theme.background.kind === "gradient" || theme.background.kind === "glow") && (
                            <FieldRow label="Direction" htmlFor="angle" hint={`${theme.background.angle}°`}>
                                <input
                                    id="angle"
                                    type="range"
                                    min={0}
                                    max={360}
                                    step={5}
                                    value={theme.background.angle}
                                    onChange={(event) => setBackground({ angle: Number(event.target.value) })}
                                    className="mt-3 w-full accent-ink"
                                />
                            </FieldRow>
                        )}
                    </div>
                </div>
            )}

            {part === "buttons" && (
                <div className="space-y-4">
                    <Segmented
                        label="Button style"
                        value={theme.button.style}
                        options={(Object.keys(BUTTON_NAMES) as Theme["button"]["style"][]).map((style) => ({ value: style, label: BUTTON_NAMES[style] }))}
                        onChange={(style) => set("button", { ...theme.button, style })}
                    />
                    <Segmented
                        label="Button shape"
                        value={theme.button.shape}
                        options={[
                            { value: "sharp", label: "Square" },
                            { value: "rounded", label: "Rounded" },
                            { value: "pill", label: "Pill" },
                        ]}
                        onChange={(shape) => set("button", { ...theme.button, shape })}
                    />
                    <div className="flex gap-2">
                        <ColorInput label="Button" value={theme.button.color} onChange={(color) => set("button", { ...theme.button, color })} />
                        <ColorInput label="Button text" value={theme.button.textColor} onChange={(textColor) => set("button", { ...theme.button, textColor })} />
                    </div>
                    {theme.button.style !== "pop" && <Toggle label="Soft shadow under buttons" checked={theme.button.shadow} onChange={(shadow) => set("button", { ...theme.button, shadow })} />}
                </div>
            )}

            {part === "text" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                        <FontSelect label="Headings" value={theme.font.heading} onChange={(heading) => set("font", { ...theme.font, heading })} />
                        <FontSelect label="Text" value={theme.font.body} onChange={(body) => set("font", { ...theme.font, body })} options={BODY_FONTS} />
                    </div>
                    <div>
                        <Label>Section titles</Label>
                        <Segmented
                            label="Section titles"
                            value={theme.layout.titles}
                            options={[
                                { value: "display", label: "Big, in the heading font" },
                                { value: "label", label: "Small labels" },
                            ]}
                            onChange={(titles) => set("layout", { ...theme.layout, titles })}
                        />
                    </div>
                    <div>
                        <Label>Heading weight</Label>
                        <Segmented
                            label="Heading weight"
                            value={type.headingWeight}
                            options={[
                                { value: "auto", label: "Font's own" },
                                { value: "regular", label: "Regular" },
                                { value: "bold", label: "Bold" },
                                { value: "heavy", label: "Heavy" },
                            ]}
                            onChange={(headingWeight) => set("type", { ...type, headingWeight })}
                        />
                        {/* some faces only come in one weight; say so rather than look broken */}
                        {type.headingWeight !== "auto" && ["dm-serif", "instrument-serif", "bebas", "pinyon"].includes(theme.font.heading) && (
                            <p className="mt-1.5 text-xs text-muted">{FONTS[theme.font.heading].label} comes in one weight only, so this changes little.</p>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label>Heading size</Label>
                            <SizePicker value={type.headingSize} onChange={(headingSize) => set("type", { ...type, headingSize })} label="Heading size" />
                        </div>
                        <div>
                            <Label>Text size</Label>
                            <SizePicker value={type.textSize} onChange={(textSize) => set("type", { ...type, textSize })} label="Text size" />
                        </div>
                    </div>
                    <Toggle label="Bold text (bio, text blocks, descriptions)" checked={type.textWeight === "bold"} onChange={(bold) => set("type", { ...type, textWeight: bold ? "bold" : "regular" })} />
                    <div className="flex gap-2">
                        <ColorInput label="Text" value={theme.text} onChange={(text) => set("text", text)} />
                        <ColorInput label="Quiet text" value={theme.muted} onChange={(muted) => set("muted", muted)} />
                    </div>
                </div>
            )}

            {part === "boxes" && (
                <div className="space-y-5">
                    <p className="text-sm text-muted">The cards behind your services, contact form, reviews and projects. Make them solid when your wallpaper is busy.</p>
                    {/* quick starting points; everything can be fine-tuned below */}
                    <div className="grid grid-cols-3 gap-2.5">
                        {[
                            { label: "See-through", value: DEFAULT_CARD },
                            { label: "Soft", value: { color: "#ffffff", fill: 55 } },
                            { label: "Solid", value: { color: theme.background.colors[0], fill: 94 } },
                        ].map((preset) => {
                            const chosen = card.color === preset.value.color && card.fill === preset.value.fill;
                            return (
                                <button
                                    key={preset.label}
                                    onClick={() => set("card", preset.value)}
                                    aria-pressed={chosen}
                                    className={`flex flex-col items-center gap-2 rounded-2xl border bg-paper p-2 pb-2.5 text-[13px] font-medium transition ${chosen ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong"}`}
                                >
                                    <span className="flex h-14 w-full items-center justify-center overflow-hidden rounded-xl" style={{ background: swatchOf(theme) }}>
                                        <span className="h-8 w-14 rounded-lg border" style={{ background: boxColour({ ...theme, card: preset.value }), borderColor: `${theme.text}33` }} />
                                    </span>
                                    {preset.label}
                                </button>
                            );
                        })}
                    </div>
                    <div className="divide-y divide-line border-t border-line">
                        <FieldRow label="Box colour" hint={card.color ? undefined : "Now: your text colour"}>
                            <div className="flex items-center gap-2 sm:justify-end">
                                <ColorPill label="Box colour" value={card.color || theme.text} onChange={(color) => set("card", { color, fill: card.color ? card.fill : 80 })} />
                                {card.color && (
                                    <button onClick={() => set("card", { ...card, color: "" })} className="text-xs font-semibold text-pink hover:underline">
                                        Reset
                                    </button>
                                )}
                            </div>
                        </FieldRow>
                        <FieldRow label="How solid" htmlFor="card-fill" hint={`${card.fill}%`}>
                            <input id="card-fill" type="range" min={0} max={100} step={5} value={card.fill} onChange={(event) => set("card", { ...card, fill: Number(event.target.value) })} className="mt-3 w-full accent-ink" />
                        </FieldRow>
                    </div>
                </div>
            )}

            {part === "seo" && (
                <div className="space-y-4">
                    <p className="text-sm text-muted">What Google and link previews show. Left empty, they use your name and bio.</p>
                    <div>
                        <Label htmlFor="seo-title">Title</Label>
                        <input id="seo-title" value={seo.title} maxLength={70} onChange={(event) => setSeo({ title: event.target.value })} placeholder={profile.name} className={smallInputClass} />
                    </div>
                    <div>
                        <Label htmlFor="seo-description">Description</Label>
                        <textarea
                            id="seo-description"
                            value={seo.description}
                            maxLength={160}
                            rows={3}
                            onChange={(event) => setSeo({ description: event.target.value })}
                            placeholder={profile.bio}
                            className={`${smallInputClass} h-auto py-2 leading-relaxed`}
                        />
                        <p className="mt-1 text-right text-[11px] text-faint">{seo.description.length}/160</p>
                    </div>
                </div>
            )}

        </div>
    );
}

// One line of the Design list: a little preview, the part's name, what it's set to now
function Row({ label, value, swatch, onClick }: { label: string; value: string; swatch: ReactNode; onClick: () => void }) {
    return (
        <button onClick={onClick} className="flex w-full items-center gap-3.5 rounded-2xl border border-line bg-paper p-3 text-left transition hover:border-line-strong hover:shadow-soft">
            <span className="flex size-11 shrink-0 overflow-hidden rounded-xl ring-1 ring-line">{swatch}</span>
            <span className="flex-1 text-[15px] font-bold">{label}</span>
            <span className="text-sm text-muted">{value}</span>
            <IconChevronRight size={18} className="text-faint" />
        </button>
    );
}

// The browser's own colour picker, with the hex value beside it
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    return (
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-line bg-paper p-1.5 pr-2.5 transition hover:border-line-strong">
            <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="size-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
            <span className="min-w-0">
                <span className="block truncate text-[11px] font-bold text-muted">{label}</span>
                <span className="block font-mono text-[11px] text-faint uppercase">{value}</span>
            </span>
        </label>
    );
}

function FontSelect({ label, value, onChange, options = FONT_OPTIONS }: { label: string; value: FontKey; onChange: (value: FontKey) => void; options?: typeof FONT_OPTIONS }) {
    const id = `font-${label}`;
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            {/* every font previewed in its own typeface */}
            <Dropdown
                id={id}
                value={value}
                options={options.map(([key, font]) => ({ value: key, label: font.label, style: { fontFamily: font.css } }))}
                onChange={(key) => onChange(key as FontKey)}
            />
        </div>
    );
}

// Small, medium or large
function SizePicker({ value, onChange, label }: { value: "small" | "medium" | "large"; onChange: (value: "small" | "medium" | "large") => void; label: string }) {
    return (
        <Segmented
            label={label}
            value={value}
            options={[
                { value: "small", label: "S" },
                { value: "medium", label: "M" },
                { value: "large", label: "L" },
            ]}
            onChange={onChange}
        />
    );
}
