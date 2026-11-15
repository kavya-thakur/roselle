"use client";
/* eslint-disable @next/next/no-img-element -- the avatar can come from any host */

import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { IconCrop, IconLoader2, IconPlus, IconTrash, IconX } from "@tabler/icons-react";

import { SOCIAL_LABELS, SocialIcon } from "@/components/SocialIcon";
import { safeHref } from "@/lib/pages/links";
import { SOCIALS, type PageDoc, type Theme } from "@/lib/validations/page";
import { FieldRow, ImageInput, StyleTiles, uploadImage } from "./controls";
import { PhotoEditor } from "./PhotoEditor";
import { useBackToClose } from "@/components/useBackToClose";

const field = "w-full rounded-xl border border-line bg-paper px-4 text-[15px] outline-none transition focus:border-ink";

// The top of the page: how it's laid out, the photo, the name, the bio and the social icons.
// One setting per line, the way a settings screen reads.
export function HeaderPanel({ page, onChange }: { page: PageDoc; onChange: Dispatch<SetStateAction<PageDoc>> }) {
    const { profile, theme } = page;
    // Changes are applied to the latest page, not the one on screen when they started: a photo
    // finishing its upload must not undo what was typed while it uploaded
    const setProfile = (patch: Partial<PageDoc["profile"]>) => onChange((current) => ({ ...current, profile: { ...current.profile, ...patch } }));
    const setLayout = (patch: Partial<Theme["layout"]>) => onChange((current) => ({ ...current, theme: { ...current.theme, layout: { ...current.theme.layout, ...patch } } }));

    const fileRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [picking, setPicking] = useState(false);
    const [cropping, setCropping] = useState(false);
    useBackToClose(cropping, () => setCropping(false));

    async function changePhoto(file: File) {
        setUploading(true);
        setUploadError(null);
        try {
            setProfile({ avatar: await uploadImage(file) });
        } catch (error) {
            setUploadError((error as Error).message);
        } finally {
            setUploading(false);
        }
    }

    const avatar = safeHref(profile.avatar);
    const unused = SOCIALS.filter((platform) => !profile.socials.some((social) => social.platform === platform));
    // the little faces in the layout tiles: a circle, an arch, or nothing at all
    const face = (shape: string) => <span className={`block bg-forest/80 ${shape}`} />;

    return (
        <div>
            <p className="mb-3 text-[15px] font-semibold">Style</p>
            <StyleTiles
                label="Header style"
                value={theme.layout.header}
                onChange={(header) => setLayout({ header })}
                options={[
                    {
                        value: "classic",
                        label: "Classic",
                        preview: (
                            <span className="flex flex-col items-center gap-1">
                                {face("size-5 rounded-full")}
                                <span className="h-1 w-8 rounded bg-forest/50" />
                            </span>
                        ),
                    },
                    {
                        value: "poster",
                        label: "Poster",
                        // the photo filling the tile, the name across its bottom
                        preview: (
                            <span className="relative size-full">
                                {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <span className="block size-full bg-forest/70" />}
                                <span className="absolute inset-x-2 bottom-1.5 h-1.5 rounded bg-white" />
                            </span>
                        ),
                    },
                    {
                        value: "banner",
                        label: "Banner",
                        preview: (
                            <span className="flex size-full flex-col items-center">
                                <span className="h-1/2 w-full bg-forest/60" />
                                <span className="-mt-3 size-6 rounded-full bg-forest ring-2 ring-sand" />
                            </span>
                        ),
                    },
                ]}
            />

            {theme.layout.header !== "poster" && (
                <>
                    <p className="mt-6 mb-3 text-[15px] font-semibold">Photo</p>
                    <StyleTiles
                    label="Photo shape"
                    value={theme.layout.avatar}
                    onChange={(avatar) => setLayout({ avatar })}
                    options={[
                        { value: "circle", label: "Classic", preview: face("size-8 rounded-full") },
                        { value: "arch", label: "Arch", preview: face("h-10 w-8 rounded-t-full rounded-b-sm") },
                        { value: "hidden", label: "No photo", preview: <span className="h-1.5 w-10 rounded-full bg-forest/60" /> },
                    ]}
                />
                <div className="mt-2.5">
                    <StyleTiles
                        label="Alignment"
                        value={theme.layout.align}
                        onChange={(align) => setLayout({ align })}
                        options={[
                            { value: "center", label: "Centred", preview: <span className="flex w-10 flex-col items-center gap-1">{face("size-3 rounded-full")}<span className="h-1 w-8 rounded bg-forest/50" /><span className="h-1 w-6 rounded bg-forest/30" /></span> },
                            { value: "left", label: "Editorial", preview: <span className="flex w-12 gap-1.5">{face("size-4 rounded-full")}<span className="flex flex-1 flex-col gap-1"><span className="h-1 rounded bg-forest/50" /><span className="h-1 rounded bg-forest/30" /><span className="h-1 rounded bg-forest/30" /></span></span> },
                        ]}
                    />
                </div>
                </>
            )}

            <div className="mt-6 divide-y divide-line border-t border-line">
                <FieldRow label="Profile image">
                    <div className="flex items-center gap-3 sm:justify-end">
                        <button onClick={() => fileRef.current?.click()} aria-label="Upload a profile image" className="group relative size-16 overflow-hidden rounded-2xl bg-sand">
                            {avatar ? <img src={avatar} alt="" className="size-full object-cover" /> : <span className="flex size-full items-center justify-center font-display text-xl text-muted">{profile.name[0]?.toUpperCase() ?? "R"}</span>}
                            <span className="absolute right-1 bottom-1 flex size-6 items-center justify-center rounded-full bg-paper text-ink shadow-soft">
                                {uploading ? <IconLoader2 size={13} className="animate-spin" /> : <IconPlus size={14} />}
                            </span>
                        </button>
                        {avatar && (
                            <button onClick={() => setCropping(true)} disabled={uploading} aria-label="Crop or rotate the profile image" title="Crop or rotate" className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
                                <IconCrop size={16} />
                            </button>
                        )}
                        {cropping && (
                            <PhotoEditor
                                source={profile.avatar}
                                onCancel={() => setCropping(false)}
                                onDone={(file) => {
                                    setCropping(false);
                                    changePhoto(file);
                                }}
                            />
                        )}
                        {avatar && (
                            <button onClick={() => setProfile({ avatar: "" })} aria-label="Remove the profile image" className="flex size-9 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
                                <IconTrash size={16} />
                            </button>
                        )}
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                            hidden
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) changePhoto(file);
                                event.target.value = "";
                            }}
                        />
                    </div>
                    {uploadError && <p className="mt-1.5 text-xs text-danger sm:text-right">{uploadError}</p>}
                </FieldRow>

                {theme.layout.header === "banner" && (
                    <FieldRow label="Cover image" htmlFor="profile-cover" hint="Wide picture across the top. Empty uses a soft wash of your colours">
                        <ImageInput id="profile-cover" value={profile.cover} onChange={(cover) => setProfile({ cover })} />
                    </FieldRow>
                )}

                <FieldRow label="Title" htmlFor="profile-name">
                    <input id="profile-name" value={profile.name} maxLength={80} onChange={(event) => setProfile({ name: event.target.value })} placeholder="Your name" className={`${field} h-12`} />
                    <p className="mt-1 text-right text-xs text-faint">{profile.name.length}/80</p>
                </FieldRow>

                <FieldRow label="Bio" htmlFor="profile-bio">
                    <textarea id="profile-bio" value={profile.bio} maxLength={300} rows={4} onChange={(event) => setProfile({ bio: event.target.value })} placeholder="Add a short bio" className={`${field} resize-none py-3 leading-relaxed`} />
                    <p className="mt-1 text-right text-xs text-faint">{profile.bio.length}/300</p>
                </FieldRow>

                <FieldRow label="Social icons" hint="Shown under your bio">
                    <div className="space-y-2">
                        {profile.socials.map((social) => (
                            <div key={social.platform} className="flex items-center gap-2">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sand" title={SOCIAL_LABELS[social.platform]}>
                                    <SocialIcon platform={social.platform} size={18} />
                                </span>
                                <input
                                    value={social.url}
                                    onChange={(event) => setProfile({ socials: profile.socials.map((existing) => (existing.platform === social.platform ? { ...existing, url: event.target.value } : existing)) })}
                                    placeholder={social.platform === "email" ? "mailto:you@studio.com" : `Your ${SOCIAL_LABELS[social.platform]} link`}
                                    aria-label={`${SOCIAL_LABELS[social.platform]} link`}
                                    className={`${field} h-11 min-w-0 text-sm`}
                                />
                                <button
                                    onClick={() => setProfile({ socials: profile.socials.filter((existing) => existing.platform !== social.platform) })}
                                    aria-label={`Remove ${SOCIAL_LABELS[social.platform]}`}
                                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink"
                                >
                                    <IconX size={16} />
                                </button>
                            </div>
                        ))}

                        {unused.length > 0 &&
                            (picking ? (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {unused.map((platform) => (
                                        <button
                                            key={platform}
                                            onClick={() => {
                                                setProfile({ socials: [...profile.socials, { platform, url: "" }] });
                                                setPicking(false);
                                            }}
                                            className="flex h-9 items-center gap-1.5 rounded-full border border-line bg-paper px-3 text-[13px] font-medium transition hover:border-ink"
                                        >
                                            <SocialIcon platform={platform} size={15} />
                                            {SOCIAL_LABELS[platform]}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <button onClick={() => setPicking(true)} className="flex h-10 items-center gap-1.5 rounded-full bg-sand px-4 text-sm font-semibold transition hover:bg-line">
                                    <IconPlus size={16} /> Add social icon
                                </button>
                            ))}
                    </div>
                </FieldRow>
            </div>
        </div>
    );
}
