/* eslint-disable @next/next/no-img-element -- creators' images come from any host, next/image would need each one listed */
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { IconArrowRight, IconArrowUpRight, IconClock, IconCoffee, IconCurrencyRupee, IconEyeOff, IconHeart, IconMapPin } from "@tabler/icons-react";

import { FONTS } from "@/lib/pages/theme";
import { pageBackground } from "@/lib/pages/patterns";
import { hasCaseStudy, isLive, mapEmbed, mapLink, musicEmbed, safeHref, targetOf, TIP_LABELS, videoEmbed } from "@/lib/pages/links";
import type { Block, PageDoc, Theme } from "@/lib/validations/page";
import { LinkIcon, SocialIcon } from "./SocialIcon";
import { QrCode } from "./QrCode";
import { ContactForm } from "./ContactForm";

interface PageRendererProps {
    page: PageDoc;
    // "live" is the public page: links are tracked, hidden blocks left out.
    // "preview" is the editor and the landing page: links do nothing, hidden blocks show faded.
    mode?: "live" | "preview";
    // live pages send link clicks through /go/<pageId>/<blockId> to count them
    pageId?: number;
    // for the addresses of project case studies (/<username>/work/<id>)
    username?: string;
}

// Draws a creator page from its JSON document. The same component is the public page, the
// editor's live preview and the landing page's examples, so they can never look different.
// It sizes itself to its box (container queries), not the window, which is what lets the
// editor show a phone and a desktop preview side by side on one screen.
export function PageRenderer({ page, mode = "live", pageId, username }: PageRendererProps) {
    const { profile, theme } = page;
    // visitors never see hidden or off-schedule blocks, nor one left unfinished (a button that goes nowhere)
    const blocks = mode === "live" ? page.blocks.filter((block) => isLive(block) && !isUnfinished(block)) : page.blocks;
    const header = theme.layout.header;
    // a poster spans the whole width above everything, so the two-column layout doesn't apply
    const left = theme.layout.align === "left" && header !== "poster";

    // where a block's link goes: through the click counter on the live page, straight there elsewhere
    const linkOf = (block: Block) => {
        // a project with a case study opens its own page; /go sends it there too, after counting
        const target = hasCaseStudy(block) ? username && `/${username}/work/${block.id}` : targetOf(block);
        if (!target) return undefined;
        // UPI opens a payment app on the phone; sent straight there, a redirect could lose it
        if (target.startsWith("upi:")) return target;
        return mode === "live" && pageId ? `/go/${pageId}/${block.id}` : target;
    };

    return (
        <div
            style={themeStyle(theme)}
            className={`@container grain min-h-full w-full flex-1 font-(family-name:--page-body) text-(--page-text) ${mode === "preview" ? "[&_a]:pointer-events-none [&_iframe]:pointer-events-none" : ""}`}
        >
            {header === "poster" && <Poster profile={profile} />}
            {header === "banner" && <Banner src={profile.cover} />}

            <div
                className={`relative z-2 mx-auto w-full px-5 pb-10 @md:px-8 ${header === "classic" ? "pt-16" : "pt-8"} ${
                    left ? "max-w-5xl @4xl:grid @4xl:grid-cols-[1fr_1.25fr] @4xl:gap-16 @4xl:pt-24" : "max-w-xl"
                }`}
            >
                {header !== "poster" && (
                    <header className={`rise ${left ? "@4xl:sticky @4xl:top-24 @4xl:self-start" : "text-center"}`}>
                        {header === "banner" ? (
                            // the photo sits on the cover's bottom edge, half over it
                            <div className={`relative -mt-[4.5rem] w-fit rounded-full ring-4 ring-(--page-base) ${left ? "" : "mx-auto"}`}>
                                <Avatar src={profile.avatar} name={profile.name} shape={theme.layout.avatar === "hidden" ? "circle" : theme.layout.avatar} centered={false} />
                            </div>
                        ) : (
                            <Avatar src={profile.avatar} name={profile.name} shape={theme.layout.avatar} centered={!left} />
                        )}
                        <Profile profile={profile} centered={!left} />
                    </header>
                )}

                <main className={`flex flex-col gap-3 ${header === "poster" ? "" : "mt-10"} ${left ? "@4xl:mt-0" : ""}`}>
                    {blocks.length === 0 && mode === "preview" && <Placeholder text="Your blocks will appear here" />}

                    {blocks.map((block, i) => (
                        <BlockFrame key={block.id} block={block} order={Math.min(i + 1, 12)} preview={mode === "preview"}>
                            <BlockView block={block} linkOf={linkOf} pageId={mode === "live" ? pageId : undefined} />
                        </BlockFrame>
                    ))}
                </main>

                <footer className={`mt-16 text-xs text-(--page-muted) ${left ? "@4xl:col-start-2" : "text-center"}`}>
                    <Link href="/" className="tracking-[0.18em] uppercase opacity-70 transition hover:opacity-100">
                        Composed with <span className="font-display text-sm tracking-normal normal-case">Roselle</span>
                    </Link>
                    {/* quiet, but always there: how a visitor flags a scam or an impersonator */}
                    {mode === "live" && pageId && (
                        <p className="mt-3">
                            <Link href={`/report?page=${pageId}`} rel="nofollow" className="opacity-50 transition hover:opacity-100">
                                Report this page
                            </Link>
                        </p>
                    )}
                </footer>
            </div>
        </div>
    );
}

