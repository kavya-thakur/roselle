import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { SettingsView } from "./SettingsView";

export const metadata: Metadata = {
    title: "Settings",
};

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    // ?verified=1 or 0: just back from the link in the welcome email
    const { verified } = await searchParams;

    return (
        <SettingsView
            email={user.email}
            username={user.page.username}
            plan={user.plan}
            emailVerified={!!user.emailVerifiedAt}
            justVerified={verified === "1" ? true : verified === "0" ? false : null}
        />
    );
}
