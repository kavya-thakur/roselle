"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";

import type { Block } from "@/lib/validations/page";
import { ContactForm } from "./ContactForm";

type Services = Extract<Block, { type: "services" }>;

// What the creator offers, one card each with its price. "Enquire" opens the enquiry form right
// under that service with it already chosen, so the visitor never has to say what they meant.
export function ServicesBlock({ block, pageId }: { block: Services; pageId?: number }) {
    const [open, setOpen] = useState<string | null>(null);
    const items = block.items.filter((item) => item.name.trim());
    const heading = { fontWeight: "var(--page-heading-weight)" } as const;

    return (
        <div>
            {block.title && <h3 className="mb-3 text-xs font-semibold tracking-[0.22em] text-(--page-muted) uppercase">{block.title}</h3>}
            <ul className="flex flex-col gap-3">
                {items.map((item) => (
                    <li key={item.id} className="page-card p-5">
                        <div className="flex items-baseline justify-between gap-4">
                            <h4 style={heading} className="font-(family-name:--page-heading) text-xl leading-tight">
                                {item.name}
                            </h4>
                            {item.price && <span className="shrink-0 text-sm font-semibold tabular-nums">{item.price}</span>}
                        </div>
                        {item.description && <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-pretty text-(--page-muted)">{item.description}</p>}

                        <button
                            type="button"
                            onClick={() => setOpen(open === item.id ? null : item.id)}
                            aria-expanded={open === item.id}
                            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
                        >
                            Enquire <IconChevronDown size={15} className={`transition ${open === item.id ? "rotate-180" : ""}`} />
                        </button>
                        {open === item.id && <ContactForm pageId={pageId} blockId={block.id} serviceId={item.id} askDate button={`Ask about ${item.name}`} />}
                    </li>
                ))}
            </ul>
        </div>
    );
}
