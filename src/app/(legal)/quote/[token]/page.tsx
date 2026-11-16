/* eslint-disable @next/next/no-img-element -- one small avatar, already sized by sized() */
import type { Metadata } from "next";
import Link from "next/link";

import { LocalTime } from "@/components/LocalTime";
import { sized } from "@/lib/media/sized";
import { quoteFor, upiPayLink } from "@/lib/quotes";
import { formatMoney } from "@/lib/utils/format";
import { AcceptQuote } from "./AcceptQuote";

export async function generateMetadata({ params }: PageProps<"/quote/[token]">): Promise<Metadata> {
    const quote = await quoteFor((await params).token);
    // a private link: never in search results
    return { title: quote ? `Quote from ${quote.creator}` : "Quote", robots: { index: false } };
}

// The link in a quote message: what's included, the price, and a button that books it. Once
// accepted, how to pay the deposit straight to the creator (Roselle never touches the money).
export default async function QuotePage({ params }: PageProps<"/quote/[token]">) {
    const { token } = await params;
    const quote = await quoteFor(token);

    if (!quote) {
        return (
            <>
                <h1 className="font-display text-5xl text-ink">This quote is no longer available</h1>
                <p className="mt-3 text-[16px] text-muted">It may have been called off. Please get in touch with them directly.</p>
            </>
        );
    }

    const money = (value: number) => formatMoney(value, quote.currency);
    const payTo = quote.payTo;
    const forWhat = quote.service || "your enquiry";

    return (
        <>
            <Link href={`/${quote.username}`} className="inline-flex items-center gap-3 text-sm font-semibold text-ink">
                {quote.avatar ? (
                    <img src={sized(quote.avatar, 96)} alt="" className="size-11 rounded-full object-cover" />
                ) : (
                    <span className="flex size-11 items-center justify-center rounded-full bg-blush font-display text-xl">{quote.creator.charAt(0).toUpperCase()}</span>
                )}
                {quote.creator}
            </Link>

            <h1 className="mt-6 font-display text-5xl text-ink">Your quote for {forWhat}</h1>
            <p className="mt-3 text-[15px] text-muted">
                For {quote.name}
                {quote.wantedOn && (
                    <>
                        {" "}· <LocalTime iso={`${quote.wantedOn}T12:00:00`} format="date" />
                    </>
                )}
                {" "}· Sent <LocalTime iso={quote.quoteSentAt!.toISOString()} format="date" />
            </p>

            <section className="mt-8 rounded-3xl bg-paper p-6 shadow-soft">
                <h2 className="text-sm font-semibold text-muted">What&apos;s included</h2>
                <p className="mt-2 text-[16px] leading-relaxed whitespace-pre-line text-ink">{quote.quoteDetails}</p>

                <dl className="mt-6 space-y-2 border-t border-line pt-4 text-[15px]">
                    <div className="flex justify-between gap-4">
                        <dt className="font-semibold">Total</dt>
                        <dd className="font-semibold tabular-nums">{money(quote.amount)}</dd>
                    </div>
                    {quote.deposit > 0 && (
                        <>
                            <div className="flex justify-between gap-4 text-muted">
                                <dt>Deposit to book</dt>
                                <dd className="tabular-nums">{money(quote.deposit)}</dd>
                            </div>
                            {quote.deposit < quote.amount && (
                                <div className="flex justify-between gap-4 text-muted">
                                    <dt>The rest, as agreed</dt>
                                    <dd className="tabular-nums">{money(quote.amount - quote.deposit)}</dd>
                                </div>
                            )}
                        </>
                    )}
                </dl>
            </section>

            <AcceptQuote
                token={token}
                accepted={!!quote.quoteAcceptedAt}
                creator={quote.creator}
                deposit={quote.deposit > 0 ? money(quote.deposit) : null}
                payTo={
                    payTo?.kind === "url"
                        ? { href: payTo.href }
                        : payTo?.kind === "upi"
                          ? { upi: payTo.id, href: upiPayLink(payTo.id, quote.deposit, quote.currency, quote.creator, `Deposit: ${forWhat}`) }
                          : null
                }
            />
        </>
    );
}
