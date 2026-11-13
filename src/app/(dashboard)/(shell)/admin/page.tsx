import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { REPORT_REASONS, type ReportReason } from "@/lib/validations/report";
import { AdminView } from "./AdminView";

export const metadata: Metadata = { title: "Admin" };

// Reports waiting for a decision, and the pages that are taken down. Admins only; anyone else
// gets the same 404 as for a page that doesn't exist.
export default async function AdminPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (!isAdmin(user.email)) notFound();

    const [reports, suspended] = await Promise.all([
        prisma.report.findMany({
            where: { resolvedAt: null },
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, reason: true, details: true, email: true, createdAt: true, page: { select: { username: true, suspendedAt: true } } },
        }),
        prisma.page.findMany({
            where: { suspendedAt: { not: null } },
            orderBy: { suspendedAt: "desc" },
            take: 200,
            select: { username: true, suspendedAt: true, suspendedReason: true },
        }),
    ]);

    return (
        <AdminView
            reports={reports.map((report) => ({
                id: report.id,
                username: report.page.username,
                pageDown: !!report.page.suspendedAt,
                reason: REPORT_REASONS[report.reason as ReportReason] ?? report.reason,
                details: report.details,
                email: report.email,
                createdAt: report.createdAt.toISOString(),
            }))}
            suspended={suspended.map((page) => ({ username: page.username, reason: page.suspendedReason ?? "", suspendedAt: page.suspendedAt!.toISOString() }))}
        />
    );
}
