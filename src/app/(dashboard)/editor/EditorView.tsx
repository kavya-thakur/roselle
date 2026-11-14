"use client";

import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    IconAlertCircle,
    IconArrowBackUp,
    IconArrowForwardUp,
    IconArrowUpRight,
    IconBrush,
    IconCheck,
    IconDeviceDesktop,
    IconDeviceMobile,
    IconEye,
    IconLayoutList,
    IconLoader2,
    IconMenu2,
    IconRestore,
    IconSettings,
    IconUserSquareRounded,
    IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { PageRenderer } from "@/components/PageRenderer";
import type { PublicReview } from "@/lib/reviews";
import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";
import { SITE_HOST } from "@/lib/site";
import type { PageDoc } from "@/lib/validations/page";
import { CopyLink } from "../CopyLink";
import { LogoutButton } from "../LogoutButton";
import { ContentPanel } from "./ContentPanel";
import { HeaderPanel } from "./HeaderPanel";
import { DesignPanel } from "./DesignPanel";
import { record, redo, start, undo } from "./history";

const SECTIONS = [
    { id: "content", label: "Content", icon: IconLayoutList },
    { id: "header", label: "Header", icon: IconUserSquareRounded },
    { id: "design", label: "Design", icon: IconBrush },
] as const;
type Section = (typeof SECTIONS)[number]["id"];

// How long typing has to pause before the draft is saved
const AUTOSAVE_DELAY = 800;

interface EditorViewProps {
    username: string;
    initialDraft: PageDoc;
    initialPublished: PageDoc | null;
    initialPublishedAt: string | null;
    clicks: Record<string, number>;
    reviews: PublicReview[];
}

