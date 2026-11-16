"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconArrowUpRight } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { inputClass } from "@/components/Field";
import { LocalTime } from "@/components/LocalTime";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/components/Toast";
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

export function AdminView({ reports, suspended }: { reports: Report[]; suspended: { username: string; reason: string; suspendedAt: string }[] }) {
    const router = useRouter();
    const [busy, setBusy] = useState<string | null>(null);

    // The Reports tab: reports from visitors, and the pages that are taken down.
    // Every action goes to /api/admin, then the lists are read again from the server
    async function run(key: string, action: AdminAction) {
        setBusy(key);
        try {
            await api("/admin", { method: "POST", body: action });
            toast(action.action === "suspend" ? `${action.username} is taken down` : action.action === "restore" ? `${action.username} is back up` : "Report dismissed", {
                detail: action.action === "suspend" ? "The owner has been emailed the reason." : undefined,
            });
            router.refresh();
        } catch (failure) {
            toast.error("That didn't work", (failure as Error).message);
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
        <div className="max-w-3xl">
            <TakeDownForm busy={busy === "form"} onSubmit={(username) => takeDown(username, "")} />

            <h2 className="mt-12 text-lg font-semibold">Open reports ({reports.length})</h2>
            {reports.length === 0 && <EmptyState compact picture="shield" title="All clear" />}
            <ul className="mt-4 space-y-3">
                {reports.map((report) => (
                    <li key={report.id} className={card}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <a href={`/${report.username}`} target="_blank" className="flex items-center gap-1 font-semibold hover:underline">
                                {SITE_HOST}/{report.username} <IconArrowUpRight size={14} />
                            </a>
                            <span className="text-xs text-muted"><LocalTime iso={report.createdAt} /></span>
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
            {suspended.length === 0 && <EmptyState compact picture="tray" title="No pages are down" />}
            <ul className="mt-4 space-y-3">
                {suspended.map((page) => (
                    <li key={page.username} className={`${card} flex flex-wrap items-center gap-3`}>
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold">{SITE_HOST}/{page.username}</p>
                            <p className="mt-0.5 text-sm text-muted">
                                {page.reason} · <LocalTime iso={page.suspendedAt} />
                            </p>
                        </div>
                        <Button size="small" look="secondary" busy={busy === `up:${page.username}`} onClick={() => run(`up:${page.username}`, { action: "restore", username: page.username })}>
                            Put it back
                        </Button>
                    </li>
                ))}
            </ul>
        </div>
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
