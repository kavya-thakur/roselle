import type { CSSProperties } from "react";

import { PageRenderer } from "@/components/PageRenderer";
import type { PageDoc } from "@/lib/validations/page";

// The same page, asking for its photos at `width` pixels instead of the full-size ones: a card a
// few hundred pixels tall doesn't need 900px pictures, and decoding them is what makes scrolling stutter
function withPhotosAt(page: PageDoc, width: number): PageDoc {
    const resize = (url: string) => url.replace(/([?&]w=)\d+/, `$1${width}`);
    return {
        ...page,
        profile: { ...page.profile, avatar: resize(page.profile.avatar), cover: resize(page.profile.cover) },
        theme: { ...page.theme, background: { ...page.theme.background, image: resize(page.theme.background.image) } },
        blocks: page.blocks.map((block) => {
            if (block.type === "link") return { ...block, thumbnail: resize(block.thumbnail) };
            if (block.type === "image") return { ...block, src: resize(block.src) };
            if (block.type === "project") return { ...block, image: resize(block.image) };
            if (block.type === "gallery") return { ...block, images: block.images.map((image) => ({ ...image, src: resize(image.src) })) };
            return block;
        }),
    };
}

// A creator's page as a small floating card: the page is laid out at a real phone's size
// (375 × 780) and shrunk to fit, so it looks exactly like it does in someone's hand instead of
// squeezing its layout into a thumbnail. `scale` is how small, on phones and from tablets up.
// `photoWidth`: how big to fetch its photos. Small cards need little; one that ends up filling the
// screen (the zoom section's star) asks for more.
// `flat`: one small shadow instead of the deep layered one, for cards that get resized many at a
// time (the zoom wall), where redrawing big soft shadows every frame is what costs the most.
export function ProfileCard({
    page,
    scale,
    photoWidth = 400,
    flat = false,
    className = "",
}: {
    page: PageDoc;
    scale: { phone: number; desktop: number };
    photoWidth?: number;
    flat?: boolean;
    className?: string;
}) {
    return (
        <div
            inert
            aria-hidden
            style={{ "--k-phone": scale.phone, "--k-desktop": scale.desktop } as CSSProperties}
            className={`page-lite relative h-[calc(780px*var(--k))] w-[calc(375px*var(--k))] [contain:layout_paint] overflow-hidden rounded-[calc(2.6rem*var(--k)+0.6rem)] bg-paper ${flat ? "shadow-[0_8px_20px_-10px_rgb(0_0_0/0.35)]" : "shadow-[0_2px_4px_rgb(20_20_20/0.05),0_24px_50px_-16px_rgb(20_20_20/0.3),0_70px_110px_-50px_rgb(11_77_44/0.45)]"} ring-1 ring-black/5 [--k:var(--k-phone)] md:[--k:var(--k-desktop)] ${className}`}
        >
            <div className="absolute top-0 left-0 h-[780px] w-[375px] origin-top-left [scale:var(--k)]">
                <PageRenderer page={withPhotosAt(page, photoWidth)} mode="preview" />
            </div>
        </div>
    );
}