// The whole editor, laid out like a workbench: the sections on a rail at the left, the one
// you're in on a white card, and the page itself in a phone on the right, changing as you type.
// Below laptop width there's no room for three columns, so it works like a phone app: the card
// takes the whole width, the sections sit in a bar at the bottom, and Preview opens the page
// full screen.
// Every change is saved as a draft a moment later; Publish makes the draft what visitors see.
// Any change can be undone and redone (the buttons in the top bar, or ⌘Z / ⇧⌘Z), and the whole
// draft can be put back to the original with "Discard changes", after a confirmation.
export function EditorView({ username, initialDraft, initialPublished, initialPublishedAt, clicks, reviews }: EditorViewProps) {
    const router = useRouter();
    const [history, setHistory] = useState(() => start(initialDraft));
    const page = history.present;
    // what every panel calls to change the page: each change becomes a step in the history
    const setPage: Dispatch<SetStateAction<PageDoc>> = useCallback(
        (change) => setHistory((current) => record(current, typeof change === "function" ? change(current.present) : change, Date.now())),
        [],
    );
    const [published, setPublished] = useState(initialPublished);
    const [publishedAt, setPublishedAt] = useState(initialPublishedAt);
    const [section, setSection] = useState<Section>("content");
    const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
    const [menuOpen, setMenuOpen] = useState(false);
    // phones and tablets: the page opens full screen from the bottom bar instead of sitting beside the card
    const [previewOpen, setPreviewOpen] = useState(false);
    const [save, setSave] = useState<{ state: "saved" | "saving" | "error"; message?: string }>({ state: "saved" });
    const [publishing, setPublishing] = useState(false);

    // the draft as last saved, to know whether there's anything new to save
    const savedJson = useRef(JSON.stringify(initialDraft));

    // Autosave: each change restarts the timer, so a burst of typing is one save
    useEffect(() => {
        const json = JSON.stringify(page);
        // back to what's saved (a change undone before it was saved, or one that failed to save):
        // nothing to do, and the "Saving" or "Not saved" from that change must not be left showing
        if (json === savedJson.current) {
            setSave((previous) => (previous.state === "saved" ? previous : { state: "saved" }));
            return;
        }

        setSave({ state: "saving" });
        const timer = setTimeout(async () => {
            try {
                await api("/page", { method: "PUT", body: { draft: page } });
                savedJson.current = json;
                setSave({ state: "saved" });
            } catch (error) {
                // said once when saving starts failing, not again on every keystroke after
                setSave((previous) => {
                    if (previous.state !== "error") toast.error("Your changes aren't saving", `${(error as Error).message} They'll save once you're back online.`);
                    return { state: "error", message: (error as Error).message };
                });
            }
        }, AUTOSAVE_DELAY);

        return () => clearTimeout(timer);
    }, [page]);

    // Closing the tab mid-save would lose the last change: let the browser ask first
    useEffect(() => {
        if (save.state === "saved") return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [save.state]);

    // ⌘Z / Ctrl+Z undoes, with Shift (or Ctrl+Y) redoes, wherever the cursor is: the text fields
    // are part of the page, so their typing is undone through the same history
    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
            const key = event.key.toLowerCase();
            if (key !== "z" && key !== "y") return;
            event.preventDefault();
            setHistory((current) => (key === "y" || event.shiftKey ? redo(current) : undo(current)));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    const unpublished = JSON.stringify(page) !== JSON.stringify(published);

    // "The page I had": what visitors see now, or, for a page never published, the page as it was
    // when the editor opened
    const original = published ?? initialDraft;
    const changed = JSON.stringify(page) !== JSON.stringify(original);
    const discardDialog = useRef<HTMLDialogElement>(null);

    // Back to the original, once confirmed. A step like any other, so Undo still brings the edits back.
    function discard() {
        discardDialog.current?.close();
        setHistory((current) => record({ ...current, changedAt: 0 }, original, Date.now()));
        toast(published ? "Back to your live page" : "Back to where you started", { detail: "Changed your mind? Undo brings your edits back." });
    }

    async function publish() {
        setPublishing(true);
        try {
            // publish copies the saved draft, so save what's on screen first
            if (JSON.stringify(page) !== savedJson.current) {
                await api("/page", { method: "PUT", body: { draft: page } });
                savedJson.current = JSON.stringify(page);
                setSave({ state: "saved" });
            }
            const result = await api<{ publishedAt: string }>("/page/publish", { method: "POST" });
            setPublished(page);
            setPublishedAt(result.publishedAt);
            toast("Your page is live", { detail: `${SITE_HOST}/${username} now shows these changes.` });
            // the sidebar's setup checklist is drawn on the server from the saved page
            router.refresh();
        } catch (error) {
            toast.error("Not published", (error as Error).message);
        } finally {
            setPublishing(false);
        }
    }

    const title = SECTIONS.find((item) => item.id === section)!.label;

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            {/* ---------- top bar ---------- */}
            <header className="relative flex h-18 shrink-0 items-center gap-3 px-4 sm:px-5">
                <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen} className="flex size-11 items-center justify-center rounded-full bg-paper shadow-soft hover:bg-sand">
                        <IconMenu2 size={20} />
                    </button>
                    {menuOpen && (
                        <>
                            <span className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                            <nav className="absolute top-13 left-0 z-30 w-56 rounded-2xl border border-line bg-paper p-1.5 shadow-lifted animate-[fade-in_0.15s_ease-out]">
                                {[
                                    { href: "/analytics", label: "Analytics" },
                                    { href: "/settings", label: "Settings" },
                                    { href: `/${username}`, label: "View my page" },
                                ].map((item) => (
                                    <Link key={item.href} href={item.href} className="block rounded-xl px-3.5 py-2.5 text-sm font-medium hover:bg-sand">
                                        {item.label}
                                    </Link>
                                ))}
                                <div className="flex items-center justify-between border-t border-line px-3.5 pt-2 mt-1.5 text-sm text-muted">
                                    Log out <LogoutButton />
                                </div>
                            </nav>
                        </>
                    )}
                </div>

                {/* top left, like most design tools, and clear of the toasts at the top centre */}
                <div className="flex rounded-full bg-paper p-1 shadow-soft">
                    <button onClick={() => setHistory(undo)} disabled={history.past.length === 0} aria-label="Undo" title="Undo" className="flex size-9 items-center justify-center rounded-full transition hover:bg-sand disabled:pointer-events-none disabled:opacity-30">
                        <IconArrowBackUp size={18} />
                    </button>
                    <button onClick={() => setHistory(redo)} disabled={history.future.length === 0} aria-label="Redo" title="Redo" className="flex size-9 items-center justify-center rounded-full transition hover:bg-sand disabled:pointer-events-none disabled:opacity-30">
                        <IconArrowForwardUp size={18} />
                    </button>
                </div>
                {/* with Undo and Redo: the ways back */}
                {changed && (
                    <button
                        onClick={() => discardDialog.current?.showModal()}
                        aria-label="Discard changes"
                        title="Discard changes"
                        className="flex h-11 items-center gap-1.5 rounded-full bg-paper px-3.5 text-sm font-semibold shadow-soft transition hover:bg-sand lg:px-4"
                    >
                        <IconRestore size={17} />
                        <span className="hidden lg:inline">Discard changes</span>
                    </button>
                )}

                <a href={`/${username}`} target="_blank" className="absolute left-1/2 hidden h-11 -translate-x-1/2 items-center gap-2 rounded-full bg-paper px-4 text-sm font-semibold shadow-soft hover:bg-sand xl:flex">
                    @{username}
                    <IconArrowUpRight size={15} className="text-muted" />
                </a>

                <div className="ml-auto flex items-center gap-2">
                    <SaveState save={save} />
                    <CopyLink username={username} />
                    {publishedAt && !unpublished ? (
                        <span className="flex h-11 items-center gap-1.5 rounded-full bg-paper px-4 text-sm font-semibold text-muted shadow-soft">
                            <IconCheck size={16} className="text-success" /> Published
                        </span>
                    ) : (
                        <Button onClick={publish} busy={publishing} className="h-11 px-5">
                            Publish
                        </Button>
                    )}
                </div>
            </header>

            {/* the confirmation; a native <dialog>, so Esc, the backdrop and focus come for free */}
            <dialog
                ref={discardDialog}
                onClick={(event) => event.target === discardDialog.current && discardDialog.current.close()}
                aria-labelledby="discard-title"
                className="popup m-auto w-[min(400px,calc(100%-24px))] rounded-[2rem] bg-paper p-0 text-ink shadow-lifted"
            >
                <div className="px-6 pt-7 pb-6 text-center sm:px-8">
                    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-sand">
                        <IconRestore size={22} />
                    </span>
                    <h2 id="discard-title" className="mt-4 text-lg font-semibold">
                        Discard all your changes?
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                        {published
                            ? "Your page goes back to how it looks live right now. Everything you've changed since you last published will be removed."
                            : "Your page goes back to how it was when you opened the editor. Everything you've changed since will be removed."}
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-2.5">
                        <button autoFocus onClick={() => discardDialog.current?.close()} className="h-11 rounded-full bg-sand text-sm font-semibold transition hover:bg-line">
                            Keep editing
                        </button>
                        <button onClick={discard} className="h-11 rounded-full bg-danger text-sm font-semibold text-white transition hover:brightness-110">
                            Yes, discard
                        </button>
                    </div>
                </div>
            </dialog>

            <div className="flex min-h-0 flex-1">
                {/* ---------- the section rail ---------- */}
                <nav aria-label="Editor sections" className="hidden w-20 shrink-0 flex-col items-center gap-4 py-4 lg:flex">
                    {SECTIONS.map(({ id, label, icon: Icon }) => {
                        const active = section === id;
                        return (
                            <button key={id} onClick={() => setSection(id)} aria-current={active ? "page" : undefined} className="group flex flex-col items-center gap-1.5 text-xs font-medium">
                                <span className={`flex size-12 items-center justify-center rounded-full transition ${active ? "bg-ink text-white ring-4 ring-paper" : "bg-sand text-ink group-hover:bg-line"}`}>
                                    <Icon size={20} stroke={1.7} />
                                </span>
                                <span className={active ? "text-ink" : "text-muted"}>{label}</span>
                            </button>
                        );
                    })}
                    <Link href="/settings" aria-label="Settings" className="mt-auto flex size-12 items-center justify-center rounded-full bg-sand text-ink transition hover:bg-line">
                        <IconSettings size={20} stroke={1.7} />
                    </Link>
                </nav>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pb-28 lg:flex-row lg:overflow-hidden lg:pr-5 lg:pb-5 lg:pl-0">
                    {/* ---------- the section you're in ---------- */}
                    <section className="flex shrink-0 flex-col rounded-[2rem] bg-paper shadow-soft lg:min-h-0 lg:w-[min(620px,50%)]">
                        <div className="px-5 pt-6 pb-2 sm:px-8 sm:pt-7">
                            <h1 className="text-2xl font-semibold">{title}</h1>
                        </div>
                        <div className="px-4 pt-4 pb-8 sm:px-8 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                            {section === "content" && <ContentPanel page={page} username={username} clicks={clicks} onChange={setPage} onEditHeader={() => setSection("header")} />}
                            {section === "header" && <HeaderPanel page={page} onChange={setPage} />}
                            {section === "design" && <DesignPanel page={page} onChange={setPage} />}
                        </div>
                    </section>

                    {/* ---------- the live preview ---------- */}
                    <section aria-label="Preview" className="relative hidden min-w-0 flex-1 items-center justify-center pr-16 lg:flex lg:min-h-0">
                        {/* the page itself on a plain card: phone-wide or full width, no device drawn around it */}
                        <div
                            className={`h-[min(760px,calc(100dvh-140px))] min-h-[560px] max-w-full overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-lifted transition-[width] duration-300 ${
                                device === "mobile" ? "w-[380px] shrink-0" : "w-full max-w-5xl"
                            }`}
                        >
                            <div className="h-full overflow-y-auto overscroll-contain [scrollbar-width:none]">
                                <PageRenderer page={page} mode="preview" reviews={reviews} />
                            </div>
                        </div>

                        {/* a small toolbar beside the preview */}
                        <div className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col gap-1 rounded-full bg-paper p-1 shadow-soft">
                            {(["mobile", "desktop"] as const).map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setDevice(option)}
                                    aria-pressed={device === option}
                                    aria-label={`${option} preview`}
                                    title={`${option[0].toUpperCase()}${option.slice(1)} preview`}
                                    className={`flex size-10 items-center justify-center rounded-full transition ${device === option ? "bg-ink text-white" : "text-muted hover:bg-sand hover:text-ink"}`}
                                >
                                    {option === "mobile" ? <IconDeviceMobile size={18} /> : <IconDeviceDesktop size={18} />}
                                </button>
                            ))}
                            <a href={`/${username}`} target="_blank" aria-label="Open your page" title="Open your page" className="flex size-10 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-ink">
                                <IconArrowUpRight size={18} />
                            </a>
                        </div>
                    </section>
                </div>
            </div>

            {/* ---------- phones and tablets: the sections and Preview in a bar at the bottom ---------- */}
            <nav aria-label="Editor sections" className="fixed inset-x-3 bottom-3 z-30 flex rounded-full bg-ink p-1.5 text-white shadow-lifted lg:hidden">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setSection(id)}
                        aria-current={section === id ? "page" : undefined}
                        className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-semibold transition ${section === id ? "bg-white text-ink" : "text-white/70"}`}
                    >
                        <Icon size={19} stroke={1.8} />
                        {label}
                    </button>
                ))}
                <button onClick={() => setPreviewOpen(true)} className="flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-full bg-pink text-[11px] font-semibold text-white">
                    <IconEye size={19} stroke={1.8} />
                    Preview
                </button>
            </nav>

            {previewOpen && (
                <div role="dialog" aria-modal="true" aria-label="Preview of your page" className="fixed inset-0 z-40 flex flex-col bg-cream animate-[fade-in_0.2s_ease-out] lg:hidden">
                    <div className="flex h-14 shrink-0 items-center justify-between px-4">
                        <span className="text-sm font-semibold">Preview</span>
                        <button onClick={() => setPreviewOpen(false)} aria-label="Close the preview" className="flex size-10 items-center justify-center rounded-full bg-paper shadow-soft">
                            <IconX size={18} />
                        </button>
                    </div>
                    <div className="mx-3 mb-3 min-h-0 flex-1 overflow-hidden rounded-[1.75rem] border border-line bg-paper shadow-lifted">
                        <div className="h-full overflow-y-auto overscroll-contain">
                            <PageRenderer page={page} mode="preview" reviews={reviews} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SaveState({ save }: { save: { state: "saved" | "saving" | "error"; message?: string } }) {
    return (
        <p aria-live="polite" title={save.message} className={`hidden items-center gap-1 text-xs sm:flex ${save.state === "error" ? "text-danger" : "text-faint"}`}>
            {save.state === "saving" && <IconLoader2 size={13} className="animate-spin" />}
            {save.state === "saved" && <IconCheck size={13} />}
            {save.state === "error" && <IconAlertCircle size={13} />}
            {save.state === "saving" ? "Saving" : save.state === "saved" ? "Saved" : "Not saved"}
        </p>
    );
}
