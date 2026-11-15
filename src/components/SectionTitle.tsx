import type { ReactNode } from "react";

// A section's title on a creator page ("Selected work", "Book a shoot"), set in the theme's own
// heading font, so the page reads in chapters rather than as a list of cards. Themes with
// label titles set it small, bold and centred instead (globals.css).
export function SectionTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
    return (
        <h2 style={{ fontWeight: "var(--page-heading-weight)" }} className={`section-title font-(family-name:--page-heading) text-[calc(1.65rem*var(--page-heading-scale,1))] leading-tight tracking-[-0.015em] text-balance @md:text-[calc(2rem*var(--page-heading-scale,1))] ${className}`}>
            {children}
        </h2>
    );
}
