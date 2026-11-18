"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/Button";
import { Field, inputClass } from "@/components/Field";
import { api } from "@/lib/api/client";
import { toast } from "@/components/Toast";
import type { Plan } from "@/lib/plans";
import { deleteAccountSchema, passwordChangeSchema, usernameChangeSchema, type PasswordFormValues, type UsernameFormValues } from "@/lib/validations/settings";
import { SITE_HOST } from "@/lib/site";
import { PlanSection, type Billing } from "./PlanSection";

interface SettingsViewProps {
    email: string;
    username: string;
    plan: Plan;
    weeklyEmail: boolean;
    emailVerified: boolean;
    // just back from the email's link: did it work?
    justVerified: boolean | null;
    billing: Billing;
}

// the same card as the analytics page
const section = "rounded-3xl bg-paper p-5 shadow-soft sm:p-6";
const notice = (ok: boolean) => `rounded-xl px-3.5 py-2.5 text-sm ${ok ? "bg-success/10 text-success" : "bg-blush text-pink"}`;

export function SettingsView({ email, username, plan, weeklyEmail, emailVerified, justVerified, billing }: SettingsViewProps) {
    const router = useRouter();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<UsernameFormValues>({
        resolver: zodResolver(usernameChangeSchema),
        defaultValues: { username },
    });

    const changed = useWatch({ control, name: "username" }).trim().toLowerCase() !== username;

    async function onSubmit(values: UsernameFormValues) {
        try {
            await api("/settings/username", { method: "PUT", body: values });
            toast("Address changed", { detail: `Your page now lives at ${SITE_HOST}/${values.username}` });
            // the header's "View page" link reads the username on the server
            router.refresh();
        } catch (error) {
            toast.error("Couldn't change your address", (error as Error).message);
        }
    }

    return (
        <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 sm:py-12">
                <h1 className="font-display text-5xl">Settings</h1>
                <p className="mt-2 text-sm text-muted">Your address, your plan and how you sign in.</p>

                {/* forms on the left; the plan stays in view beside them on wide screens */}
                <div className="mt-8 grid items-start gap-3 lg:grid-cols-[1.4fr_1fr]">
                    <div className="grid gap-3">
                        <section className={section}>
                            <h2 className="text-lg font-semibold">Your address</h2>
                            <p className="mt-1 text-sm text-muted">The link you put in your bio. If you change it, the old one stops working and someone else could claim it.</p>

                            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
                                <Field label="Username" htmlFor="username" error={errors.username?.message}>
                                    <div className={`${inputClass} flex items-center px-0 focus-within:border-pink focus-within:bg-white`} aria-invalid={!!errors.username}>
                                        <span className="pl-3.5 text-faint select-none">{SITE_HOST}/</span>
                                        <input id="username" autoCapitalize="none" spellCheck={false} aria-invalid={!!errors.username} {...register("username")} className="h-full min-w-0 flex-1 bg-transparent pr-3.5 font-semibold outline-none" />
                                    </div>
                                </Field>

                                <Button type="submit" busy={isSubmitting} disabled={!changed}>
                                    Change address
                                </Button>
                            </form>
                        </section>

                        <AccountSection email={email} plan={plan} emailVerified={emailVerified} justVerified={justVerified} />
                        <EmailsSection weeklyEmail={weeklyEmail} />
                        <PasswordSection />
                        <DeleteSection />
                    </div>

                    {/* first on phones: it's the one card here that changes what the page looks like */}
                    <div className="-order-1 lg:sticky lg:top-6 lg:order-none">
                        <PlanSection billing={billing} email={email} />
                    </div>
                </div>
            </div>
        </main>
    );
}

// Who's signed in, whether that address is confirmed, and which plan they're on
function AccountSection({ email, plan, emailVerified, justVerified }: Omit<SettingsViewProps, "username" | "weeklyEmail" | "billing">) {
    const [sending, setSending] = useState(false);

    async function resend() {
        setSending(true);
        try {
            await api("/auth/verify", { method: "POST" });
            toast("Confirmation email sent", { detail: `Check ${email}, and the spam folder.` });
        } catch (error) {
            toast.error("Couldn't send it", (error as Error).message);
        } finally {
            setSending(false);
        }
    }

    return (
        <section className={section}>
            <h2 className="text-lg font-semibold">Account</h2>
            <p className="mt-1 text-sm text-muted">
                Signed in as <span className="font-semibold text-ink">{email}</span>
                {emailVerified ? " · confirmed" : ""}
            </p>
            <p className="mt-1 text-sm text-muted">
                Plan: <span className="font-semibold text-ink">{plan === "PRO" ? "Pro" : "Free"}</span>
            </p>

            {justVerified !== null && (
                <p role="status" className={`mt-4 ${notice(justVerified)}`}>
                    {justVerified ? "Thanks, your email is confirmed." : "That link has expired or was already used."}
                </p>
            )}

            {!emailVerified && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-sand/70 px-4 py-3 text-sm">
                    <span className="flex-1">Confirm your email, so you can always get back in if you forget your password.</span>
                    <Button look="secondary" size="small" busy={sending} onClick={resend}>
                        Send the link again
                    </Button>
                </div>
            )}
        </section>
    );
}

