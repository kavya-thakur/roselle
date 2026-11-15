"use client";

import { useState } from "react";
import { IconArrowRight, IconX } from "@tabler/icons-react";

import type { Block } from "@/lib/validations/page";
import { ContactForm } from "./ContactForm";
import { SectionTitle } from "./SectionTitle";

type Services = Extract<Block, { type: "services" }>;

// What the creator offers, one card each: the name, the price stated plainly, what's included,
// and a real button to book it. "Book this" opens the enquiry form right in the card with that
// service already chosen, so the visitor never has to say what they meant. One service can be
// marked "Most booked", the one to steer people towards.
export function ServicesBlock({ block, pageId }: { block: Services; pageId?: number }) {
    const [open, setOpen] = useState<string | null>(null);
    const items = block.items.filter((item) => item.name.trim());
    const heading = { fontWeight: "var(--page-title-weight)" } as const;

    return (
        <div>
            {block.title && <SectionTitle className="mb-4">{block.title}</SectionTitle>}
            <ul className="grid gap-3">
                {items.map((item) => (
                    <li key={item.id} className={`page-card flex flex-col p-5 @md:p-6 ${item.featured ? "ring-2 ring-[color-mix(in_oklab,var(--page-text)_45%,transparent)]" : ""}`}>
                        {item.featured && (
                            <span className="mb-3 w-fit rounded-full bg-(--page-text) px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.08em] text-(--page-base) uppercase">Most booked</span>
                        )}
                        <h3 style={heading} className="font-(family-name:--page-title) text-xl leading-tight @md:text-2xl">
                            {item.name}
                        </h3>
                        {item.price && <p className="mt-1.5 text-lg font-semibold tabular-nums">{item.price}</p>}
                        {item.description && <p className="page-prose page-prose-small mt-2 leading-relaxed whitespace-pre-line text-pretty text-(--page-muted)">{item.description}</p>}

                        <button
                            type="button"
                            onClick={() => setOpen(open === item.id ? null : item.id)}
                            aria-expanded={open === item.id}
                            className="page-button mt-5 inline-flex h-11 w-fit items-center gap-1.5 px-5 text-sm font-semibold"
                        >
                            {open === item.id ? (
                                <>
                                    Close <IconX size={15} />
                                </>
                            ) : (
                                <>
                                    Book this <IconArrowRight size={15} />
                                </>
                            )}
                        </button>
                        {open === item.id && <ContactForm pageId={pageId} blockId={block.id} serviceId={item.id} askDate button={`Ask about ${item.name}`} />}
                    </li>
                ))}
            </ul>
        </div>
    );
}
