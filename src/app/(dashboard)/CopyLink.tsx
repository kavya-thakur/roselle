"use client";

import { toast } from "@/components/Toast";

import { useRef, useState } from "react";
import QRCode from "qrcode";
import { IconCheck, IconCopy, IconDownload, IconQrcode, IconX } from "@tabler/icons-react";

import { QrCode } from "@/components/QrCode";
import { SITE_HOST } from "@/lib/site";

// The page address with a copy button (the thing people do most right after publishing),
// and its QR code, for printing on a flyer, a business card or a shop counter
export function CopyLink({ username }: { username: string }) {
    const [copied, setCopied] = useState(false);
    const [address, setAddress] = useState("");
    const dialog = useRef<HTMLDialogElement>(null);

    async function copy() {
        await navigator.clipboard.writeText(`${window.location.origin}/${username}`);
        setCopied(true);
        toast("Link copied", { detail: "Paste it in your bio, a message or an email." });
        setTimeout(() => setCopied(false), 1800);
    }

    function openQr() {
        // read here, not while rendering: the server doesn't know which address it's served at.
        // Tagged ?via=qr, so analytics can tell visits from print (flyers, cards) apart
        setAddress(`${window.location.origin}/${username}?via=qr`);
        dialog.current?.showModal();
    }

    // a big PNG for print; the SVG is the same squares, for designers
    async function download(kind: "png" | "svg") {
        const href =
            kind === "png"
                ? await QRCode.toDataURL(address, { width: 1200, margin: 2, errorCorrectionLevel: "M" })
                : URL.createObjectURL(new Blob([await QRCode.toString(address, { type: "svg", margin: 2, errorCorrectionLevel: "M" })], { type: "image/svg+xml" }));
        const link = document.createElement("a");
        link.href = href;
        link.download = `roselle-${username}.${kind}`;
        link.click();
        toast(`QR code saved as ${kind.toUpperCase()}`, { detail: kind === "png" ? "Big enough to print on a flyer or a card." : "Scales to any size, for designers and printers." });
        if (kind === "svg") URL.revokeObjectURL(href);
    }

    return (
        <>
            <div className="hidden items-center rounded-full border border-line bg-paper pl-4 text-sm sm:flex">
                <a href={`/${username}`} target="_blank" className="font-medium text-muted transition hover:text-ink">
                    {SITE_HOST}/<span className="font-semibold text-ink">{username}</span>
                </a>
                <button onClick={openQr} aria-label="QR code for your page" title="QR code" className="ml-2 flex size-9 items-center justify-center rounded-full text-muted transition hover:bg-sand hover:text-ink">
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

            {/* a native <dialog>: Esc, the backdrop and focus come for free */}
            <dialog
                ref={dialog}
                onClick={(event) => event.target === dialog.current && dialog.current.close()}
                className="popup m-auto w-[min(380px,calc(100%-24px))] rounded-[2rem] bg-paper p-0 text-ink shadow-lifted"
            >
                <div className="relative border-b border-line px-6 py-5 text-center">
                    <h2 className="text-lg font-semibold">Your QR code</h2>
                    <button onClick={() => dialog.current?.close()} aria-label="Close" className="absolute top-1/2 right-5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full hover:bg-sand">
                        <IconX size={20} />
                    </button>
                </div>
                <div className="flex flex-col items-center px-6 pt-6 pb-7">
                    {address && <QrCode value={address} size={232} className="rounded-2xl border border-line" />}
                    <p className="mt-4 text-center text-sm text-muted">Scanning it opens {address.replace(/^https?:\/\//, "").replace(/\?via=qr$/, "")}. Put it on anything printed.</p>
                    <div className="mt-6 grid w-full grid-cols-2 gap-2.5">
                        <button onClick={() => download("png")} className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white hover:bg-[#2e2e2e]">
                            <IconDownload size={16} /> PNG
                        </button>
                        <button onClick={() => download("svg")} className="flex h-11 items-center justify-center gap-2 rounded-full bg-sand text-sm font-semibold hover:bg-line">
                            <IconDownload size={16} /> SVG
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
