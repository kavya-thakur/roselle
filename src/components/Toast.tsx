"use client";

import { useSyncExternalStore } from "react";
import { IconAlertCircle, IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";

// The app's one way of saying "that worked" or "that didn't": a short message at the top centre
// of the screen. Any client component calls toast("Saved"); the <Toaster> in the root layout
// shows it. No library: a list of messages and the components listening to it.

type Tone = "success" | "error" | "info";
interface Toast {
    id: number;
    message: string;
    detail?: string;
    tone: Tone;
}

let toasts: Toast[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const publish = (next: Toast[]) => {
    toasts = next;
    listeners.forEach((listener) => listener());
};

const dismiss = (id: number) => publish(toasts.filter((toast) => toast.id !== id));

// Errors stay a little longer: they usually need reading
export function toast(message: string, { tone = "success", detail }: { tone?: Tone; detail?: string } = {}) {
    const id = ++nextId;
    // at most three at once; the oldest makes way
    publish([...toasts.slice(-2), { id, message, detail, tone }]);
    setTimeout(() => dismiss(id), tone === "error" ? 6000 : 3500);
}

toast.error = (message: string, detail?: string) => toast(message, { tone: "error", detail });

const ICONS = { success: IconCheck, error: IconAlertCircle, info: IconInfoCircle };
const ICON_COLOURS = { success: "bg-success text-white", error: "bg-danger text-white", info: "bg-white/15 text-white" };

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const noToasts: Toast[] = [];

export function Toaster() {
    const current = useSyncExternalStore(subscribe, () => toasts, () => noToasts);

    return (
        // polite: read out after whatever the person is doing; the error ones interrupt (role=alert)
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
            {current.map((item) => {
                const Icon = ICONS[item.tone];
                return (
                    <div
                        key={item.id}
                        role={item.tone === "error" ? "alert" : "status"}
                        className="pointer-events-auto flex w-fit max-w-[min(28rem,100%)] animate-[toast-in_0.35s_cubic-bezier(0.2,0.9,0.3,1.2)] items-start gap-3 rounded-2xl bg-ink py-3 pr-2 pl-3 text-white shadow-[0_18px_40px_-12px_rgb(0_0_0/0.45)]"
                    >
                        <span className={`mt-px flex size-6 shrink-0 items-center justify-center rounded-full ${ICON_COLOURS[item.tone]}`}>
                            <Icon size={15} stroke={2.4} />
                        </span>
                        <span className="min-w-0 flex-1 py-0.5 text-[14px] leading-snug">
                            <span className="block font-semibold">{item.message}</span>
                            {item.detail && <span className="mt-0.5 block text-[13px] text-white/70">{item.detail}</span>}
                        </span>
                        <button onClick={() => dismiss(item.id)} aria-label="Dismiss" className="flex size-7 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white">
                            <IconX size={15} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
