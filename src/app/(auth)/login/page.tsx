import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
    title: "Sign in",
};

// Already signed in (the session lasts 30 days): straight to the editor, not a form asking again
export default async function LoginPage() {
    if (await getCurrentUser()) redirect("/editor");

    return <LoginForm />;
}
