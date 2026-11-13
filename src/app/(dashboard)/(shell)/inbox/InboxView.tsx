"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMail, IconTrash } from "@tabler/icons-react";

import { api } from "@/lib/api/client";

interface Message {
    id: number;
    name: string;
    email: string;
    message: string;
    createdAt: string;
    unread: boolean;
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function InboxView({ messages: initial }: { messages: Message[] }) {
    const [messages, setMessages] = useState(initial);
    const [error, setError] = useState<string | null>(null);

    async function remove(id: number) {
        setError(null);
        try {
            await api(`/enquiry/${id}`, { method: "DELETE" });
            setMessages((current) => current.filter((message) => message.id !== id));
        } catch (failure) {
            setError((failure as Error).message);
        }
    }

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="font-display text-5xl">Inbox</h1>
                <p className="mt-2 text-sm text-muted">Messages from the contact form on your page. Each one is emailed to you too.</p>

                {error && (
                    <p role="alert" className="mt-6 rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {error}
                    </p>
                )}

                {messages.length === 0 ? (
                    <div className="mt-10 rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center">
                        <p className="font-display text-2xl">No messages yet</p>
                        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                            Add a <span className="font-semibold text-ink">Contact form</span> block in the{" "}
                            <Link href="/editor" className="font-semibold text-pink hover:underline">editor</Link> and people can ask to work with you.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-8 space-y-3">
                        {messages.map((message) => (
                            <li key={message.id} className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
                                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                    {message.unread && <span className="rounded-full bg-pink px-2 py-0.5 text-[11px] font-semibold text-white">New</span>}
                                    <span className="font-semibold">{message.name}</span>
                                    <span className="text-sm text-muted">{message.email}</span>
                                    <span className="ml-auto text-xs text-muted">{when(message.createdAt)}</span>
                                </div>
                                <p className="mt-3 text-[15px] leading-relaxed whitespace-pre-line text-ink/85">{message.message}</p>
                                <div className="mt-4 flex gap-2">
                                    <a
                                        href={`mailto:${message.email}?subject=${encodeURIComponent("Re: your message")}`}
                                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-ink px-3.5 text-[13px] font-semibold text-white hover:bg-[#2e2e2e]"
                                    >
                                        <IconMail size={15} /> Reply
                                    </a>
                                    <button onClick={() => remove(message.id)} className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold text-muted hover:bg-sand hover:text-danger">
                                        <IconTrash size={15} /> Delete
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </main>
    );
}
