import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { billingEnabled } from "@/lib/billing";
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
    // the last few Pro payments, as a receipt list
    const payments = await prisma.payment.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6, select: { id: true, createdAt: true, amount: true, period: true, razorpayPaymentId: true } });

    return (
        <SettingsView
            email={user.email}
            username={user.page.username}
            plan={user.plan}
            weeklyEmail={user.weeklyEmail}
            emailVerified={!!user.emailVerifiedAt}
            justVerified={verified === "1" ? true : verified === "0" ? false : null}
            billing={{
                plan: user.plan,
                enabled: billingEnabled(),
                proUntil: user.proUntil?.toISOString() ?? null,
                payments: payments.map((payment) => ({ ...payment, createdAt: payment.createdAt.toISOString() })),
            }}
        />
    );
}
