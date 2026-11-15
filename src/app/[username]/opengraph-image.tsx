import { ImageResponse } from "next/og";
import { getPublishedPage } from "@/lib/pages/publish";
import { sized } from "@/lib/media/sized";
import { safeHref } from "@/lib/pages/links";
import { patternStyle } from "@/lib/pages/patterns";
import { patternInk } from "@/lib/pages/colour";
import type { Theme } from "@/lib/validations/page";
import { SITE_HOST } from "@/lib/site";

export const alt = "A Roselle page";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;
// drawn on the first request and kept, like the page itself ([username]/page.tsx)
export const generateStaticParams = async () => [];

// Photos on Cloudinary come as a JPEG (this renderer can't read WebP or AVIF). Photos kept in
// the database (/media, only without Cloudinary) are left out: they're WebP, and on your own
// computer the renderer won't fetch from localhost; the card is drawn without them, never broken.
function absolute(src: string) {
    const url = safeHref(src);
    return url?.startsWith("https://") ? sized(url, 1200, "jpg") : null;
}

// The page's background, in the parts the image renderer understands. A photo background is
// drawn as an <img> below, so here it's just the colour that darkens it.
function backgroundOf(theme: Theme) {
    const [base, middle, light] = theme.background.colors;
    const { kind, angle, pattern } = theme.background;
    if (kind === "pattern") return patternStyle(pattern, base, patternInk(theme.background));
    if (kind === "gradient") return { backgroundColor: base, backgroundImage: `linear-gradient(${angle}deg, ${base}, ${middle}, ${light})` };
    // the glow, simplified to one sweep: the light colour rising into the corner
    if (kind === "glow") return { backgroundColor: base, backgroundImage: `linear-gradient(${angle}deg, ${base} 0%, ${base} 35%, ${middle} 80%, ${light} 100%)` };
    return { backgroundColor: base };
}

// The card shown when someone shares <our address>/<username>: drawn from the page itself, on its
// own background (pattern, photo, gradient...) and with its header's shape: a poster's photo
// fills the right side, a banner's cover runs across the top, a classic page shows a round photo
export default async function Image({ params }: { params: Promise<{ username: string }> }) {
    const { username } = await params;
    const page = await getPublishedPage(username);

    const name = page?.doc.profile.name || username;
    const bio = page?.doc.profile.bio ?? "";
    const theme = page?.doc.theme;
    const text = theme?.text ?? "#fff7f5";
    const base = theme?.background.colors[0] ?? "#0b4d2c";
    const header = theme?.layout.header ?? "classic";
    const avatar = page ? absolute(page.doc.profile.avatar) : null;
    const cover = page ? absolute(page.doc.profile.cover) : null;
    const backdrop = theme?.background.kind === "image" ? absolute(theme.background.image) : null;

    const poster = header === "poster" && avatar;
    const banner = header === "banner" && cover;

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", color: text, ...(theme ? backgroundOf(theme) : { backgroundColor: base }) }}>
                {/* a photo background, darkened with the page colour like on the page */}
                {backdrop && <img src={backdrop} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                {backdrop && <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: base, opacity: 0.55 }} />}

                {poster && (
                    <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 520, display: "flex" }}>
                        <img src={avatar} alt="" width={520} height={630} style={{ objectFit: "cover" }} />
                        {/* the photo melts into the page colour on its left edge */}
                        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: `linear-gradient(90deg, ${base} 0%, ${base}00 45%)` }} />
                    </div>
                )}
                {banner && <img src={cover} alt="" width={1200} height={230} style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }} />}

                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 80, paddingTop: banner ? 250 : 80, width: poster ? 720 : "100%", height: "100%" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
                        {avatar && !poster && (
                            <img src={avatar} alt="" width={140} height={140} style={{ borderRadius: 999, objectFit: "cover", border: `6px solid ${base}` }} />
                        )}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            <div style={{ fontSize: poster ? 92 : 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{name}</div>
                            {bio && <div style={{ fontSize: 30, opacity: 0.8, marginTop: 20, maxWidth: 820 }}>{bio.slice(0, 120)}</div>}
                        </div>
                    </div>
                    <div style={{ fontSize: 28, opacity: 0.75, marginTop: 40 }}>{`${SITE_HOST}/${username}`}</div>
                </div>
            </div>
        ),
        size
    );
}
