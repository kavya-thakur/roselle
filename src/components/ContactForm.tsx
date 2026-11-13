"use client";

import { useState, type FormEvent } from "react";
import { IconCheck, IconLoader2 } from "@tabler/icons-react";

import { api } from "@/lib/api/client";

const field =
    "w-full rounded-[min(var(--page-radius),0.85rem)] border border-[color-mix(in_oklab,var(--page-text)_22%,transparent)] bg-[color-mix(in_oklab,var(--page-text)_5%,transparent)] px-3.5 py-2.5 text-[15px] text-(--page-text) outline-none transition placeholder:text-(--page-muted) placeholder:opacity-70 focus:border-(--page-text)";

interface ContactFormProps {
    pageId?: number;
    blockId: string;
    button: string;
    // from a Services block: which service, and asking for a date (bookings are about when)
    serviceId?: string;
    askDate?: boolean;
}

// The enquiry form: inside a "Work with me" block, or opened under a service. Plain inputs styled
// by the page's own colours. Without a pageId (the editor's preview, the landing page) it shows
// but doesn't send.
export function ContactForm({ pageId, blockId, button, serviceId, askDate = false }: ContactFormProps) {
    const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
    const [error, setError] = useState<string | null>(null);

    async function send(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!pageId) return;
        const form = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;

        setState("sending");
        setError(null);
        try {
            // where they came from, the same way a page view is counted, so analytics can say
            // which source brings enquiries and not just visits
            const utmSource = new URLSearchParams(window.location.search).get("utm_source") ?? undefined;
            await api("/enquiry", { method: "POST", body: { ...form, pageId, blockId, serviceId, referrer: document.referrer || undefined, utmSource } });
            setState("sent");
        } catch (failure) {
            setError((failure as Error).message);
            setState("idle");
        }
    }

    if (state === "sent") {
        return (
            <p role="status" className="mt-5 flex items-center gap-2 text-[15px] font-semibold">
                <IconCheck size={18} /> Sent. Thank you, you&apos;ll hear back by email.
            </p>
        );
    }

    return (
        <form onSubmit={send} className="mt-5 flex flex-col gap-2.5">
            <div className="grid gap-2.5 @md:grid-cols-2">
                <input name="name" required maxLength={100} autoComplete="name" placeholder="Your name" aria-label="Your name" className={field} />
                <input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="Your email" aria-label="Your email" className={field} />
            </div>
            {askDate && (
                <label className="flex flex-col gap-1 text-xs font-semibold text-(--page-muted)">
                    When? (optional)
                    <input name="wantedOn" type="date" min={new Date().toISOString().slice(0, 10)} className={field} />
                </label>
            )}
            <textarea name="message" required minLength={2} maxLength={3000} rows={4} placeholder="What would you like to make together?" aria-label="Your message" className={`${field} resize-y`} />
            {/* the trap: hidden from people and screen readers, so whatever fills it in is a robot */}
            <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            {error && (
                <p role="alert" className="text-sm font-semibold">
                    {error}
                </p>
            )}
            <button type="submit" disabled={state === "sending"} className="page-button mt-1 flex min-h-12 items-center justify-center gap-2 px-5 text-[15px] font-semibold disabled:opacity-70">
                {state === "sending" && <IconLoader2 size={17} className="animate-spin" />}
                {button}
            </button>
        </form>
    );
}
