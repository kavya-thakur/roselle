"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { SITE_HOST } from "@/lib/site";

export function RegisterForm({ username }: { username: string }) {
    const router = useRouter();
    const [serverError, setServerError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { username },
    });

    async function onSubmit(values: RegisterFormValues) {
        setServerError(null);
        try {
            await api("/auth/register", { method: "POST", body: values });
            router.replace("/welcome");
        } catch (error) {
            setServerError((error as Error).message);
        }
    }

    return (
        <>
            <h1 className="font-display text-[44px]">
                Claim your <span className="text-pink">page</span>
            </h1>
            <p className="mt-3 text-[15px] text-muted">Free, and yours in under a minute.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9 space-y-4">
                <Field label="Your address" htmlFor="username" error={errors.username?.message}>
                    {/* the fixed part of the address sits inside the box, so it reads as one URL */}
                    <div className={`${inputClass} flex items-center px-0 focus-within:border-pink focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgb(224_64_143/0.1)]`} aria-invalid={!!errors.username}>
                        <span className="pl-3.5 text-faint select-none">{SITE_HOST}/</span>
                        <input
                            id="username"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            placeholder="yourname"
                            aria-invalid={!!errors.username}
                            {...register("username")}
                            className="h-full min-w-0 flex-1 bg-transparent pr-3.5 font-semibold outline-none"
                        />
                    </div>
                </Field>

                <Field label="Email" htmlFor="email" error={errors.email?.message}>
                    <input id="email" type="email" autoComplete="email" placeholder="you@studio.com" aria-invalid={!!errors.email} {...register("email")} className={inputClass} />
                </Field>

                <Field label="Password" htmlFor="password" error={errors.password?.message}>
                    <input id="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} className={inputClass} />
                </Field>

                {serverError && (
                    <p role="alert" className="rounded-xl bg-blush px-3.5 py-2.5 text-sm text-pink">
                        {serverError}
                    </p>
                )}

                <Button type="submit" size="large" busy={isSubmitting} className="mt-3 w-full">
                    {isSubmitting ? "Creating your page…" : "Create my page"}
                </Button>
                <p className="text-center text-xs text-muted">
                    By creating a page you agree to our{" "}
                    <Link href="/terms" className="underline underline-offset-2 hover:text-ink">terms</Link> and{" "}
                    <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">privacy policy</Link>.
                </p>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
                Already have a page?{" "}
                <Link href="/login" className="font-semibold text-pink hover:underline">
                    Sign in
                </Link>
            </p>
        </>
    );
}
