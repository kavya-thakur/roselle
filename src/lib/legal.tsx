import type { ReactNode } from "react";

// Where people write to us about their data, a takedown or anything legal: CONTACT_EMAIL, else
// the address our emails come from
export const CONTACT_EMAIL = process.env.CONTACT_EMAIL || process.env.MAIL_FROM || "";

export const LEGAL_UPDATED = "13 November 2026";

export function Contact() {
    return CONTACT_EMAIL ? (
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-ink underline underline-offset-2">
            {CONTACT_EMAIL}
        </a>
    ) : (
        <>the contact address on our website</>
    );
}

// The look of the long reading pages: one heading per section, comfortable paragraphs
export function Prose({ title, children }: { title: string; children: ReactNode }) {
    return (
        <article className="text-[16px] leading-relaxed text-ink/80 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
            <h1 className="font-display text-5xl text-ink">{title}</h1>
            <p className="text-sm text-muted">Last updated {LEGAL_UPDATED}</p>
            {children}
        </article>
    );
}