// The name, bio and social icons: the same under every header style
function Profile({ profile, centered, size = "regular" }: { profile: PageDoc["profile"]; centered: boolean; size?: "regular" | "poster" }) {
    return (
        <>
            <h1
                style={{ fontWeight: "var(--page-heading-weight)" }}
                className={`font-(family-name:--page-heading) leading-[0.98] tracking-[-0.025em] text-balance ${
                    size === "poster" ? "text-[3.4rem] @md:text-7xl" : "mt-6 text-[2.5rem] @md:text-5xl"
                }`}
            >
                {profile.name || "Your name"}
            </h1>

            {profile.bio && (
                <p className={`mt-4 text-[15px] leading-relaxed whitespace-pre-line text-pretty text-(--page-muted) ${centered ? "mx-auto max-w-md" : ""}`}>{profile.bio}</p>
            )}

            {profile.socials.length > 0 && (
                <ul className={`mt-6 flex flex-wrap gap-1 ${centered ? "justify-center" : "-ml-2.5"}`}>
                    {profile.socials.map((social) => {
                        const target = safeHref(social.url);
                        if (!target) return null;
                        return (
                            <li key={social.platform}>
                                <a
                                    href={target}
                                    target="_blank"
                                    rel="noopener noreferrer me"
                                    aria-label={social.platform}
                                    className="flex size-10 items-center justify-center rounded-full opacity-80 transition hover:bg-[color-mix(in_oklab,var(--page-text)_10%,transparent)] hover:opacity-100"
                                >
                                    <SocialIcon platform={social.platform} size={19} />
                                </a>
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}

// The photo filling the top of the page edge to edge, fading into the page's colour at the
// bottom, with the name set big across it: the page as a poster
function Poster({ profile }: { profile: PageDoc["profile"] }) {
    const photo = safeHref(profile.avatar);

    return (
        <header className="relative z-2 flex aspect-[4/5] max-h-[88cqh] min-h-[420px] w-full flex-col justify-end overflow-hidden text-center @3xl:aspect-[16/8]">
            {photo ? (
                <img src={photo} alt={profile.name} className="absolute inset-0 size-full object-cover" />
            ) : (
                <span className="absolute inset-0 bg-[color-mix(in_oklab,var(--page-text)_14%,transparent)]" />
            )}
            {/* the picture melts into the page below it */}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,color-mix(in_oklab,var(--page-base)_70%,transparent)_70%,var(--page-base)_100%)]" />
            <div className="rise relative mx-auto w-full max-w-xl px-5 pb-6 @md:px-8">
                <Profile profile={profile} centered size="poster" />
            </div>
        </header>
    );
}

// A wide picture across the top. Without a cover of its own it's a soft wash of the page's own
// colours, so the top still has a shape without a second copy of the face.
function Banner({ src }: { src: string }) {
    const photo = safeHref(src);

    return (
        <div className="relative z-1 h-44 w-full overflow-hidden rounded-b-[2rem] @md:h-64">
            {photo ? (
                <img src={photo} alt="" className="size-full object-cover" />
            ) : (
                <span className="block size-full bg-[radial-gradient(120%_90%_at_85%_0%,color-mix(in_oklab,var(--page-muted)_55%,transparent),transparent_65%),linear-gradient(160deg,color-mix(in_oklab,var(--page-text)_22%,var(--page-base)),var(--page-base))]" />
            )}
        </div>
    );
}

// In the editor, a hidden or not-yet-scheduled block still shows, faded, with a tag saying why
function BlockFrame({ block, order, preview, children }: { block: Block; order: number; preview: boolean; children: ReactNode }) {
    const off = preview && !isLive(block);

    return (
        <section className={`rise relative ${off ? "opacity-45" : ""}`} style={{ "--order": order } as CSSProperties}>
            {off && (
                <span className="absolute -top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-white">
                    {block.visible ? <IconClock size={11} /> : <IconEyeOff size={11} />}
                    {block.visible ? "Scheduled" : "Hidden"}
                </span>
            )}
            {children}
        </section>
    );
}

// A block with nothing in it yet: the editor shows a placeholder, visitors see nothing
function isUnfinished(block: Block) {
    if (block.type === "link" || block.type === "tip") return !targetOf(block);
    if (block.type === "music") return !musicEmbed(block.url);
    if (block.type === "video") return !videoEmbed(block.url);
    if (block.type === "map") return !block.address.trim();
    return false;
}

function BlockView({ block, linkOf, pageId }: { block: Block; linkOf: (block: Block) => string | undefined; pageId?: number }) {
    switch (block.type) {
        case "link": {
            const href = linkOf(block);
            const thumbnail = safeHref(block.thumbnail);
            // a picture wins over an icon; either takes the same square on the left
            const icon = !thumbnail && block.icon ? block.icon : null;
            return (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`page-button group flex w-full items-center gap-2 px-3 font-semibold ${block.featured ? "min-h-17 text-base" : "min-h-14 text-[15px]"}`}
                >
                    {/* the empty square keeps the title centred when there's no picture */}
                    {thumbnail ? (
                        <img src={thumbnail} alt="" loading="lazy" className="size-10 shrink-0 rounded-[min(calc(var(--page-radius)*0.6),0.75rem)] object-cover" />
                    ) : icon ? (
                        <span className="flex size-10 shrink-0 items-center justify-center">
                            <LinkIcon name={icon} size={22} />
                        </span>
                    ) : (
                        <span className="w-6 shrink-0" />
                    )}
                    <span className="flex-1 text-center text-pretty">{block.title || "Untitled link"}</span>
                    {/* as wide as the picture on the left, so the title sits truly in the middle */}
                    <span className={`flex shrink-0 items-center justify-end ${thumbnail || icon ? "w-10" : "w-6"}`}>
                        <IconArrowUpRight size={16} className="opacity-50 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </span>
                </a>
            );
        }

        case "heading":
            return <h2 className="mt-6 mb-1 text-xs font-semibold tracking-[0.22em] text-(--page-muted) uppercase">{block.text}</h2>;

        case "text":
            return <p className="text-[15px] leading-relaxed whitespace-pre-line text-pretty opacity-90">{block.text}</p>;

        case "image": {
            const src = safeHref(block.src);
            if (!src) return <Placeholder text="Add an image" />;

            const href = linkOf(block);
            const picture = <img src={src} alt={block.alt} loading="lazy" className="w-full rounded-[min(var(--page-radius),1.5rem)] object-cover" />;
            return (
                <figure>
                    {/* a picture that links somewhere goes there; one that doesn't opens full screen */}
                    {href ? (
                        <a href={href} target="_blank" rel="noopener noreferrer">
                            {picture}
                        </a>
                    ) : (
                        <Zoom group={block.id} src={src} alt={block.caption || block.alt}>
                            {picture}
                        </Zoom>
                    )}
                    {block.caption && <figcaption className="mt-2 text-xs text-(--page-muted)">{block.caption}</figcaption>}
                </figure>
            );
        }

        case "video": {
            const embed = videoEmbed(block.url);
            if (!embed) return <Placeholder text="Paste a YouTube or Vimeo link" />;
            return (
                <div className="aspect-video overflow-hidden rounded-[min(var(--page-radius),1.5rem)] bg-black/20">
                    <iframe
                        src={embed}
                        title={block.title || "Video"}
                        loading="lazy"
                        allow="encrypted-media; picture-in-picture; fullscreen"
                        referrerPolicy="strict-origin-when-cross-origin"
                        className="size-full"
                    />
                </div>
            );
        }

        case "gallery": {
            const images = block.images.filter((image) => safeHref(image.src));
            const corner = "rounded-[min(calc(var(--page-radius)*0.75),1rem)]";
            return (
                <div>
                    {block.title && <h3 className="mb-3 text-xs font-semibold tracking-[0.22em] text-(--page-muted) uppercase">{block.title}</h3>}
                    {images.length === 0 ? (
                        <Placeholder text="Add images to the gallery" />
                    ) : block.layout === "masonry" ? (
                        // columns that keep every picture's own shape, like a contact sheet
                        <div className="columns-2 gap-2 @2xl:columns-3">
                            {images.map((image, i) => (
                                <Zoom key={i} group={block.id} src={safeHref(image.src)!} alt={image.alt} className="mb-2 break-inside-avoid">
                                    <img src={safeHref(image.src)} alt={image.alt} loading="lazy" className={`w-full ${corner}`} />
                                </Zoom>
                            ))}
                        </div>
                    ) : block.layout === "carousel" ? (
                        // one row that runs off the edge, so it's clearly swipeable; each picture snaps into place
                        <div className="-mx-5 flex snap-x snap-mandatory gap-2 overflow-x-auto px-5 [scrollbar-width:none] @md:-mx-8 @md:px-8">
                            {images.map((image, i) => (
                                <Zoom key={i} group={block.id} src={safeHref(image.src)!} alt={image.alt} className="w-auto! shrink-0 snap-center">
                                    <img src={safeHref(image.src)} alt={image.alt} loading="lazy" className={`h-72 w-auto max-w-[85cqw] object-cover @md:h-96 ${corner}`} />
                                </Zoom>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-2 @2xl:grid-cols-3">
                            {images.map((image, i) => (
                                <Zoom
                                    key={i}
                                    group={block.id}
                                    src={safeHref(image.src)!}
                                    alt={image.alt}
                                    // three pictures in two columns: the first spans the row, so none is left alone
                                    className={images.length === 3 && i === 0 ? "col-span-2 @2xl:col-span-1" : ""}
                                >
                                    <img
                                        src={safeHref(image.src)}
                                        alt={image.alt}
                                        loading="lazy"
                                        className={`aspect-square w-full object-cover ${corner} ${images.length === 3 && i === 0 ? "aspect-2/1 @2xl:aspect-square" : ""}`}
                                    />
                                </Zoom>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        case "project": {
            const href = linkOf(block);
            const image = safeHref(block.image);
            const caseStudy = hasCaseStudy(block);
            const body = (
                <>
                    {image && <img src={image} alt="" loading="lazy" className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.03]" />}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <h3 style={{ fontWeight: "var(--page-heading-weight)" }} className="font-(family-name:--page-heading) text-xl leading-tight">{block.title}</h3>
                            {href && !caseStudy && <IconArrowUpRight size={16} className="mt-1 shrink-0 opacity-50 transition group-hover:opacity-100" />}
                        </div>
                        {block.description && <p className="mt-2 text-sm leading-relaxed text-pretty text-(--page-muted)">{block.description}</p>}
                        {block.tags.length > 0 && (
                            <ul className="mt-4 flex flex-wrap gap-1.5">
                                {block.tags.map((tag) => (
                                    <li key={tag} className="rounded-full border border-[color-mix(in_oklab,var(--page-text)_20%,transparent)] px-2.5 py-0.5 text-[11px] tracking-wide">
                                        {tag}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {caseStudy && (
                            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
                                Read the case study <IconArrowRight size={15} className="transition group-hover:translate-x-0.5" />
                            </span>
                        )}
                    </div>
                </>
            );
            return href ? (
                // a case study opens here, on Roselle; anything else in a new tab
                <a href={href} {...(caseStudy ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="page-card group block overflow-hidden">
                    {body}
                </a>
            ) : (
                <div className="page-card group overflow-hidden">{body}</div>
            );
        }

        case "contact":
            return (
                <div className="page-card p-5 @md:p-6">
                    <h3 style={{ fontWeight: "var(--page-heading-weight)" }} className="font-(family-name:--page-heading) text-2xl leading-tight">
                        {block.title || "Work with me"}
                    </h3>
                    {block.text && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-pretty text-(--page-muted)">{block.text}</p>}
                    <ContactForm pageId={pageId} blockId={block.id} button={block.button || "Send message"} />
                </div>
            );

        case "music": {
            const embed = musicEmbed(block.url);
            if (!embed) return <Placeholder text="Paste a Spotify, Apple Music or SoundCloud link" />;
            return (
                <iframe
                    src={embed.src}
                    title={block.title || "Music"}
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    style={{ height: embed.height }}
                    className="w-full rounded-[min(var(--page-radius),0.85rem)] border-0"
                />
            );
        }

        case "map": {
            if (!block.address.trim()) return <Placeholder text="Add an address to show a map" />;
            return (
                <div className="page-card overflow-hidden">
                    <iframe src={mapEmbed(block.address)} title={block.title || `Map of ${block.address}`} loading="lazy" className="block aspect-16/10 w-full border-0" />
                    {/* the map is for looking; this opens directions in the visitor's own maps app */}
                    <a href={mapLink(block.address)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 p-4">
                        <IconMapPin size={18} className="shrink-0 opacity-70" />
                        <span className="min-w-0 flex-1">
                            <span className="block font-semibold">{block.title || block.address}</span>
                            {block.title && <span className="block truncate text-sm text-(--page-muted)">{block.address}</span>}
                        </span>
                        <IconArrowUpRight size={16} className="shrink-0 opacity-50 transition group-hover:opacity-100" />
                    </a>
                </div>
            );
        }

        case "tip": {
            const href = linkOf(block);
            if (!href) return <Placeholder text="Add where people can pay you" />;

            const upi = href.startsWith("upi:");
            const Icon = upi ? IconCurrencyRupee : block.provider === "kofi" || block.provider === "buymeacoffee" ? IconCoffee : IconHeart;
            return (
                <div className="flex flex-col gap-3">
                    <a href={href} target={upi ? undefined : "_blank"} rel="noopener noreferrer" className="page-button flex min-h-14 w-full items-center gap-2 px-3 py-2 text-[15px] font-semibold">
                        <span className="flex size-10 shrink-0 items-center justify-center">
                            <Icon size={22} stroke={1.6} aria-hidden />
                        </span>
                        <span className="flex-1 text-center text-pretty">
                            {block.title || "Support me"}
                            {block.provider !== "link" && <span className="block text-xs font-normal opacity-70">with {TIP_LABELS[block.provider]}</span>}
                        </span>
                        <span className="w-10 shrink-0" />
                    </a>
                    {/* a UPI link only opens on a phone; someone on a computer scans this with theirs */}
                    {upi && (
                        <div className="page-card flex items-center gap-4 p-4">
                            <QrCode value={href} size={104} className="shrink-0 rounded-lg" />
                            <p className="text-sm text-pretty text-(--page-muted)">On a computer? Scan this with any UPI app to pay.</p>
                        </div>
                    )}
                </div>
            );
        }
    }
}

// A picture that opens full screen (src/components/Lightbox.tsx), with the others in its group
export function Zoom({ group, src, alt, className = "", children }: { group: string; src: string; alt: string; className?: string; children: ReactNode }) {
    return (
        <button type="button" data-zoom={group} data-src={src} data-alt={alt} aria-label={alt ? `View larger: ${alt}` : "View larger"} className={`block w-full cursor-zoom-in ${className}`}>
            {children}
        </button>
    );
}

function Placeholder({ text }: { text: string }) {
    return (
        <div className="flex h-32 items-center justify-center rounded-[min(var(--page-radius),1.5rem)] border border-dashed border-[color-mix(in_oklab,var(--page-text)_25%,transparent)] text-xs text-(--page-muted)">
            {text}
        </div>
    );
}

function Avatar({ src, name, shape, centered }: { src: string; name: string; shape: Theme["layout"]["avatar"]; centered: boolean }) {
    if (shape === "hidden") return null;

    const url = safeHref(src);
    const initials = name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "R";

    return (
        <div
            className={`overflow-hidden bg-[color-mix(in_oklab,var(--page-text)_12%,transparent)] ring-1 ring-[color-mix(in_oklab,var(--page-text)_18%,transparent)] ${
                shape === "circle" ? "size-24 rounded-full" : "h-32 w-24 rounded-t-full rounded-b-md"
            } ${centered ? "mx-auto" : ""}`}
        >
            {url ? (
                <img src={url} alt={name} className="size-full object-cover" />
            ) : (
                <span className="flex size-full items-center justify-center font-(family-name:--page-heading) text-2xl">{initials}</span>
            )}
        </div>
    );
}

// ---------- the theme as CSS variables ----------

const RADIUS = { sharp: "3px", rounded: "14px", pill: "999px" };

// Everything a template can change ends up in these few variables; .page-button and .page-card
// in globals.css read them
export function themeStyle(theme: Theme) {
    const { button } = theme;

    return {
        background: pageBackground(theme),
        // the page's main colour, for things that fade or sit into it (poster, banner photo ring)
        "--page-base": theme.background.colors[0],
        "--page-text": theme.text,
        "--page-muted": theme.muted,
        "--page-heading": FONTS[theme.font.heading].css,
        "--page-heading-weight": FONTS[theme.font.heading].weight,
        "--page-body": FONTS[theme.font.body].css,
        "--page-radius": RADIUS[button.shape],
        "--page-button-text": button.textColor,
        "--page-button-bg": {
            pop: button.color,
            solid: button.color,
            outline: "transparent",
            soft: `color-mix(in oklab, ${button.color} 12%, transparent)`,
            glass: `color-mix(in oklab, ${button.color} 9%, transparent)`,
        }[button.style],
        "--page-button-border": {
            pop: button.textColor,
            solid: button.color,
            outline: button.color,
            soft: "transparent",
            glass: `color-mix(in oklab, ${button.color} 22%, transparent)`,
        }[button.style],
        "--page-button-shadow":
            button.style === "pop" ? `4px 4px 0 0 ${button.textColor}` : button.shadow ? `0 14px 34px -14px color-mix(in oklab, ${button.color} 70%, black)` : "none",
        "--page-button-border-width": button.style === "pop" ? "2px" : "1px",
        "--page-blur": button.style === "glass" ? "blur(14px) saturate(1.3)" : "none",
    } as CSSProperties;
}
