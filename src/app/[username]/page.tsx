import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageRenderer } from "@/components/PageRenderer";
import { Lightbox } from "@/components/Lightbox";
import { QrCode } from "@/components/QrCode";
import { SITE_URL } from "@/lib/site";
import { getPublishedPage } from "@/lib/pages/publish";
import { getApprovedReviews } from "@/lib/reviews";
import { jsonLdScript, profileJsonLd } from "@/lib/pages/structuredData";
import { TrackView } from "./TrackView";

// Rendered once and kept, so a visit is just a file served. Kept for a minute at most, which is
// how a scheduled link appears or disappears on time; Publish refreshes it straight away.
export const revalidate = 60;
// No pages are built ahead; each is built on its first visit and then kept (as above). Without
// this, Next treats a route with a [name] in it as dynamic and renders it on every visit.
export const generateStaticParams = async () => [];

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

    const reviews = page.doc.blocks.some((block) => block.type === "reviews") ? await getApprovedReviews(page.id) : [];

    return (
        <div className="flex min-h-dvh flex-1 flex-col">
            {/* who this is, for search engines (src/lib/pages/structuredData.ts) */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(profileJsonLd(page.doc, page.username)) }} />
            <PageRenderer page={page.doc} pageId={page.id} username={page.username} reviews={reviews} />
            <TrackView pageId={page.id} />
            <Lightbox />
            {/* on a computer: a QR code to carry the page over to a phone, where it's made to be read */}
            <div aria-hidden className="fixed right-6 bottom-6 z-30 hidden flex-col items-center gap-2 lg:flex">
                <p className="text-xs font-semibold text-white drop-shadow">View on mobile</p>
                <div className="rounded-2xl bg-white p-2 shadow-[0_12px_30px_-10px_rgb(0_0_0/0.5)]">
                    <QrCode value={`${SITE_URL}/${page.username}`} size={104} quiet={1} />
                </div>
            </div>
        </div>
    );
}
