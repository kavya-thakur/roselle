"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { forgotSchema, type ForgotFormValues } from "@/lib/validations/auth";

export function ForgotForm() {
    const [sentTo, setSentTo] = useState<string | null>(null);
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema) });

    async function onSubmit(values: ForgotFormValues) {
        setServerError(null);
        try {
            await api("/auth/forgot", { method: "POST", body: values });
            setSentTo(values.email);
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    return (
        <>
            <h1 className="font-display text-[44px]">
                Forgot your <span className="text-pink">password?</span>
            </h1>

            {sentTo ? (
                <p role="status" className="mt-6 rounded-xl bg-success/10 px-4 py-3 text-[15px] text-success">
                    If {sentTo} has an account, a link to choose a new password is on its way. It works for one hour.
                </p>
            ) : (
                <>
                    <p className="mt-3 text-[15px] text-muted">Enter your email and we&apos;ll send you a link to choose a new one.</p>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 space-y-4">
                        <Field label="Email" htmlFor="email" error={errors.email?.message}>
                            <input id="email" type="email" autoComplete="email" placeholder="you@studio.com" aria-invalid={!!errors.email} {...register("email")} className={inputClass} />
                        </Field>

                        {serverError && (
                            <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                                {serverError}
                            </p>
                        )}

                        <Button type="submit" size="large" busy={isSubmitting} className="mt-3 w-full">
                            Send reset link
                        </Button>
                    </form>
                </>
            )}

            <p className="mt-8 text-center text-sm text-muted">
                Remembered it?{" "}
                <Link href="/login" className="font-semibold text-pink hover:underline">
                    Sign in
                </Link>
            </p>
        </>
    );
}
