"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";

import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";

const CHOICES = {
    month: { days: 30, label: "Give a month of Pro", done: "a month of Pro added" },
    year: { days: 365, label: "Give a year of Pro", done: "a year of Pro added" },
    forever: { days: null, label: "Give Pro with no end", done: "Pro with no end" },
} as const;

// Pro by hand for one account, without a payment: a month or a year (added on to Pro still running),
// with no end, or ended now. Each asks first: it changes what their page shows straight away.
export function ProControls({ userId, email, onPro }: { userId: number; email: string; onPro: boolean }) {
    const router = useRouter();
    const [busy, setBusy] = useState(false);

    async function change(choice: string) {
        const give = CHOICES[choice as keyof typeof CHOICES];
        if (!window.confirm(give ? `${give.label} to ${email}? No payment is recorded.` : `End Pro for ${email} now? The Roselle badge comes back on their page.`)) return;
        setBusy(true);
        try {
            await api("/admin", { method: "POST", body: give ? { action: "grantPro", userId, days: give.days } : { action: "endPro", userId } });
            toast(give ? `${email}: ${give.done}` : `${email} is on Free now`);
            router.refresh();
        } catch (failure) {
            toast.error("That didn't work", (failure as Error).message);
        } finally {
            setBusy(false);
        }
    }

    if (busy) return <IconLoader2 size={16} className="ml-auto animate-spin text-muted" />;
    return (
        // a native menu: works by keyboard and on phones, and resets after each choice
        <select
            value=""
            onChange={(event) => change(event.target.value)}
            aria-label={`Change Pro for ${email}`}
            className="h-8 rounded-full border border-line bg-paper px-3 text-[13px] font-semibold outline-none hover:border-line-strong focus:border-ink"
        >
            <option value="" disabled>
                Pro…
            </option>
            {Object.entries(CHOICES).map(([value, choice]) => (
                <option key={value} value={value}>
                    {choice.label}
                </option>
            ))}
            {onPro && <option value="end">End Pro now</option>}
        </select>
    );
}
