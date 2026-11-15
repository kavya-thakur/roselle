// A photo at the size it's shown. Cloudinary makes any size of an uploaded photo from its
// address (…/image/upload/<how>/…), in the best format the browser takes (f_auto: AVIF or
// WebP) at a quality the eye can't tell from the original (q_auto). Any other address, like an
// Unsplash photo or one kept in the database locally, comes back as it is.
// Safe in the browser: no secrets, just the address.
const MARKER = "/image/upload/";

export function sized(src: string, width: number, format: "auto" | "jpg" = "auto") {
    if (!src.startsWith("https://res.cloudinary.com/") || !src.includes(MARKER)) return src;
    return src.replace(MARKER, `${MARKER}c_limit,w_${width},f_${format},q_auto/`);
}
