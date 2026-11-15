import type { Metadata, Viewport } from "next";
import {
    Archivo,
    Bebas_Neue,
    Bricolage_Grotesque,
    Caveat,
    Cormorant_Garamond,
    DM_Sans,
    DM_Serif_Display,
    Fraunces,
    Instrument_Serif,
    Inter,
    Lora,
    Manrope,
    Outfit,
    Pinyon_Script,
    Playfair_Display,
    Poppins,
    Space_Grotesk,
    Syne,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/Toast";

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
// a handwritten script for names ("Hi, I'm Sarah"); only the templates that ask for it use it
const pinyon = Pinyon_Script({ variable: "--font-pinyon", weight: "400", subsets: ["latin"], preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["normal", "italic"], preload: false });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"], style: ["normal", "italic"], preload: false });
const instrument = Instrument_Serif({ variable: "--font-instrument", weight: "400", style: ["normal", "italic"], subsets: ["latin"], preload: false });
const poppins = Poppins({ variable: "--font-poppins", weight: ["400", "500", "600", "700", "800"], subsets: ["latin"], preload: false });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], preload: false });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], preload: false });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], preload: false });
const bebas = Bebas_Neue({ variable: "--font-bebas", weight: "400", subsets: ["latin"], preload: false });
const caveat = Caveat({ variable: "--font-caveat", subsets: ["latin"], preload: false });

const fonts = [bricolage, manrope, archivo, dmSerif, cormorant, fraunces, inter, spaceGrotesk, pinyon, playfair, lora, instrument, poppins, dmSans, outfit, syne, bebas, caveat].map((font) => font.variable).join(" ");

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
            <body className="flex min-h-full flex-col" suppressHydrationWarning>
                {children}
                <Toaster />
            </body>
        </html>
    );
}