function PasswordSection() {
    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<PasswordFormValues>({ resolver: zodResolver(passwordChangeSchema), defaultValues: { current: "", password: "" } });

    async function onSubmit(values: PasswordFormValues) {
        try {
            await api("/settings/password", { method: "PUT", body: values });
            reset();
            toast("Password changed", { detail: "Any other devices have been signed out." });
        } catch (error) {
            const message = (error as Error).message;
            // a wrong current password belongs under that field
            if (message.includes("current password")) setError("current", { message });
            else toast.error("Couldn't change your password", message);
        }
    }

    return (
        <section className={section}>
            <h2 className="text-lg font-semibold">Password</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-4">
                <Field label="Current password" htmlFor="current" error={errors.current?.message}>
                    <input id="current" type="password" autoComplete="current-password" aria-invalid={!!errors.current} {...register("current")} className={inputClass} />
                </Field>
                <Field label="New password" htmlFor="new-password" error={errors.password?.message}>
                    <input id="new-password" type="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} className={inputClass} />
                </Field>
                <Button type="submit" busy={isSubmitting}>
                    Change password
                </Button>
            </form>
        </section>
    );
}

// Two steps on purpose: open it, then type the password and confirm
function DeleteSection() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function remove() {
        const parsed = deleteAccountSchema.safeParse({ password });
        if (!parsed.success) return setError(parsed.error.issues[0].message);

        setBusy(true);
        setError(null);
        try {
            await api("/settings/account", { method: "DELETE", body: parsed.data });
            router.replace("/");
        } catch (failure) {
            setError((failure as Error).message);
            setBusy(false);
        }
    }

    return (
        <section className={`${section} border border-danger/25`}>
            <h2 className="text-lg font-semibold">Delete account</h2>
            <p className="mt-1 text-sm text-muted">Your page goes offline and its address is free for anyone. Your links, images and analytics are deleted for good.</p>

            {open ? (
                <div className="mt-5 space-y-4">
                    <Field label="Type your password to confirm" htmlFor="delete-password" error={error ?? undefined}>
                        <input
                            id="delete-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            aria-invalid={!!error}
                            className={inputClass}
                        />
                    </Field>
                    <div className="flex gap-2">
                        <Button onClick={remove} busy={busy} className="bg-danger hover:bg-danger/90">
                            Delete everything
                        </Button>
                        <Button look="ghost" onClick={() => setOpen(false)}>
                            Keep my account
                        </Button>
                    </div>
                </div>
            ) : (
                <Button look="secondary" onClick={() => setOpen(true)} className="mt-5 text-danger">
                    Delete my account
                </Button>
            )}
        </section>
    );
}

// The emails Roselle sends on its own. Enquiries, reviews and account emails always come.
function EmailsSection({ weeklyEmail }: { weeklyEmail: boolean }) {
    const [on, setOn] = useState(weeklyEmail);
    async function toggle() {
        const next = !on;
        setOn(next);
        try {
            await api("/settings/business", { method: "PUT", body: { weeklyEmail: next } });
            toast(next ? "Weekly email on" : "Weekly email off", { detail: next ? "It comes on Mondays, when your page had a week worth telling." : undefined });
        } catch (failure) {
            setOn(!next);
            toast.error("Couldn't change that", (failure as Error).message);
        }
    }

    return (
        <section className={section}>
            <h2 className="text-lg font-semibold">Emails</h2>
            <div className="mt-4 flex items-start justify-between gap-6">
                <div>
                    <p className="text-[15px] font-medium">Your week, every Monday</p>
                    <p className="mt-0.5 text-sm text-muted">Visitors, enquiries, bookings and what needs doing, in one short email. Skipped on quiet weeks.</p>
                </div>
                <button
                    role="switch"
                    aria-checked={on}
                    aria-label="Weekly email"
                    onClick={toggle}
                    className={`relative mt-1 h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-forest" : "bg-line-strong"}`}
                >
                    <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-4" : ""}`} />
                </button>
            </div>
            <p className="mt-3 text-sm text-muted">New enquiries, a reminder when someone has waited a day, and new reviews always reach you.</p>
        </section>
    );
}
