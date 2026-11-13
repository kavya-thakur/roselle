import type { NextConfig } from "next";

// cacheComponents is off: the dashboard reads the login cookie in its layout (the way the crm
// project does it), which Cache Components only allows behind a <Suspense>. Public pages are
// one small query each, so they're fast without it.
// The public address, from APP_URL, baked into the build so the browser knows it too
// (src/lib/site.ts). Locally that's http://localhost:3000.
const SITE_URL = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

const nextConfig: NextConfig = {
    env: { SITE_URL },
    turbopack: {
        rules: {
            "*.css": {
                loaders: ["@tailwindcss/turbopack"],
                as: "*.css",
            },
        },
    },
};

export default nextConfig;
