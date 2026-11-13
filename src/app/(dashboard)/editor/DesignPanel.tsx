"use client";

import { useState, type ReactNode } from "react";
import { IconArrowLeft, IconArrowsShuffle, IconChevronRight, IconPhoto } from "@tabler/icons-react";

import { FONTS, TEMPLATES } from "@/lib/pages/theme";
import { PATTERN_KEYS, PATTERN_LABELS, patternBackground } from "@/lib/pages/patterns";
import type { PageDoc, Theme } from "@/lib/validations/page";
import { smallInputClass } from "@/components/Field";
import { ColorPill, FieldRow, ImageInput, Label, Segmented, StyleTiles, Toggle } from "./controls";

type FontKey = keyof typeof FONTS;
type Part = "theme" | "wallpaper" | "buttons" | "text" | "seo";

const FONT_OPTIONS = Object.entries(FONTS) as [FontKey, (typeof FONTS)[FontKey]][];
const BACKGROUND_NAMES = { solid: "Solid colour", gradient: "Gradient", glow: "Glow", image: "Photo", pattern: "Pattern" };
const BUTTON_NAMES = { pop: "Sticker", solid: "Solid", outline: "Outline", soft: "Soft", glass: "Glass" };

// A template's background as CSS, for its tile in the picker
function swatchOf(theme: Theme) {
    const [base, middle, light] = theme.background.colors;
    if (theme.background.kind === "image") return `linear-gradient(${base}8c, ${base}8c), url("${theme.background.image}") center / cover`;
    if (theme.background.kind === "solid") return base;
    if (theme.background.kind === "pattern") return patternBackground(theme.background.pattern, base, middle);
    return `linear-gradient(160deg, ${base}, ${middle}, ${light})`;
}

// How the page looks: a short list of parts, each opening its own small panel. Seeing
// "Buttons · Sticker" at a glance beats scrolling through every control at once.
export function DesignPanel({ page, onChange: onPageChange }: { page: PageDoc; onChange: (page: PageDoc) => void }) {
    const [part, setPart] = useState<Part | null>(null);
    const { theme, seo, profile } = page;
    const onChange = (next: Theme) => onPageChange({ ...page, theme: next });
    const set = <K extends keyof Theme>(key: K, value: Theme[K]) => onChange({ ...theme, [key]: value });
    const setSeo = (patch: Partial<PageDoc["seo"]>) => onPageChange({ ...page, seo: { ...seo, ...patch } });
    const templateName = TEMPLATES.find((template) => JSON.stringify(template.theme) === JSON.stringify(theme))?.name ?? "Custom";

    if (part === null) {
        return (
            <div className="space-y-2.5">
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

    const titles: Record<Part, string> = { theme: "Theme", wallpaper: "Wallpaper", buttons: "Buttons", text: "Text", seo: "Search & sharing" };

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
                            onChange(others[Math.floor(Math.random() * others.length)].theme);
                        }}
                        className="ml-auto flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-sm font-bold transition hover:border-ink"
                    >
                        <IconArrowsShuffle size={16} /> Shuffle
                    </button>
                )}
            </div>

            {part === "theme" && (
                <div className="grid grid-cols-3 gap-3">
                    {TEMPLATES.map((template) => {
                        const chosen = templateName === template.name;
                        const { button } = template.theme;
                        return (
                            <button key={template.id} onClick={() => onChange(template.theme)} aria-pressed={chosen} className="group text-center">
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
                        onChange={(kind) => set("background", { ...theme.background, kind })}
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
                                onChange={(pattern) => set("background", { ...theme.background, pattern })}
                                options={PATTERN_KEYS.map((key) => ({
                                    value: key,
                                    label: PATTERN_LABELS[key],
                                    preview: <span className="size-full" style={{ background: patternBackground(key, theme.background.colors[0], theme.background.colors[1]) }} />,
                                }))}
                            />
                        </>
                    )}

                    <div className="mt-6 divide-y divide-line border-t border-line">
                        {theme.background.kind === "image" && (
                            <FieldRow label="Photo" htmlFor="background-image" hint="Your colour is laid over it, so text stays readable">
                                <ImageInput id="background-image" value={theme.background.image} onChange={(image) => set("background", { ...theme.background, image })} />
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
                                            set("background", { ...theme.background, colors: single ? [value, value, value] : colors });
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
                                    onChange={(event) => set("background", { ...theme.background, angle: Number(event.target.value) })}
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
                        <FontSelect label="Text" value={theme.font.body} onChange={(body) => set("font", { ...theme.font, body })} />
                    </div>
                    <div className="flex gap-2">
                        <ColorInput label="Text" value={theme.text} onChange={(text) => set("text", text)} />
                        <ColorInput label="Quiet text" value={theme.muted} onChange={(muted) => set("muted", muted)} />
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

function FontSelect({ label, value, onChange }: { label: string; value: FontKey; onChange: (value: FontKey) => void }) {
    const id = `font-${label}`;
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value as FontKey)}
                className="h-10 w-full rounded-xl border border-line bg-paper px-2.5 text-sm outline-none focus:border-pink"
                style={{ fontFamily: FONTS[value].css }}
            >
                {FONT_OPTIONS.map(([key, font]) => (
                    <option key={key} value={key}>
                        {font.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
