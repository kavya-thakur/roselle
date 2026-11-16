import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Creator pages are for finding; private links (quotes, review links) and the click counter aren't.
// The dashboard needs no line: it's behind a login.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/go/", "/quote/", "/review/", "/verify"] },
        sitemap: `${SITE_URL}/sitemap.xml`,
    };
}
