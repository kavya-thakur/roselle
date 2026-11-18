"use client";

import { toast } from "@/components/Toast";

import { useRef, useState } from "react";
import QRCode from "qrcode";
import { IconBrandInstagram, IconCheck, IconCopy, IconDownload, IconLoader2, IconPrinter, IconQrcode, IconShare3, IconX } from "@tabler/icons-react";

import { QrCode } from "@/components/QrCode";
import { SITE_HOST } from "@/lib/site";

// The share kit: drawn on the server from the published page (src/lib/pages/shareImages.tsx)
const PICTURES = {
    story: { label: "Instagram story", hint: "Your photo, name and services, sized for a story", Icon: IconBrandInstagram },
    poster: { label: "Poster to print", hint: "A4, with a big QR code to scan", Icon: IconPrinter },
} as const;
type Picture = keyof typeof PICTURES;

function save(href: string, name: string) {
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    link.click();
}

// The page address with a copy button (the thing people do most right after publishing), and
// "Share your page": a story picture, a poster, and the QR code for a flyer, a card or a counter
export function CopyLink({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const [address, setAddress] = useState("");
    const [making, setMaking] = useState<Picture | null>(null);
    const dialog = useRef<HTMLDialogElement>(null);

    async function copy() {
        await navigator.clipboard.writeText(`${window.location.origin}/${username}`);
        setCopied(true);
        toast("Link copied", { detail: "Paste it in your bio, a message or an email." });
        setTimeout(() => setCopied(false), 1800);
    }

    function openShare() {
        // read here, not while rendering: the server doesn't know which address it's served at.
        // Tagged ?via=qr, so analytics can tell visits from print (flyers, cards) apart
        setAddress(`${window.location.origin}/${username}?via=qr`);
        dialog.current?.showModal();
    }

    // a big PNG for print; the SVG is the same squares, for designers
    async function downloadQr(kind: "png" | "svg") {
        const href =
            kind === "png"
                ? await QRCode.toDataURL(address, { width: 1200, margin: 2, errorCorrectionLevel: "M" })
                : URL.createObjectURL(new Blob([await QRCode.toString(address, { type: "svg", margin: 2, errorCorrectionLevel: "M" })], { type: "image/svg+xml" }));
        save(href, `roselle-${username}.${kind}`);
        toast(`QR code saved as ${kind.toUpperCase()}`, { detail: kind === "png" ? "Big enough to print on a flyer or a card." : "Scales to any size, for designers and printers." });
        if (kind === "svg") URL.revokeObjectURL(href);
    }

    // On a phone the picture opens the share sheet, so a story goes straight to Instagram;
    // on a computer (or when the phone won't share it) it downloads
    async function makePicture(kind: Picture) {
        setMaking(kind);
        try {
            const res = await fetch(`/api/share/${kind}`);
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? "Please try again in a moment.");
            const file = new File([await res.blob()], `roselle-${username}-${kind}.png`, { type: "image/png" });

            if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({ files: [file] });
                    return;
                } catch (error) {
                    // closed the share sheet: nothing to do. Refused (too long after the tap): download instead
                    if ((error as Error).name === "AbortError") return;
                }
            }
            const href = URL.createObjectURL(file);
            save(href, file.name);
            URL.revokeObjectURL(href);
            toast(kind === "story" ? "Story picture saved" : "Poster saved", {
                detail: kind === "story" ? "Post it as a story, then add a link sticker with your address." : "Print it on A4, or send it to a print shop.",
            });
        } catch (error) {
            toast.error("Couldn't make the picture", (error as Error).message);
        } finally {
            setMaking(null);
        }
    }

    return (
        <>
            <div className="hidden items-center rounded-full border border-line bg-paper pl-4 text-sm sm:flex">
                <a href={`/${username}`} target="_blank" className="font-medium text-muted transition hover:text-ink">
                    {SITE_HOST}/<span className="font-semibold text-ink">{username}</span>
                </a>
                <button onClick={openShare} aria-label="Share your page" title="Share your page" className="ml-2 flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-sand hover:text-ink">
                    <IconQrcode size={18} />
                </button>
                <button
                    onClick={copy}
                    aria-label="Copy your page link"
                    className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 font-semibold transition ${copied ? "bg-success text-white" : "bg-ink text-white hover:bg-[#2e2e2e]"}`}
                >
                    {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                    {copied ? "Copied" : "Copy"}
                </button>
            </div>
            {/* on a phone the address doesn't fit: one button opens everything */}
            <button onClick={openShare} aria-label="Share your page" className="flex size-11 items-center justify-center rounded-full bg-paper shadow-soft hover:bg-sand sm:hidden">
                <IconShare3 size={19} />
            </button>

            {/* a native <dialog>: Esc, the backdrop and focus come for free */}
            <dialog
                ref={dialog}
                onClick={(event) => event.target === dialog.current && dialog.current.close()}
                className="popup m-auto max-h-[calc(100dvh-24px)] w-[min(420px,calc(100%-24px))] overflow-y-auto rounded-[2rem] bg-paper p-0 text-ink shadow-lifted"
            >
                <div className="relative border-b border-line px-6 py-5 text-center">
                    <h2 className="text-lg font-semibold">Share your page</h2>
                    <button onClick={() => dialog.current?.close()} aria-label="Close" className="absolute top-1/2 right-5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand">
                        <IconX size={20} />
                    </button>
                </div>

                <div className="px-6 pt-5 pb-7">
                    <button onClick={copy} className="flex h-12 w-full items-center justify-between gap-3 rounded-2xl bg-sand/60 pr-2 pl-4 text-left text-sm hover:bg-sand">
                        <span className="min-w-0 truncate">
                            {SITE_HOST}/<span className="font-semibold">{username}</span>
                        </span>
                        <span className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 font-semibold text-white ${copied ? "bg-success" : "bg-ink"}`}>
                            {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                            {copied ? "Copied" : "Copy"}
                        </span>
                    </button>

                    <div className="mt-4 space-y-2.5">
                        {(Object.keys(PICTURES) as Picture[]).map((kind) => {
                            const { label, hint, Icon } = PICTURES[kind];
                            return (
                                <button
                                    key={kind}
                                    onClick={() => makePicture(kind)}
                                    disabled={making !== null}
                                    className="flex w-full items-center gap-3.5 rounded-2xl border border-line p-3.5 text-left transition hover:border-ink disabled:opacity-60"
                                >
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blush text-pink">
                                        <Icon size={22} stroke={1.7} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold">{label}</span>
                                        <span className="block text-xs text-muted">{hint}</span>
                                    </span>
                                    {making === kind ? <IconLoader2 size={18} className="animate-spin text-muted" /> : <IconDownload size={18} className="text-muted" />}
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2.5 text-xs text-muted">Made from your published page, in its colours.</p>

                    <div className="mt-6 flex items-center gap-4 border-t border-line pt-5">
                        {address && <QrCode value={address} size={104} className="shrink-0 rounded-xl border border-line" />}
                        <div className="min-w-0">
                            <p className="text-sm font-semibold">QR code</p>
                            <p className="text-xs text-muted">For a flyer, a card or a counter. Scanning it opens your page.</p>
                            <div className="mt-2.5 flex gap-2">
                                <button onClick={() => downloadQr("png")} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-xs font-semibold text-white hover:bg-[#2e2e2e]">
                                    <IconDownload size={14} /> PNG
                                </button>
                                <button onClick={() => downloadQr("svg")} className="flex h-9 items-center gap-1.5 rounded-full bg-sand px-3.5 text-xs font-semibold hover:bg-line">
                                    <IconDownload size={14} /> SVG
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </dialog>
        </>
    );
}
