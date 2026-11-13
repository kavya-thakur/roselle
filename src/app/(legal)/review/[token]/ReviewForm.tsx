"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { IconStarFilled } from "@tabler/icons-react";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { reviewSchema } from "@/lib/validations/enquiry";
import type { z } from "zod";

type Values = z.input<typeof reviewSchema>;

export function ReviewForm({ token, name, creator, username }: { token: string; name: string; creator: string; username: string }) {
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors, isSubmitting },
    } = useForm<Values>({ resolver: zodResolver(reviewSchema), defaultValues: { token, name, rating: 0, text: "" } });
    const rating = useWatch({ control, name: "rating" });

    async function onSubmit(values: Values) {
        setServerError(null);
        try {
            await api("/review", { method: "POST", body: values });
            setSent(true);
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    if (sent) {
        return (
            <div className="mt-10 rounded-2xl bg-success/10 px-5 py-4 text-[15px] text-success">
                Thank you. {creator} will see it shortly.{" "}
                <Link href={`/${username}`} className="font-semibold underline underline-offset-2">
                    Back to their page
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 space-y-6">
            <fieldset>
                <legend className="mb-2 text-[13px] font-medium text-ink/70">Your rating</legend>
                {/* five real radio buttons, so it works by keyboard; the stars are their look */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <label key={star} className="cursor-pointer">
                            <input type="radio" name="rating" value={star} checked={rating === star} onChange={() => setValue("rating", star, { shouldValidate: true })} className="peer sr-only" />
                            <IconStarFilled
                                size={34}
                                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                                className={`rounded transition peer-focus-visible:outline-2 peer-focus-visible:outline-pink ${star <= rating ? "text-pink" : "text-line-strong hover:text-pink/50"}`}
                            />
                        </label>
                    ))}
                </div>
                {errors.rating && (
                    <p role="alert" className="mt-1.5 text-[13px] text-danger">
                        {errors.rating.message}
                    </p>
                )}
            </fieldset>

            <Field label="Your review" htmlFor="text" error={errors.text?.message}>
                <textarea id="text" rows={5} {...register("text")} placeholder="What was it like, and how did it turn out?" className={`${inputClass} h-auto py-2.5`} />
            </Field>

            <Field label="Your name, as it will show" htmlFor="name" error={errors.name?.message}>
                <input id="name" {...register("name")} autoComplete="name" className={inputClass} />
            </Field>

            {serverError && (
                <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                    {serverError}
                </p>
            )}

            <Button type="submit" size="large" busy={isSubmitting}>
                Send review
            </Button>
        </form>
    );
}
