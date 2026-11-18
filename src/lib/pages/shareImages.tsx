/* eslint-disable @next/next/no-img-element -- drawn by next/og, not shown in a browser */
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { sized } from "@/lib/media/sized";
import { isLive, safeHref } from "@/lib/pages/links";
import { patternStyle } from "@/lib/pages/patterns";
import { patternInk } from "@/lib/pages/colour";
import type { PageDoc, Theme } from "@/lib/validations/page";
import { SITE_HOST, SITE_URL } from "@/lib/site";

// Pictures of a creator's page for sharing it: the link preview ([username]/opengraph-image.tsx),
// an Instagram story, and a poster to print. All drawn from the published page, in its colours.

// Photos on Cloudinary come as a JPEG (this renderer can't read WebP or AVIF). Photos kept in
// the database (/media, only without Cloudinary) are left out: they're WebP, and on your own
// computer the renderer won't fetch from localhost; the picture is drawn without them, never broken.
export function absolute(src: string, width = 1200) {
    const url = safeHref(src);
    return url?.startsWith("https://") ? sized(url, width, "jpg") : null;
}

// The page's background, in the parts the image renderer understands. A photo background is
// drawn as an <img> on top, so here it's just the colour that darkens it.
export function backgroundOf(theme: Theme) {
    const [base, middle, light] = theme.background.colors;
    const { kind, angle, pattern } = theme.background;
    if (kind === "pattern") return patternStyle(pattern, base, patternInk(theme.background));
    if (kind === "gradient") return { backgroundColor: base, backgroundImage: `linear-gradient(${angle}deg, ${base}, ${middle}, ${light})` };
    // the glow, simplified to one sweep: the light colour rising into the corner
    if (kind === "glow") return { backgroundColor: base, backgroundImage: `linear-gradient(${angle}deg, ${base} 0%, ${base} 35%, ${middle} 80%, ${light} 100%)` };
    return { backgroundColor: base };
}

// The page's background with its photo (if it has one) darkened over it, filling the picture
function Backdrop({ theme, width, height }: { theme: Theme; width: number; height: number }) {
    const photo = theme.background.kind === "image" ? absolute(theme.background.image, width) : null;
    if (!photo) return null;
    return (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex" }}>
            <img src={photo} alt="" width={width} height={height} style={{ objectFit: "cover" }} />
            <div style={{ position: "absolute", top: 0, left: 0, width, height, backgroundColor: theme.background.colors[0], opacity: 0.55 }} />
        </div>
    );
}

// The first few services, as a line of what they offer: "Bridal makeup · Party makeup"
function offers(doc: PageDoc) {
    const services = doc.blocks.find((block) => block.type === "services" && isLive(block));
    return services?.type === "services" ? services.items.map((item) => item.name.trim()).filter(Boolean).slice(0, 3) : [];
}

type Share = { doc: PageDoc; username: string };

// 1080 x 1920, the shape of an Instagram or WhatsApp story: their photo across the top, the name
// big, what they offer, and the address. The bottom is left clear for Instagram's link sticker.
export function storyImage({ doc, username }: Share, headers: HeadersInit) {
    const { profile, theme } = doc;
    const base = theme.background.colors[0];
    const avatar = absolute(profile.avatar, 1080);
    const services = offers(doc);

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative", color: theme.text, ...backgroundOf(theme) }}>
                <Backdrop theme={theme} width={1080} height={1920} />
                {avatar ? (
                    <div style={{ display: "flex", position: "relative", width: 1080, height: 1150 }}>
                        <img src={avatar} alt="" width={1080} height={1150} style={{ objectFit: "cover" }} />
                        {/* the photo melts into the page colour at its foot */}
                        <div style={{ position: "absolute", top: 0, left: 0, width: 1080, height: 1150, background: `linear-gradient(180deg, ${base}00 55%, ${base} 100%)` }} />
                    </div>
                ) : (
                    <div style={{ display: "flex", height: 520 }} />
                )}

                <div style={{ display: "flex", flexDirection: "column", padding: "0 90px", marginTop: avatar ? -140 : 0 }}>
                    <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{profile.name || username}</div>
                    {profile.bio && <div style={{ fontSize: 44, opacity: 0.8, marginTop: 30, lineHeight: 1.3 }}>{profile.bio.slice(0, 140)}</div>}
                    {services.length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 44 }}>
                            {services.map((name) => (
                                <div key={name} style={{ fontSize: 32, padding: "14px 28px", borderRadius: 999, backgroundColor: `${theme.text}1f` }}>
                                    {name}
                                </div>
                            ))}
                        </div>
                    )}
                    <div style={{ display: "flex", alignSelf: "flex-start", marginTop: 56, fontSize: 38, fontWeight: 700, padding: "22px 40px", borderRadius: 999, border: `3px solid ${theme.text}` }}>
                        {`${SITE_HOST}/${username}`}
                    </div>
                </div>
            </div>
        ),
        { width: 1080, height: 1920, headers },
    );
}

// A4 (1240 x 1754, 150 dpi): for a studio wall, a stall or a client's desk. Their photo and name,
// and a big QR code on white (so every phone reads it, whatever the page's colours), tagged
// ?via=qr so analytics counts visits from print apart.
export async function posterImage({ doc, username }: Share, headers: HeadersInit) {
    const { profile, theme } = doc;
    const avatar = absolute(profile.avatar, 600);
    const qr = await QRCode.toDataURL(`${SITE_URL}/${username}?via=qr`, { width: 1240, margin: 0, errorCorrectionLevel: "M" });

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", color: theme.text, textAlign: "center", ...backgroundOf(theme) }}>
                <Backdrop theme={theme} width={1240} height={1754} />
                {avatar && <img src={avatar} alt="" width={260} height={260} style={{ borderRadius: 999, objectFit: "cover", border: `8px solid ${theme.text}` }} />}
                <div style={{ fontSize: 100, fontWeight: 800, letterSpacing: -2, lineHeight: 1, marginTop: avatar ? 44 : 0, maxWidth: 1060 }}>{profile.name || username}</div>
                {profile.bio && <div style={{ fontSize: 38, opacity: 0.8, marginTop: 24, maxWidth: 940, lineHeight: 1.3 }}>{profile.bio.slice(0, 140)}</div>}
                <div style={{ display: "flex", marginTop: 64, padding: 48, borderRadius: 48, backgroundColor: "#ffffff" }}>
                    <img src={qr} alt="" width={620} height={620} />
                </div>
                <div style={{ fontSize: 50, fontWeight: 800, marginTop: 56 }}>Scan to see my work and book</div>
                <div style={{ fontSize: 34, opacity: 0.75, marginTop: 16 }}>{`${SITE_HOST}/${username}`}</div>
            </div>
        ),
        { width: 1240, height: 1754, headers },
    );
}
