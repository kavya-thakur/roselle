import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageRenderer } from "@/components/PageRenderer";
import { Lightbox } from "@/components/Lightbox";
import { getPublishedPage } from "@/lib/pages/publish";
import { TrackView } from "./TrackView";

// Rendered once and kept, so a visit is just a file served. Kept for a minute at most, which is
// how a scheduled link appears or disappears on time; Publish refreshes it straight away.
export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<"/[username]">): Promise<Metadata> {
    const { username } = await params;
    const page = await getPublishedPage(username);
    if (!page) return {};

    const { profile, seo } = page.doc;
    const title = seo.title || profile.name || page.username;
    const description = seo.description || profile.bio || `${title} on Roselle`;

    return {
        // the person's own name, not "Name · Roselle"
        title: { absolute: title },
        description,
        alternates: { canonical: `/${page.username}` },
        openGraph: { title, description, type: "profile", url: `/${page.username}` },
    };
}

export default async function CreatorPage({ params }: PageProps<"/[username]">) {
    const { username } = await params;
    const page = await getPublishedPage(username);

    if (!page) {
        notFound();
    }

    return (
        <div className="flex min-h-dvh flex-1 flex-col">
            <PageRenderer page={page.doc} pageId={page.id} username={page.username} />
            <TrackView pageId={page.id} />
            <Lightbox />
        </div>
    );
}
