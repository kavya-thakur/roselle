"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

export function LoginForm() {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

    async function onSubmit(values: LoginFormValues) {
        setServerError(null);
        try {
            await api("/auth/login", { method: "POST", body: values });
            // the API set the session cookie, so the editor will let us in
            router.replace("/editor");
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    return (
        <>
            <h1 className="font-display text-[44px]">
                Welcome <span className="text-pink">back</span>
            </h1>
            <p className="mt-3 text-[15px] text-muted">Sign in to edit your page.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 space-y-4">
                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                    <input id="email" type="email" autoComplete="email" placeholder="you@studio.com" aria-invalid={!!errors.email} {...register("email")} className={inputClass} />
                </Field>

                <Field label="Password" htmlFor="password" error={errors.password?.message}>
                    <input id="password" type="password" autoComplete="current-password" placeholder="Your password" aria-invalid={!!errors.password} {...register("password")} className={inputClass} />
                </Field>
                <Link href="/forgot" className="-mt-1 block text-right text-[13px] font-semibold text-pink hover:underline">
                    Forgot password?
                </Link>

                {serverError && (
                    <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {serverError}
                    </p>
                )}

                <Button type="submit" size="large" busy={isSubmitting} className="mt-3 w-full">
                    {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                New here?{" "}
                <Link href="/register" className="font-semibold text-pink hover:underline">
                    Claim your page
                </Link>
            </p>
        </>
    );
}
