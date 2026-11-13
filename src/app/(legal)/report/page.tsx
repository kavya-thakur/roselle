import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { SITE_HOST } from "@/lib/site";
import { ReportForm } from "./ReportForm";

export const metadata: Metadata = { title: "Report a page", robots: { index: false } };

// /report?page=<id>: the link at the bottom of every public page
export default async function ReportPage({ searchParams }: PageProps<"/report">) {
    const id = Number((await searchParams).page);
    const page = Number.isInteger(id) && id > 0 ? await prisma.page.findUnique({ where: { id }, select: { id: true, username: true } }) : null;
    if (!page) notFound();

    return (
        <>
            <h1 className="font-display text-5xl text-ink">Report a page</h1>
            <p className="mt-3 text-[16px] text-muted">
                Tell us what&apos;s wrong with <span className="font-semibold text-ink">{SITE_HOST}/{page.username}</span>. We read every report. The page&apos;s owner won&apos;t
                know it was you.
            </p>
            <ReportForm pageId={page.id} />
        </>
    );
}
