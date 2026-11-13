import Link from "next/link";
import { IconCheck } from "@tabler/icons-react";

// How far along the page is: a ring that fills up, and the steps left. Hidden on phones,
// where the sidebar is a slim top bar.
export function SetupChecklist({ steps, done }: { steps: { label: string; done: boolean }[]; done: number }) {
    const share = done / steps.length;
    // the ring is a circle stroke, drawn as far round as the share of steps done
    const circumference = 2 * Math.PI * 22;

    return (
        <section className="mt-6 hidden rounded-3xl bg-paper p-4 shadow-soft md:block">
            <div className="flex items-center gap-3">
                <svg width="52" height="52" viewBox="0 0 52 52" aria-hidden className="-rotate-90">
                    <circle cx="26" cy="26" r="22" fill="none" stroke="var(--color-sand)" strokeWidth="5" />
                    <circle cx="26" cy="26" r="22" fill="none" stroke="var(--color-forest)" strokeWidth="5" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - share)} className="transition-[stroke-dashoffset] duration-700" />
                </svg>
                <div>
                    <p className="font-display text-lg">{Math.round(share * 100)}% set up</p>
                    <p className="text-xs text-muted">
                        {done} of {steps.length} done
                    </p>
                </div>
            </div>

            <ul className="mt-4 space-y-1.5">
                {steps.map((step) => (
                    <li key={step.label} className={`flex items-center gap-2 text-[13px] ${step.done ? "text-faint line-through" : "font-medium text-ink"}`}>
                        <span className={`flex size-4.5 shrink-0 items-center justify-center rounded-full ${step.done ? "bg-success text-white" : "border-2 border-line-strong"}`}>
                            {step.done && <IconCheck size={11} stroke={3} />}
                        </span>
                        {step.label}
                    </li>
                ))}
            </ul>

            <Link href="/editor" className="mt-4 flex h-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white transition hover:bg-[#2e2e2e]">
                Finish setup
            </Link>
        </section>
    );
}
