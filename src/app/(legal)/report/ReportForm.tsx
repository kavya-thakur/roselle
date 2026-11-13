"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { REPORT_REASONS, reportSchema, type ReportFormValues } from "@/lib/validations/report";

export function ReportForm({ pageId }: { pageId: number }) {
    const [sent, setSent] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ReportFormValues>({ resolver: zodResolver(reportSchema), defaultValues: { pageId, details: "", email: "" } });

    async function onSubmit(values: ReportFormValues) {
        setServerError(null);
        try {
            await api("/report", { method: "POST", body: values });
            setSent(true);
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    if (sent) {
        return (
            <p role="status" className="mt-10 rounded-2xl bg-success/10 px-5 py-4 text-[15px] text-success">
                Thank you. We&apos;ll look into it, and if the page breaks our rules we&apos;ll take it down.
            </p>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 space-y-6">
            <fieldset>
                <legend className="mb-2.5 text-[13px] font-medium text-ink/70">What&apos;s wrong?</legend>
                <div className="space-y-2">
                    {Object.entries(REPORT_REASONS).map(([value, label]) => (
                        <label key={value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-paper px-4 py-3 text-[15px] transition has-checked:border-ink has-checked:ring-1 has-checked:ring-ink">
                            <input type="radio" value={value} {...register("reason")} className="size-4 accent-ink" />
                            {label}
                        </label>
                    ))}
                </div>
                {errors.reason && (
                    <p role="alert" className="mt-1.5 text-[13px] text-danger">
                        {errors.reason.message}
                    </p>
                )}
            </fieldset>

            <Field label="Anything that helps us check (optional)" htmlFor="details" error={errors.details?.message}>
                <textarea id="details" rows={4} {...register("details")} className={`${inputClass} h-auto py-2.5`} placeholder="Which link, what it does, who it pretends to be…" />
            </Field>

            <Field label="Your email, if you'd like to hear back (optional)" htmlFor="email" error={errors.email?.message}>
                <input id="email" type="email" autoComplete="email" {...register("email")} className={inputClass} />
            </Field>

            {serverError && (
                <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                    {serverError}
                </p>
            )}

            <Button type="submit" size="large" busy={isSubmitting}>
                Send report
            </Button>
        </form>
    );
}
