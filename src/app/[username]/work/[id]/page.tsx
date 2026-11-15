/* eslint-disable @next/next/no-img-element -- creators' images come from any host */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { IconArrowLeft, IconArrowUpRight } from "@tabler/icons-react";

import { Lightbox } from "@/components/Lightbox";
import { themeStyle, Zoom } from "@/components/PageRenderer";
import { hasCaseStudy, isLive, safeHref } from "@/lib/pages/links";
import { sized } from "@/lib/media/sized";
import { getPublishedPage } from "@/lib/pages/publish";

// Kept like the page it belongs to: a minute at most, and Publish refreshes both
export const revalidate = 60;
// built on the first visit and kept, like the page itself ([username]/page.tsx)
export const generateStaticParams = async () => [];

// The project's case study, if it has one and visitors can see it
async function caseStudyOf(params: PageProps<"/[username]/work/[id]">["params"]) {
    const { username, id } = await params;
    const page = await getPublishedPage(username);
    const project = page?.doc.blocks.find((block) => block.id === id);
    if (!page || project?.type !== "project" || !isLive(project) || !hasCaseStudy(project)) return null;
    return { page, project };
}

export async function generateMetadata({ params }: PageProps<"/[username]/work/[id]">): Promise<Metadata> {
    const found = await caseStudyOf(params);
    if (!found) return {};
    const { page, project } = found;
    const cover = safeHref(project.image);

    return {
        title: { absolute: `${project.title} · ${page.doc.profile.name || page.username}` },
        description: project.description || undefined,
        alternates: { canonical: `/${page.username}/work/${project.id}` },
        openGraph: { title: project.title, description: project.description || undefined, images: cover?.startsWith("https://") ? [cover] : undefined },
    };
}

// One piece of work, told properly: the cover, the story, then every picture large, in the
// creator's own colours and fonts. Opened from the project's card on their page.
export default async function CaseStudyPage({ params }: PageProps<"/[username]/work/[id]">) {
    const found = await caseStudyOf(params);
    if (!found) notFound();

    const { page, project } = found;
    const { profile, theme } = page.doc;
    const cover = safeHref(project.image);
    const link = safeHref(project.url);
    const images = project.images.filter((image) => safeHref(image.src));
    const heading = { fontWeight: "var(--page-heading-weight)" } as const;

    return (
        <div style={themeStyle(theme)} className="@container grain flex min-h-dvh flex-1 flex-col font-(family-name:--page-body) text-(--page-text)">
            <article className="mx-auto w-full max-w-3xl flex-1 px-5 pt-8 pb-16 @md:px-8">
                <Link href={`/${page.username}`} className="inline-flex items-center gap-1.5 text-sm font-semibold opacity-70 transition hover:opacity-100">
                    <IconArrowLeft size={16} /> {profile.name || page.username}
                </Link>

                <header className="rise mt-10">
                    <h1 style={heading} className="font-(family-name:--page-heading) text-[2.6rem] leading-[1.02] tracking-[-0.02em] text-balance @md:text-6xl">
                        {project.title}
                    </h1>
                    {project.description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-(--page-muted)">{project.description}</p>}
                    {project.tags.length > 0 && (
                        <ul className="mt-5 flex flex-wrap gap-1.5">
                            {project.tags.map((tag) => (
                                <li key={tag} className="rounded-full border border-[color-mix(in_oklab,var(--page-text)_20%,transparent)] px-2.5 py-0.5 text-xs tracking-wide">
                                    {tag}
                                </li>
                            ))}
                        </ul>
                    )}
                </header>

                {cover && (
                    <Zoom group="case" src={cover} alt={project.title} className="mt-10">
                        <img src={sized(cover, 1600)} alt={project.title} className="max-h-[80svh] w-full rounded-[min(var(--page-radius),1.5rem)] object-cover" />
                    </Zoom>
                )}

                {project.body && <div className="mt-10 max-w-2xl text-[17px] leading-[1.75] whitespace-pre-line text-pretty opacity-90">{project.body}</div>}

                {images.length > 0 && (
                    // one column on phones; side by side once there's room, each keeping its own shape
                    <div className={`mt-12 gap-4 ${images.length > 1 ? "@2xl:columns-2" : ""}`}>
                        {images.map((image, i) => (
                            <figure key={i} className="mb-4 break-inside-avoid">
                                <Zoom group="case" src={safeHref(image.src)!} alt={image.alt}>
                                    <img src={sized(safeHref(image.src)!, 1200)} alt={image.alt} loading="lazy" className="w-full rounded-[min(var(--page-radius),1.5rem)]" />
                                </Zoom>
                                {image.alt && <figcaption className="mt-2 text-xs text-(--page-muted)">{image.alt}</figcaption>}
                            </figure>
                        ))}
                    </div>
                )}

                {link && (
                    <a href={link} target="_blank" rel="noopener noreferrer" className="page-button mt-12 inline-flex min-h-13 items-center gap-2 px-6 font-semibold">
                        See the project <IconArrowUpRight size={17} />
                    </a>
                )}
            </article>

            <footer className="pb-10 text-center text-xs text-(--page-muted)">
                <Link href={`/${page.username}`} className="font-semibold opacity-80 hover:opacity-100">
                    More from {profile.name || page.username}
                </Link>
                <p className="mt-3 tracking-[0.18em] uppercase opacity-60">
                    Composed with <span className="font-display text-sm tracking-normal normal-case">Roselle</span>
                </p>
            </footer>
            <Lightbox />
        </div>
    );
}
