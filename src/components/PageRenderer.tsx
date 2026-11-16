/* eslint-disable @next/next/no-img-element -- creators' images come from any host, next/image would need each one listed */
import { Fragment, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { IconArrowDown, IconArrowRight, IconArrowUpRight, IconStarFilled, IconClock, IconCoffee, IconCurrencyRupee, IconEyeOff, IconHeart, IconMapPin } from "@tabler/icons-react";

import { FONTS } from "@/lib/pages/theme";
import { pageBackground } from "@/lib/pages/patterns";
import { destinationOf, hasCaseStudy, isLive, mapEmbed, mapLink, musicEmbed, safeHref, targetOf, TIP_LABELS, videoEmbed } from "@/lib/pages/links";
import type { Block, PageDoc, Theme } from "@/lib/validations/page";
import type { PublicReview } from "@/lib/reviews";
import { LinkIcon, SocialIcon } from "./SocialIcon";
import { QrCode } from "./QrCode";
import { ContactForm } from "./ContactForm";
import { ServicesBlock } from "./ServicesBlock";
import { HireBar } from "./HireBar";
import { CodeChip } from "./CodeChip";
import { Carousel } from "./Carousel";
import { sized } from "@/lib/media/sized";
import { ShareButton } from "./ShareButton";
import { SectionTitle } from "./SectionTitle";

interface PageRendererProps {
    page: PageDoc;
    // "live" is the public page: links are tracked, hidden blocks left out.
    // "preview" is the editor and the landing page: links do nothing, hidden blocks show faded.
    mode?: "live" | "preview";
    // live pages send link clicks through /go/<pageId>/<blockId> to count them
    pageId?: number;
    // for the addresses of project case studies (/<username>/work/<id>)
    username?: string;
    // the approved reviews, for a Reviews block (they're stored apart from the page)
    reviews?: PublicReview[];
    // the editor's Arrange mode puts its controls around each block (index: its place in page.blocks)
    wrap?: (block: Block, index: number, view: ReactNode) => ReactNode;
    // the "Composed with Roselle" line at the foot: on free pages, gone on Pro. "upgrade" adds a
    // link to remove it, for the creator's own editor.
    badge?: boolean | "upgrade";
}

// Draws a creator page from its JSON document. The same component is the public page, the
// editor's live preview and the landing page's examples, so they can never look different.
// It sizes itself to its box (container queries), not the window, which is what lets the
// editor show a phone and a desktop preview side by side on one screen.
export function PageRenderer({ page, mode = "live", pageId, username, reviews = [], wrap, badge = true }: PageRendererProps) {
    const { profile, theme } = page;
    // visitors never see hidden or off-schedule blocks, nor one left unfinished (a button that goes nowhere)
    // (a Reviews block with nothing approved yet is unfinished too)
    const blocks = mode === "live" ? page.blocks.filter((block) => isLive(block) && !isUnfinished(block) && !(block.type === "reviews" && reviews.length === 0)) : page.blocks;
    const header = theme.layout.header;
    const left = theme.layout.align === "left";

    // The way to hire this creator: their services, or else their contact form. The header's button
    // and, on phones, the bar at the bottom both take visitors there.
    const hire = blocks.find((block) => block.type === "services") ?? blocks.find((block) => block.type === "contact");
    const firstName = profile.name.trim().split(/\s+/)[0];
    const cta = hire && { href: `#${hire.id}`, label: hire.type === "services" ? "Work with me" : "Get in touch" };
    const fromPrice = hire?.type === "services" ? (hire.items.find((item) => item.featured && item.price) ?? hire.items.find((item) => item.price))?.price : undefined;

    // where a block's link goes: through the click counter on the live page, straight there elsewhere
    // (itemId: which pick, in a Picks block)
    const linkOf = (block: Block, itemId?: string) => {
        const target = destinationOf(block, username, itemId);
        if (!target) return undefined;
        // UPI opens a payment app on the phone; sent straight there, a redirect could lose it
        if (target.startsWith("upi:")) return target;
        return mode === "live" && pageId ? `/go/${pageId}/${block.id}${itemId ? `?item=${encodeURIComponent(itemId)}` : ""}` : target;
    };

    return (
        // On a phone the page is the whole screen. On anything wider it becomes a phone-width card
        // (like Linktree), centred on a darker shade of its own background: one design that reads
        // well everywhere, rather than a second layout to get wrong. The card is its own @container,
        // so everything inside lays itself out for the card's width, never the window's.
        <div
            style={themeStyle(theme)}
            // the live page scrolls smoothly to its sections (globals.css); previews don't scroll the window
            data-live-page={mode === "live" ? "" : undefined}
            data-titles={theme.layout.titles}
            className={`@container relative min-h-full w-full flex-1 font-(family-name:--page-body) text-(--page-text) ${mode === "preview" ? "[&_a]:pointer-events-none [&_iframe]:pointer-events-none" : ""}`}
        >
            {/* the backdrop around the card: the page's own background, darkened */}
            <span aria-hidden className="absolute inset-0 hidden bg-black/35 @2xl:block" />

            <div
                style={{ background: pageBackground(theme) }}
                className="@container grain relative mx-auto min-h-full w-full @2xl:my-10 @2xl:min-h-0 @2xl:max-w-[580px] @2xl:overflow-hidden @2xl:rounded-[2rem] @2xl:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.6)]"
            >
                {mode === "live" && username && <ShareButton name={profile.name || username} />}

                {header === "poster" && <Poster profile={profile} cta={cta} live={mode === "live"} />}
                {header === "banner" && <Banner src={profile.cover} live={mode === "live"} />}

                <div className={`relative z-2 mx-auto w-full max-w-xl px-5 pb-10 @md:px-8 ${header === "classic" ? "pt-16" : "pt-8"}`}>
                    {header !== "poster" && (
                        <header id={mode === "live" ? "page-intro" : undefined} className={`rise ${left ? "" : "text-center"}`}>
                            {header === "banner" ? (
                                // the photo sits on the cover's bottom edge, half over it
                                <div className={`relative -mt-[4.5rem] w-fit rounded-full ring-4 ring-(--page-base) ${left ? "" : "mx-auto"}`}>
                                    <Avatar src={profile.avatar} name={profile.name} shape={theme.layout.avatar === "hidden" ? "circle" : theme.layout.avatar} centered={false} live={mode === "live"} />
                                </div>
                            ) : (
                                <Avatar src={profile.avatar} name={profile.name} shape={theme.layout.avatar} centered={!left} live={mode === "live"} />
                            )}
                            <Profile profile={profile} centered={!left} cta={cta} />
                        </header>
                    )}

                    <main className={`flex flex-col gap-3 ${header === "poster" ? "" : "mt-10"}`}>
                        {blocks.length === 0 && mode === "preview" && <Placeholder text="Your blocks will appear here" />}

                        {blocks.map((block, i) => {
                            // a new kind of block starts a new section, with room above it; blocks of a kind
                            // stay together, and a heading keeps the section it introduces close
                            const previous = blocks[i - 1];
                            const spaced = !!previous && previous.type !== block.type && previous.type !== "heading";
                            const view = (
                                <BlockFrame key={block.id} block={block} order={Math.min(i + 1, 12)} preview={mode === "preview"} spaced={spaced}>
                                    <BlockView block={block} linkOf={linkOf} pageId={mode === "live" ? pageId : undefined} reviews={reviews} />
                                </BlockFrame>
                            );
                            return wrap ? <Fragment key={block.id}>{wrap(block, i, view)}</Fragment> : view;
                        })}
                    </main>

                    <footer className={`mt-16 text-xs text-(--page-muted) ${left ? "" : "text-center"}`}>
                        {badge && (
                            <Link href="/" className="tracking-[0.18em] uppercase opacity-70 transition hover:opacity-100">
                                Composed with <span className="font-display text-sm tracking-normal normal-case">Roselle</span>
                            </Link>
                        )}
                        {badge === "upgrade" && (
                            <Link href="/settings#plan" className="ml-2 rounded-full border border-current px-2 py-0.5 font-semibold opacity-60 transition hover:opacity-100">
                                Remove with Pro
                            </Link>
                        )}
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

            {mode === "live" && hire && <HireBar target={hire.id} label={firstName ? `Book ${firstName}` : "Work with me"} detail={fromPrice} />}
        </div>
    );
}

// The name, bio and social icons: the same under every header style
interface ProfileProps {
    profile: PageDoc["profile"];
    centered: boolean;
    size?: "regular" | "poster";
    // the button to the way to hire, when there is one
    cta?: { href: string; label: string };
}

function Profile({ profile, centered, size = "regular", cta }: ProfileProps) {
    return (
        <>
            <h1
                style={{ fontWeight: "var(--page-heading-weight)" }}
                className={`font-(family-name:--page-heading) leading-[0.98] tracking-[-0.025em] text-balance ${
                    size === "poster" ? "text-[calc(3.4rem*var(--page-heading-scale,1))] @md:text-[calc(4.5rem*var(--page-heading-scale,1))]" : "mt-6 text-[calc(2.5rem*var(--page-heading-scale,1))] @md:text-[calc(3rem*var(--page-heading-scale,1))]"
                }`}
            >
                {profile.name || "Your name"}
            </h1>

            {profile.bio && (
                <p className={`page-prose mt-4 leading-relaxed whitespace-pre-line text-pretty text-(--page-muted) ${centered ? "mx-auto max-w-md" : ""}`}>{profile.bio}</p>
            )}

            {cta && (
                <div className={`mt-6 flex ${centered ? "justify-center" : ""}`}>
                    <a href={cta.href} className="page-button inline-flex h-12 items-center gap-2 px-6 text-[15px] font-semibold">
                        {cta.label} <IconArrowDown size={16} />
                    </a>
                </div>
            )}

            {profile.socials.length > 0 && (
                <ul className={`mt-5 flex flex-wrap gap-1 ${centered ? "justify-center" : "-ml-2.5"}`}>
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
// bottom, with the name set big across it: the page as a poster. The photo is anchored a quarter of the way
// down, because faces sit high in a portrait and a wide screen crops its top and bottom.
function Poster({ profile, cta, live }: { profile: PageDoc["profile"]; cta?: ProfileProps["cta"]; live: boolean }) {
    const photo = safeHref(profile.avatar);

    return (
        <header
            // the anchor the booking bar watches (only one per page: the live one)
            id={live ? "page-intro" : undefined}
            className="relative z-2 flex aspect-[4/5] min-h-[420px] w-full flex-col justify-end overflow-hidden text-center"
        >
            {photo ? (
                <img src={sized(photo, 1000)} alt={profile.name} {...headerImage(live)} className="absolute inset-0 size-full object-cover object-[50%_25%] [mask-image:linear-gradient(to_bottom,black_50%,transparent_100%)]" />
            ) : (
                <span className="absolute inset-0 bg-[color-mix(in_oklab,var(--page-text)_14%,transparent)]" />
            )}
            {/* the picture melts into the page below it: the photo fades out (its mask) and this
                shade keeps the name readable, ending clear so nothing meets the background in a line */}
            <span className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,color-mix(in_oklab,var(--page-base)_55%,transparent)_72%,transparent_100%)]" />
            <div className="rise relative mx-auto w-full max-w-xl px-5 pb-6 @md:px-8">
                <Profile profile={profile} centered size="poster" cta={cta} />
            </div>
        </header>
    );
}

// The pictures at the top of a page. On a live page they're the first thing seen, so the
// browser fetches them before anything else; in the editor and on the landing page, where
// dozens of pages show at once, each waits until it's near the screen.
const headerImage = (live: boolean) => (live ? ({ fetchPriority: "high" } as const) : ({ loading: "lazy" } as const));

// A wide picture across the top. Without a cover of its own it's a soft wash of the page's own
// colours, so the top still has a shape without a second copy of the face.
function Banner({ src, live }: { src: string; live: boolean }) {
    const photo = safeHref(src);

    return (
        <div className="relative z-1 h-44 w-full overflow-hidden rounded-b-[2rem] @md:h-64">
            {photo ? (
                <img src={sized(photo, 1200)} alt="" {...headerImage(live)} className="size-full object-cover" />
            ) : (
                <span className="block size-full bg-[radial-gradient(120%_90%_at_85%_0%,color-mix(in_oklab,var(--page-muted)_55%,transparent),transparent_65%),linear-gradient(160deg,color-mix(in_oklab,var(--page-text)_22%,var(--page-base)),var(--page-base))]" />
            )}
        </div>
    );
}

// In the editor, a hidden or not-yet-scheduled block still shows, faded, with a tag saying why
function BlockFrame({ block, order, preview, spaced, children }: { block: Block; order: number; preview: boolean; spaced: boolean; children: ReactNode }) {
    const off = preview && !isLive(block);

    return (
        <section id={preview ? undefined : block.id} className={`rise relative scroll-mt-6 ${spaced ? "mt-9 @md:mt-14" : ""} ${off ? "opacity-45" : ""}`} style={{ "--order": order } as CSSProperties}>
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
    if (block.type === "services") return !block.items.some((item) => item.name.trim());
    // a gallery with no photos yet, a picture with no picture
    if (block.type === "gallery") return !block.images.some((image) => safeHref(image.src));
    if (block.type === "image") return !safeHref(block.src);
    if (block.type === "picks") return !block.items.some((item) => safeHref(item.image));
    if (block.type === "stats") return !block.items.some((item) => item.value.trim());
    return false;
}

interface BlockViewProps {
    block: Block;
    linkOf: (block: Block, itemId?: string) => string | undefined;
    pageId?: number;
    reviews: PublicReview[];
}

function BlockView({ block, linkOf, pageId, reviews }: BlockViewProps) {
    switch (block.type) {
        case "link": {
            const href = linkOf(block);
            const thumbnail = safeHref(block.thumbnail);
            // a picture wins over an icon; either takes the same square on the left
            const icon = !thumbnail && block.icon ? block.icon : null;
            const button = block.featured && thumbnail ? (
                // a highlighted link with a picture: the picture big, the title under it
                <a href={href} target="_blank" rel="noopener noreferrer" style={{ borderRadius: "min(var(--page-radius), 1.75rem)" }} className="page-button group block overflow-hidden p-2 font-semibold">
                    <span className="block aspect-[16/9] overflow-hidden rounded-[min(calc(var(--page-radius)-0.5rem),1.25rem)]">
                        <img src={sized(thumbnail, 900)} alt="" loading="lazy" className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.03]" />
                    </span>
                    <span className="block px-3 pt-3 pb-2 text-center text-[15px] text-pretty">
                        {block.title || "Untitled link"}
                        {block.subtitle && <span className="mt-0.5 block text-xs font-normal opacity-70">{block.subtitle}</span>}
                    </span>
                </a>
            ) : (
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`page-button group flex w-full items-center gap-2 px-3 font-semibold ${block.featured ? "min-h-17 text-base" : "min-h-14 text-[15px]"}`}
                >
                    {/* the empty square keeps the title centred when there's no picture */}
                    {thumbnail ? (
                        <img src={sized(thumbnail, 120)} alt="" loading="lazy" className="size-10 shrink-0 rounded-[min(calc(var(--page-radius)*0.6),0.75rem)] object-cover" />
                    ) : icon ? (
                        <span className="flex size-10 shrink-0 items-center justify-center">
                            <LinkIcon name={icon} size={22} />
                        </span>
                    ) : (
                        <span className="w-6 shrink-0" />
                    )}
                    <span className="flex-1 text-center text-pretty">
                        {block.title || "Untitled link"}
                        {block.subtitle && <span className="mt-0.5 block text-xs font-normal opacity-70">{block.subtitle}</span>}
                    </span>
                    {/* as wide as the picture on the left, so the title sits truly in the middle */}
                    <span className={`flex shrink-0 items-center justify-end ${thumbnail || icon ? "w-10" : "w-6"}`}>
                        <IconArrowUpRight size={16} className="opacity-50 transition duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                    </span>
                </a>
            );
            // a discount code sits under its link, copied with a tap
            return block.code ? (
                <div className="flex flex-col gap-2">
                    {button}
                    <CodeChip code={block.code} />
                </div>
            ) : (
                button
            );
        }

        case "heading":
            return <SectionTitle className="mb-1">{block.text}</SectionTitle>;

        case "text":
            return <p className="page-prose leading-relaxed whitespace-pre-line text-pretty opacity-90">{block.text}</p>;

        case "image": {
            const src = safeHref(block.src);
            if (!src) return <Placeholder text="Add an image" />;

            const href = linkOf(block);
            const picture = <img src={sized(src, 1200)} alt={block.alt} loading="lazy" className="w-full rounded-[min(var(--page-radius),1.5rem)] object-cover" />;
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
            if (images.length === 0) return <Placeholder text="Add images to the gallery" />;

            // inside the column with the rest of the page, rounded, even gaps
            const corner = "rounded-[min(calc(var(--page-radius)*0.75),1rem)]";
            const picture = (image: (typeof images)[number], className = "") => (
                <img src={sized(safeHref(image.src)!, 900)} alt={image.alt} loading="lazy" className={`size-full object-cover transition duration-700 ease-out @md:group-hover:scale-[1.04] ${className}`} />
            );
            const tile = (image: (typeof images)[number], className: string, key?: number) => (
                <Zoom key={key} group={block.id} src={safeHref(image.src)!} alt={image.alt} className={`group overflow-hidden ${corner} ${className}`}>
                    {picture(image)}
                </Zoom>
            );
            // with three or more in a grid or masonry, the first leads, large
            const lead = block.layout !== "carousel" && images.length >= 3 ? images[0] : null;
            const rest = lead ? images.slice(1) : images;

            return (
                <div>
                    {block.title && <SectionTitle className="mb-4">{block.title}</SectionTitle>}
                    {block.layout === "carousel" ? (
                        // every picture the same shape, the next one peeking in, arrows on the edges
                        <Carousel label={block.title || "Photos"}>
                            {images.map((image, i) => tile(image, "aspect-[4/5] w-[72%]! shrink-0 snap-start @md:w-[42%]!", i))}
                        </Carousel>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {lead && tile(lead, "aspect-[4/5] [&_img]:object-[50%_30%]")}
                            {block.layout === "masonry" ? <Mosaic count={rest.length}>{(i, shape) => tile(rest[i], shape, i)}</Mosaic> : (
                                // squares, two to a row; an odd one out at the end takes the whole row, so none is left alone
                                <div className="grid grid-cols-2 gap-2">
                                    {rest.map((image, i) => tile(image, "aspect-square [&:last-child:nth-child(odd)]:col-span-2 [&:last-child:nth-child(odd)]:aspect-[2/1]", i))}
                                </div>
                            )}
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
                    {image && <img src={sized(image, 1200)} alt="" loading="lazy" className="aspect-video w-full object-cover transition duration-700 group-hover:scale-[1.03]" />}
                    <div className="p-5">
                        <div className="flex items-start justify-between gap-4">
                            <h3 style={{ fontWeight: "var(--page-title-weight)" }} className="font-(family-name:--page-title) text-xl leading-tight">{block.title}</h3>
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

        case "services":
            return block.items.some((item) => item.name.trim()) ? <ServicesBlock block={block} pageId={pageId} /> : <Placeholder text="Add the services you offer" />;

        case "picks": {
            const items = block.items.filter((item) => safeHref(item.image));
            if (items.length === 0) return <Placeholder text="Add your picks" />;
            return (
                <div>
                    {block.title && <SectionTitle className="mb-4">{block.title}</SectionTitle>}
                    {/* each: a picture, a name, a price or a note; a pick without a link is just a picture */}
                    {block.layout === "carousel" ? (
                        <Carousel label={block.title || "Picks"}>
                            {items.map((item) => (
                                <div key={item.id} className="w-[44%] shrink-0 snap-start @md:w-[31%]">
                                    <Pick item={item} href={linkOf(block, item.id)} />
                                </div>
                            ))}
                        </Carousel>
                    ) : (
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-5">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <Pick item={item} href={linkOf(block, item.id)} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            );
        }

        case "stats": {
            const items = block.items.filter((item) => item.value.trim());
            if (items.length === 0) return <Placeholder text="Add your numbers" />;
            return (
                <div>
                    {block.title && <SectionTitle className="mb-4">{block.title}</SectionTitle>}
                    {/* the numbers side by side, thin rules between them */}
                    <dl className="grid divide-x divide-[color-mix(in_oklab,var(--page-text)_18%,transparent)] text-center" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
                        {items.map((item) => (
                            <div key={item.id} className="flex flex-col-reverse px-2">
                                <dt className="mt-1 text-[11px] tracking-[0.12em] text-(--page-muted) uppercase">{item.label}</dt>
                                <dd style={{ fontWeight: "var(--page-title-weight)" }} className="font-(family-name:--page-title) text-[1.75rem] leading-none tabular-nums @md:text-[2.1rem]">
                                    {item.value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            );
        }

        case "reviews":
            return reviews.length ? <Reviews title={block.title} reviews={reviews} /> : <Placeholder text="Reviews you approve will appear here" />;

        case "contact":
            return (
                <div className="page-card p-5 @md:p-6">
                    <h3 style={{ fontWeight: "var(--page-heading-weight)" }} className="font-(family-name:--page-heading) text-2xl leading-tight">
                        {block.title || "Work with me"}
                    </h3>
                    {block.text && <p className="page-prose page-prose-small mt-2 leading-relaxed whitespace-pre-line text-pretty text-(--page-muted)">{block.text}</p>}
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

// What clients said: the average up top (real numbers, every review is from a paying client),
// then each review with its stars, words and who wrote it
function Reviews({ title, reviews }: { title: string; reviews: PublicReview[] }) {
    const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const [lead, ...others] = reviews;
    const stars = (rating: number, size = 14) => (
        <span className="flex gap-0.5" aria-label={`${rating} out of 5`}>
            {[1, 2, 3, 4, 5].map((star) => (
                <IconStarFilled key={star} size={size} aria-hidden className={star <= rating ? "" : "opacity-20"} />
            ))}
        </span>
    );
    const credit = (review: PublicReview) => (
        <>
            <span className="font-semibold">{review.name}</span>
            {review.service && <span className="text-(--page-muted)"> · {review.service}</span>}
        </>
    );

    return (
        <div>
            <div className="mb-5 flex items-end justify-between gap-3">
                {title && <SectionTitle>{title}</SectionTitle>}
                <p className="ml-auto flex shrink-0 items-center gap-1 pb-1 text-sm font-semibold tabular-nums" aria-label={`Rated ${average.toFixed(1)} out of 5 from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`}>
                    <IconStarFilled size={14} aria-hidden /> {average.toFixed(1)} <span className="font-normal text-(--page-muted)">· {reviews.length}</span>
                </p>
            </div>

            {/* the first one, large, as a pull quote: trust reads best in the client's own words */}
            <figure>
                <span aria-hidden className="block font-(family-name:--page-heading) text-7xl leading-[0.6] opacity-25">&ldquo;</span>
                <blockquote style={{ fontWeight: "min(var(--page-title-weight), 500)" }} className="mt-2 font-(family-name:--page-title) text-[1.55rem] leading-snug whitespace-pre-line text-pretty @md:text-[1.9rem]">
                    {lead.text}
                </blockquote>
                <figcaption className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    {stars(lead.rating)}
                    <span>{credit(lead)}</span>
                </figcaption>
            </figure>

            {others.length > 0 && (
                <ul className="mt-8 grid gap-3">
                    {others.map((review) => (
                        <li key={review.id} className="page-card p-5">
                            {stars(review.rating)}
                            <blockquote className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-pretty">{review.text}</blockquote>
                            <p className="mt-3 text-sm">{credit(review)}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// A picture that opens full screen (src/components/Lightbox.tsx), with the others in its group
// One pick in a Picks block: its picture, its name, its price or note
function Pick({ item, href }: { item: Extract<Block, { type: "picks" }>["items"][number]; href?: string }) {
    const body = (
        <>
            <span className="block aspect-[4/5] overflow-hidden rounded-[min(var(--page-radius),1.25rem)] bg-[color-mix(in_oklab,var(--page-text)_8%,transparent)]">
                <img src={sized(safeHref(item.image)!, 600)} alt={item.title} loading="lazy" className="size-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]" />
            </span>
            {item.title && <span className="mt-2.5 block text-sm leading-snug font-semibold text-pretty">{item.title}</span>}
            {item.label && <span className="mt-0.5 block text-sm text-(--page-muted)">{item.label}</span>}
        </>
    );
    return href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="group block">
            {body}
        </a>
    ) : (
        <div className="group">{body}</div>
    );
}

// Two columns of pictures, tall and square in turn (opposite in each column), so it reads like a
// contact sheet, yet both columns always end level: the last picture in each stretches to the
// line, and an odd one out goes across the bottom, wide.
function Mosaic({ count, children: tile }: { count: number; children: (index: number, shape: string) => ReactNode }) {
    const paired = count - (count % 2);
    const column = (side: 0 | 1) =>
        Array.from({ length: paired / 2 }, (_, row) => {
            // down the first column, then the second, as the full-screen viewer steps through them
            const index = side * (paired / 2) + row;
            const tall = (row + side) % 2 === 0;
            return tile(index, `${tall ? "aspect-[4/5]" : "aspect-square"} last:flex-1`);
        });

    return (
        <>
            {paired > 0 && (
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-2">{column(0)}</div>
                    <div className="flex flex-col gap-2">{column(1)}</div>
                </div>
            )}
            {count % 2 === 1 && tile(count - 1, "aspect-[2/1]")}
        </>
    );
}

export function Zoom({ group, src, alt, className = "", children }: { group: string; src: string; alt: string; className?: string; children: ReactNode }) {
    return (
        <button type="button" data-zoom={group} data-src={sized(src, 2000)} data-alt={alt} aria-label={alt ? `View larger: ${alt}` : "View larger"} className={`block w-full cursor-zoom-in ${className}`}>
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

function Avatar({ src, name, shape, centered, live }: { src: string; name: string; shape: Theme["layout"]["avatar"]; centered: boolean; live: boolean }) {
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
                <img src={sized(url, 300)} alt={name} {...headerImage(live)} className="size-full object-cover" />
            ) : (
                <span className="flex size-full items-center justify-center font-(family-name:--page-title) text-2xl">{initials}</span>
            )}
        </div>
    );
}

// ---------- the theme as CSS variables ----------

const RADIUS = { sharp: "3px", rounded: "14px", pill: "999px" };

// Everything a template can change ends up in these few variables; .page-button and .page-card
// in globals.css read them
// the type settings' steps (Design → Text): weights, and sizes as multipliers of the usual size
const WEIGHTS = { regular: 400, bold: 700, heavy: 900 };
const HEADING_SCALE = { small: 0.85, medium: 1, large: 1.2 };
const TEXT_SCALE = { small: 0.92, medium: 1, large: 1.12 };

export function themeStyle(theme: Theme) {
    const { button } = theme;
    const heading = FONTS[theme.font.heading];
    const type = theme.type;
    // a chosen weight wins over the font's own
    const headingWeight = type && type.headingWeight !== "auto" ? WEIGHTS[type.headingWeight] : heading.weight;

    return {
        background: pageBackground(theme),
        // the page's main colour, for things that fade or sit into it (poster, banner photo ring)
        "--page-base": theme.background.colors[0],
        "--page-text": theme.text,
        "--page-muted": theme.muted,
        "--page-heading": FONTS[theme.font.heading].css,
        "--page-heading-weight": headingWeight,
        "--page-heading-scale": HEADING_SCALE[type?.headingSize ?? "medium"],
        "--page-text-scale": TEXT_SCALE[type?.textSize ?? "medium"],
        "--page-text-weight": type?.textWeight === "bold" ? 600 : 400,
        // the boxes: their own colour at its fill, or (the default) the text colour, faintly
        "--page-card-bg": `color-mix(in oklab, ${theme.card?.color || theme.text} ${theme.card?.fill ?? 5}%, transparent)`,
        // small titles, numbers and quotes: the heading font, unless it's a script, which is
        // only legible large (the name, section titles); then the text font, in bold
        "--page-title": "script" in heading ? FONTS[theme.font.body].css : heading.css,
        "--page-title-weight": "script" in heading ? 650 : headingWeight,
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
