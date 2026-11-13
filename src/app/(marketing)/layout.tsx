import { Anton } from "next/font/google";

// Anton: the ultra-condensed caps face for the landing page's big headlines and wordmark.
// Only the marketing pages load it.
const anton = Anton({ variable: "--font-anton", weight: "400", subsets: ["latin"] });

export default function MarketingLayout({ children }: LayoutProps<"/">) {
    return <div className={`${anton.variable} flex flex-1 flex-col`}>{children}</div>;
}
