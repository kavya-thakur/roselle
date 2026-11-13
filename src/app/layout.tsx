import type { Metadata, Viewport } from "next";
import { Archivo, Bricolage_Grotesque, DM_Serif_Display, Manrope, Cormorant_Garamond, Fraunces, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Bricolage Grotesque (heavy) for headlines and Manrope for everything else: Roselle's own type
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
// The ROSELLE wordmark: Archivo stretched to its widest (wdth 125)
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });

// The rest are only for creator pages that pick them (src/lib/pages/theme.ts), so they aren't
// preloaded: a page that doesn't use them never downloads them
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", weight: "400", style: ["normal", "italic"], subsets: ["latin"], preload: false });
const cormorant = Cormorant_Garamond({ variable: "--font-cormorant", weight: ["400", "500", "600"], style: ["normal", "italic"], subsets: ["latin"], preload: false });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], preload: false });

const fonts = [bricolage, manrope, archivo, dmSerif, cormorant, fraunces, inter, spaceGrotesk].map((font) => font.variable).join(" ");

const description = "Roselle is the link-in-bio for people with taste. Compose an editorial home for your work, your links and your story.";

export const metadata: Metadata = {
    // Link previews need the full address of share images
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    // Pages set just their own name ("Analytics"), the template turns it into "Analytics · Roselle"
    title: {
        default: "Roselle · Your identity, beautifully composed",
        template: "%s · Roselle",
    },
    description,
    openGraph: { siteName: "Roselle", description, type: "website" },
    twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
    themeColor: "#fff6ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={`${fonts} h-full antialiased`}>
            {/* suppressHydrationWarning: browser extensions (ColorZilla, Grammarly) add attributes to
                <body> before React loads; that one element only, never its children */}
            <body className="flex min-h-full flex-col" suppressHydrationWarning>{children}</body>
        </html>
    );
}
