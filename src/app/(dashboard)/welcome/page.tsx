import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { Welcome } from "./Welcome";

export const metadata: Metadata = { title: "Welcome" };

// First run: three questions that turn into a page that fits the creator. Only once.
export default async function WelcomePage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (user.onboardedAt) redirect("/editor");

    return <Welcome username={user.page.username} />;
}
