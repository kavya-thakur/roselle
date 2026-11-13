"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { IconStarFilled, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { api } from "@/lib/api/client";

interface Review {
    id: number;
    name: string;
    rating: number;
    text: string;
    service: string | null;
    createdAt: string;
    approved: boolean;
}

export function ReviewsView({ reviews: initial }: { reviews: Review[] }) {
    const [reviews, setReviews] = useState(initial);
    const [busy, setBusy] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function setApproved(id: number, approved: boolean) {
        setBusy(id);
        setError(null);
        try {
            await api(`/reviews/${id}`, { method: "PATCH", body: { approved } });
            setReviews((current) => current.map((review) => (review.id === id ? { ...review, approved } : review)));
        } catch (failure) {
            setError((failure as Error).message);
        } finally {
            setBusy(null);
        }
    }

    async function remove(id: number) {
        if (!window.confirm("Delete this review for good?")) return;
        setError(null);
        try {
            await api(`/reviews/${id}`, { method: "DELETE" });
            setReviews((current) => current.filter((review) => review.id !== id));
        } catch (failure) {
            setError((failure as Error).message);
        }
    }

    const waiting = reviews.filter((review) => !review.approved);
    const shown = reviews.filter((review) => review.approved);

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-6 py-12">
                <h1 className="font-display text-5xl">Reviews</h1>
                <p className="mt-2 text-sm text-muted">
                    From clients you asked after a paid job, so every one is real. Approved reviews show in your page&apos;s <span className="font-semibold text-ink">Reviews</span> block.
                </p>

                {error && (
                    <p role="alert" className="mt-6 rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {error}
                    </p>
                )}

                {reviews.length === 0 ? (
                    <div className="mt-10 rounded-3xl border border-dashed border-line-strong px-6 py-14 text-center">
                        <p className="font-display text-2xl">No reviews yet</p>
                        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                            When a job is done, mark it Paid in your{" "}
                            <Link href="/inbox" className="font-semibold text-pink hover:underline">
                                Inbox
                            </Link>{" "}
                            and press Ask for a review.
                        </p>
                    </div>
                ) : (
                    <>
                        <Section title={`Waiting for you (${waiting.length})`} empty="Nothing waiting.">
                            {waiting.map((review) => (
                                <ReviewCard key={review.id} review={review} onRemove={() => remove(review.id)}>
                                    <Button size="small" busy={busy === review.id} onClick={() => setApproved(review.id, true)}>
                                        Show on my page
                                    </Button>
                                </ReviewCard>
                            ))}
                        </Section>
                        <Section title={`On your page (${shown.length})`} empty="None approved yet.">
                            {shown.map((review) => (
                                <ReviewCard key={review.id} review={review} onRemove={() => remove(review.id)}>
                                    <Button size="small" look="secondary" busy={busy === review.id} onClick={() => setApproved(review.id, false)}>
                                        Hide
                                    </Button>
                                </ReviewCard>
                            ))}
                        </Section>
                    </>
                )}
            </div>
        </main>
    );
}

function Section({ title, empty, children }: { title: string; empty: string; children: ReactNode[] }) {
    return (
        <section className="mt-10">
            <h2 className="text-lg font-semibold">{title}</h2>
            {children.length === 0 ? <p className="mt-3 text-sm text-muted">{empty}</p> : <ul className="mt-4 space-y-3">{children}</ul>}
        </section>
    );
}

function ReviewCard({ review, onRemove, children }: { review: Review; onRemove: () => void; children: ReactNode }) {
    return (
        <li className="rounded-2xl border border-line bg-paper p-5 shadow-soft">
            <div className="flex items-center gap-0.5 text-pink" aria-label={`${review.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled key={star} size={15} aria-hidden className={star <= review.rating ? "" : "text-line-strong"} />
                ))}
                <span className="ml-auto text-xs text-muted">{new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
            </div>
            <blockquote className="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{review.text}</blockquote>
            <p className="mt-3 text-sm font-semibold">
                {review.name}
                {review.service && <span className="font-normal text-muted"> · {review.service}</span>}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
                {children}
                <button onClick={onRemove} aria-label="Delete review" className="ml-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-danger">
                    <IconTrash size={15} />
                </button>
            </div>
        </li>
    );
}
