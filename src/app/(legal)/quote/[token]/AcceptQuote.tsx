"use client";

import { useState } from "react";
import { IconCheck, IconCopy, IconExternalLink } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { toast } from "@/components/Toast";
import { api } from "@/lib/api/client";

interface AcceptQuoteProps {
    token: string;
    accepted: boolean;
    creator: string;
    // the deposit, already written as money ("₹5,000"); null when there isn't one
    deposit: string | null;
    // where it's paid: a payment page, or a UPI id (with an app link when it's in rupees)
    payTo: { href?: string; upi?: string } | null;
}

// Accept, then pay the deposit: the two things a client does here
export function AcceptQuote({ token, accepted: wasAccepted, creator, deposit, payTo }: AcceptQuoteProps) {
    const [accepted, setAccepted] = useState(wasAccepted);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function accept() {
        setBusy(true);
        setError(null);
        try {
            await api("/quote", { method: "POST", body: { token } });
            setAccepted(true);
        } catch (failure) {
            setError((failure as Error).message);
        } finally {
            setBusy(false);
        }
    }

    async function copy(id: string) {
        try {
            await navigator.clipboard.writeText(id);
            toast("UPI ID copied", { detail: "Paste it in any UPI app under \"Pay to UPI ID\"." });
        } catch {
            toast.error("Couldn't copy", "Select the UPI ID and copy it yourself.");
        }
    }

    if (!accepted) {
        return (
            <div className="mt-8">
                <Button size="large" busy={busy} onClick={accept} className="w-full sm:w-auto">
                    Accept quote
                </Button>
                <p className="mt-3 text-sm text-muted">
                    {creator} is told straight away{deposit ? `, and you'll see how to pay the ${deposit} deposit` : ""}. Questions first? Reply to their message.
                </p>
                {error && (
                    <p role="alert" className="mt-3 rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="mt-8 rounded-3xl bg-success/10 p-6">
            <p className="flex items-center gap-2 text-[16px] font-semibold text-success">
                <IconCheck size={20} /> You&apos;ve accepted this quote
            </p>
            {!deposit ? (
                <p className="mt-2 text-[15px] text-ink/80">{creator} has been told and will be in touch.</p>
            ) : !payTo ? (
                <p className="mt-2 text-[15px] text-ink/80">{creator} has been told and will let you know how to pay the {deposit} deposit.</p>
            ) : (
                <>
                    <p className="mt-2 text-[15px] text-ink/80">Pay the {deposit} deposit to book it. It goes straight to {creator}.</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {payTo.href && (
                            <a href={payTo.href} target={payTo.upi ? undefined : "_blank"} rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white hover:bg-[#2e2e2e]">
                                Pay {deposit} {payTo.upi ? "with a UPI app" : <IconExternalLink size={17} />}
                            </a>
                        )}
                        {payTo.upi && (
                            <button type="button" onClick={() => copy(payTo.upi!)} className="inline-flex h-12 items-center gap-2 rounded-full border border-line bg-paper px-5 text-[15px] font-semibold hover:border-line-strong">
                                <IconCopy size={17} /> {payTo.upi}
                            </button>
                        )}
                    </div>
                    {payTo.upi && <p className="mt-2 text-xs text-muted">On a computer? Copy the UPI ID and pay from your phone.</p>}
                </>
            )}
        </div>
    );
}
