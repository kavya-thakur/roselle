"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { IconStarFilled, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { LocalTime } from "@/components/LocalTime";
import { api } from "@/lib/api/client";
import { EmptyState } from "@/components/EmptyState";
import { toast } from "@/components/Toast";

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

    async function setApproved(id: number, approved: boolean) {
        setBusy(id);
        try {
            await api(`/reviews/${id}`, { method: "PATCH", body: { approved } });
            setReviews((current) => current.map((review) => (review.id === id ? { ...review, approved } : review)));
            toast(approved ? "The review is on your page" : "Review hidden", { detail: approved ? undefined : "It's off your page, and you can show it again any time." });
        } catch (failure) {
            toast.error("That didn't save", (failure as Error).message);
        } finally {
            setBusy(null);
        }
    }

    async function remove(id: number) {
        if (!window.confirm("Delete this review for good?")) return;
        try {
            await api(`/reviews/${id}`, { method: "DELETE" });
            setReviews((current) => current.filter((review) => review.id !== id));
            toast("Review deleted");
        } catch (failure) {
            toast.error("Couldn't delete it", (failure as Error).message);
        }
    }

    const waiting = reviews.filter((review) => !review.approved);
    const shown = reviews.filter((review) => review.approved);
    const average = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0;

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
                <h1 className="font-display text-5xl">Reviews</h1>
                <p className="mt-2 text-sm text-muted">
                    From clients you asked after a paid job, so every one is real. Approved reviews show in your page&apos;s <span className="font-semibold text-ink">Reviews</span> block.
                </p>

                {reviews.length === 0 ? (
                    <div className="mt-10">
                        <EmptyState picture="reviews" title="No reviews yet">
                            When a job is done, mark it Paid in your{" "}
                            <Link href="/inbox" className="font-semibold text-pink hover:underline">
                                Inbox
                            </Link>{" "}
                            and press Ask for a review. Your client gets a one-time link, so every review here is real.
                        </EmptyState>
                    </div>
                ) : (
                    <>
                        {/* the same headline tiles as the analytics page */}
                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <Tile tone="bg-forest text-white" label="Waiting for you" value={waiting.length} />
                            <Tile tone="bg-blush text-ink" label="On your page" value={shown.length} />
                            <Tile tone="bg-paper text-ink shadow-soft" label="Average rating" value={`${average.toFixed(1)} ★`} />
                        </div>

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
            {children.length === 0 ? <p className="mt-3 text-sm text-muted">{empty}</p> : <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</ul>}
        </section>
    );
}

function Tile({ tone, label, value }: { tone: string; label: string; value: ReactNode }) {
    return (
        <div className={`rounded-3xl p-5 ${tone}`}>
            <p className="text-[13px] font-bold opacity-80">{label}</p>
            <p className="mt-2 font-display text-4xl tabular-nums">{value}</p>
        </div>
    );
}

function ReviewCard({ review, onRemove, children }: { review: Review; onRemove: () => void; children: ReactNode }) {
    return (
        <li className="flex h-full flex-col rounded-3xl bg-paper p-5 shadow-soft">
            <div className="flex items-center gap-0.5 text-pink" aria-label={`${review.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <IconStarFilled key={star} size={15} aria-hidden className={star <= review.rating ? "" : "text-line-strong"} />
                ))}
                <span className="ml-auto text-xs text-muted"><LocalTime iso={review.createdAt} format="date" /></span>
            </div>
            <blockquote className="mt-3 text-[15px] leading-relaxed whitespace-pre-line">{review.text}</blockquote>
            <p className="mt-3 mb-4 text-sm font-semibold">
                {review.name}
                {review.service && <span className="font-normal text-muted"> · {review.service}</span>}
            </p>
            {/* mt-auto: the buttons line up along the bottom of a row of cards */}
            <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
                {children}
                <button onClick={onRemove} aria-label="Delete review" className="ml-auto flex size-8 items-center justify-center rounded-full text-muted hover:bg-sand hover:text-danger">
                    <IconTrash size={15} />
                </button>
            </div>
        </li>
    );
}
