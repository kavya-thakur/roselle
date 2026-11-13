"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { resetSchema, type ResetFormValues } from "@/lib/validations/auth";

export function ResetForm({ token }: { token: string }) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema), defaultValues: { token } });

    async function onSubmit(values: ResetFormValues) {
        setServerError(null);
        try {
            await api("/auth/reset", { method: "POST", body: values });
            // the reset signed this browser in
            router.replace("/editor");
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    return (
        <>
            <h1 className="font-display text-[44px]">
                A new <span className="text-pink">password</span>
            </h1>
            <p className="mt-3 text-[15px] text-muted">Choose one you don&apos;t use anywhere else. Every other device will be signed out.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 space-y-4">
                <Field label="New password" htmlFor="password" error={errors.password?.message ?? errors.token?.message}>
                    <input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} className={inputClass} />
                </Field>

                {serverError && (
                    <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {serverError}{" "}
                        <Link href="/forgot" className="font-semibold underline">
                            Send a new link
                        </Link>
                    </p>
                )}

                <Button type="submit" size="large" busy={isSubmitting} className="mt-3 w-full">
                    Save and sign in
                </Button>
            </form>
        </>
    );
}
