"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowUpRight } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { SITE_HOST } from "@/lib/site";
import type { AdminAction } from "@/lib/validations/report";

interface Report {
    id: number;
    username: string;
    pageDown: boolean;
    reason: string;
    details: string;
    email: string | null;
    createdAt: string;
}

const card = "rounded-2xl border border-line bg-paper p-5 shadow-soft";
const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

export function AdminView({ reports, suspended }: { reports: Report[]; suspended: { username: string; reason: string; suspendedAt: string }[] }) {
    const router = useRouter();
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // every action goes to /api/admin, then the lists are read again from the server
    async function run(key: string, action: AdminAction) {
        setBusy(key);
        setError(null);
        try {
            await api("/admin", { method: "POST", body: action });
            router.refresh();
        } catch (failure) {
            setError((failure as Error).message);
        } finally {
            setBusy(null);
        }
    }

    // the owner is emailed this reason, so it's asked for every time
    function takeDown(username: string, suggested: string) {
        const reason = window.prompt(`Why is ${SITE_HOST}/${username} being taken down? The owner will see this.`, suggested);
        if (reason) run(`down:${username}`, { action: "suspend", username, reason });
    }

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="font-display text-5xl">Admin</h1>
                <p className="mt-2 text-sm text-muted">Reports from visitors, and the pages that are taken down.</p>

                {error && (
                    <p role="alert" className="mt-6 rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {error}
                    </p>
                )}

                <TakeDownForm busy={busy === "form"} onSubmit={(username) => takeDown(username, "")} />

                <h2 className="mt-12 text-lg font-semibold">Open reports ({reports.length})</h2>
                {reports.length === 0 && <p className="mt-3 text-sm text-muted">Nothing to look at. All clear.</p>}
                <ul className="mt-4 space-y-3">
                    {reports.map((report) => (
                        <li key={report.id} className={card}>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <a href={`/${report.username}`} target="_blank" className="flex items-center gap-1 font-semibold hover:underline">
                                    {SITE_HOST}/{report.username} <IconArrowUpRight size={14} />
                                </a>
                                <span className="text-xs text-muted">{when(report.createdAt)}</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-pink">{report.reason}</p>
                            {report.details && <p className="mt-2 text-sm whitespace-pre-line text-ink/80">{report.details}</p>}
                            <p className="mt-2 text-xs text-muted">From {report.email ?? "an anonymous visitor"}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {report.pageDown ? (
                                    <span className="text-sm text-muted">Page is already down.</span>
                                ) : (
                                    <Button size="small" className="bg-danger hover:bg-danger/90" busy={busy === `down:${report.username}`} onClick={() => takeDown(report.username, report.reason)}>
                                        Take page down
                                    </Button>
                                )}
                                <Button size="small" look="secondary" busy={busy === `dismiss:${report.id}`} onClick={() => run(`dismiss:${report.id}`, { action: "dismiss", reportId: report.id })}>
                                    Dismiss
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>

                <h2 className="mt-12 text-lg font-semibold">Taken down ({suspended.length})</h2>
                {suspended.length === 0 && <p className="mt-3 text-sm text-muted">No pages are down.</p>}
                <ul className="mt-4 space-y-3">
                    {suspended.map((page) => (
                        <li key={page.username} className={`${card} flex flex-wrap items-center gap-3`}>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">{SITE_HOST}/{page.username}</p>
                                <p className="mt-0.5 text-sm text-muted">
                                    {page.reason} · {when(page.suspendedAt)}
                                </p>
                            </div>
                            <Button size="small" look="secondary" busy={busy === `up:${page.username}`} onClick={() => run(`up:${page.username}`, { action: "restore", username: page.username })}>
                                Put it back
                            </Button>
                        </li>
                    ))}
                </ul>
            </div>
        </main>
    );
}

// For pages reported some other way (an email, a message): take one down by its name
function TakeDownForm({ busy, onSubmit }: { busy: boolean; onSubmit: (username: string) => void }) {
    const [username, setUsername] = useState("");

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                if (username.trim()) onSubmit(username.trim().replace(/^.*\//, "").toLowerCase());
            }}
            className={`${card} mt-8 flex flex-wrap items-end gap-3`}
        >
            <label className="min-w-0 flex-1 text-[13px] font-medium text-ink/70">
                Take a page down by its address
                <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder={`${SITE_HOST}/username`} className={`${inputClass} mt-1.5`} />
            </label>
            <Button type="submit" busy={busy} className="bg-danger hover:bg-danger/90">
                Take down
            </Button>
        </form>
    );
}
