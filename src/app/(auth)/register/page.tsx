import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = {
    title: "Claim your page",
};

// The landing page's "<our address>/yourname" box sends people here with ?username= filled in
export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
    if (await getCurrentUser()) redirect("/editor");
    const { username } = await searchParams;

    return <RegisterForm username={typeof username === "string" ? username.toLowerCase().slice(0, 30) : ""} />;
}
