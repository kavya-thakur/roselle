"use client";

import { useRef, useState, type ReactNode } from "react";
import { IconX } from "@tabler/icons-react";

import { QrCode } from "./QrCode";
import { useBackToClose } from "./useBackToClose";

// A UPI tip: the button opens the QR code to scan with any UPI app (a upi:// link only opens
// on a phone, and not every phone), plus a button straight into the app for those already on one.
// Closes with ✕, "Done", the backdrop, Esc or Back, once they've paid.
export function UpiPay({ href, children }: { href: string; children: ReactNode }) {
    const dialog = useRef<HTMLDialogElement>(null);
    const [open, setOpen] = useState(false);
    useBackToClose(open, () => dialog.current?.close());
    const id = new URLSearchParams(href.split("?")[1]).get("pa");

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    dialog.current?.showModal();
                    setOpen(true);
                }}
                className="page-button flex min-h-14 w-full cursor-pointer items-center gap-2 px-3 py-2 text-[15px] font-semibold"
            >
                {children}
            </button>

            <dialog
                ref={dialog}
                onClose={() => setOpen(false)}
                onClick={(event) => event.target === dialog.current && dialog.current.close()}
                className="popup m-auto w-[min(360px,calc(100%-32px))] rounded-[1.75rem] bg-(--page-base) p-0 text-(--page-text) shadow-lifted"
            >
                <div className="relative px-6 pt-6 pb-6 text-center">
                    <button type="button" onClick={() => dialog.current?.close()} aria-label="Close" className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-full hover:bg-[color-mix(in_oklab,var(--page-text)_10%,transparent)]">
                        <IconX size={20} />
                    </button>
                    <p className="text-lg font-semibold">Scan to pay</p>
                    <p className="mt-1 text-sm text-(--page-muted)">With any UPI app: GPay, PhonePe, Paytm…</p>

                    {/* on white, so every scanner reads it whatever the page's colours */}
                    <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-3">
                        <QrCode value={href} size={220} quiet={1} />
                    </div>
                    {id && <p className="mt-3 text-sm font-medium break-all">{id}</p>}

                    <a href={href} className="page-button mt-5 flex h-12 w-full items-center justify-center text-[15px] font-semibold">
                        Open a UPI app
                    </a>
                    <button type="button" onClick={() => dialog.current?.close()} className="mt-2 h-11 w-full rounded-full text-sm font-semibold text-(--page-muted) hover:text-(--page-text)">
                        Done
                    </button>
                </div>
            </dialog>
        </>
    );
}
