import { SITE_URL } from "@/lib/site";
import { socialHref } from "./links";
import type { PageDoc } from "@/lib/validations/page";

// What a creator page tells search engines about the person behind it, as schema.org JSON-LD:
// Google reads a ProfilePage like this as "a person's profile" (name, photo, bio, their other
// profiles) and can show it that way. Services go in as what they offer.
// No review stars on purpose: Google ignores ratings a page shows about its own owner.
export function profileJsonLd(doc: PageDoc, username: string) {
    const url = `${SITE_URL}/${username}`;
    const absolute = (src: string) => (src ? new URL(src, SITE_URL).href : undefined);
    const services = doc.blocks.flatMap((block) => (block.type === "services" && block.visible ? block.items.filter((item) => item.name.trim()) : []));

    return {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url,
        mainEntity: {
            "@type": "Person",
            name: doc.profile.name || username,
            alternateName: username,
            url,
            description: doc.profile.bio || undefined,
            image: absolute(doc.profile.avatar),
            // their other profiles: how Google knows this Instagram and this page are the same person
            sameAs: doc.profile.socials.map((social) => socialHref(social.platform, social.url)).filter((href) => href?.startsWith("https://")),
            makesOffer: services.length
                ? services.map((item) => ({
                      "@type": "Offer",
                      // prices are free text ("from ₹25,000"), so they go in words, not as a number
                      description: item.price || undefined,
                      itemOffered: { "@type": "Service", name: item.name, description: item.description || undefined },
                  }))
                : undefined,
        },
    };
}

// For a <script> tag: JSON with "<" escaped, so text a creator typed can't close the tag early
export const jsonLdScript = (data: object) => JSON.stringify(data).replace(/</g, "\\u003c");
