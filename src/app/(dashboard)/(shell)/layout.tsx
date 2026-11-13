import { redirect } from "next/navigation";

import { Logo } from "@/components/Logo";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db/prisma";
import { setupChecklist } from "@/lib/pages/checklist";
import { pageSchema } from "@/lib/validations/page";
import { SidebarNav } from "./SidebarNav";
import { SetupChecklist } from "./SetupChecklist";
import { LogoutButton } from "../LogoutButton";
import { CopyLink } from "../CopyLink";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
    // ../layout.tsx has already checked the session; this just reads who it is
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const [page, unread] = await Promise.all([
        prisma.page.findUniqueOrThrow({ where: { id: user.page.id }, select: { draft: true, publishedAt: true } }),
        prisma.enquiry.count({ where: { pageId: user.page.id, readAt: null } }),
    ]);
    const draft = pageSchema.safeParse(page.draft);
    const checklist = draft.success ? setupChecklist(draft.data, !!page.publishedAt) : null;
    const name = draft.success && draft.data.profile.name ? draft.data.profile.name : user.page.username;

    return (
        <div className="flex min-h-0 flex-1 flex-col bg-cream md:flex-row">
            {/* ---------- the sidebar (a top bar on phones) ---------- */}
            <aside className="flex shrink-0 flex-col gap-1 px-3 py-3 md:w-64 md:py-5">
                <div className="flex items-center justify-between px-2 md:mb-6">
                    <Logo />
                    <LogoutButton />
                </div>

                <SidebarNav admin={isAdmin(user.email)} unread={unread} />

                {/* the checklist disappears once everything on it is done */}
                {checklist && checklist.done < checklist.steps.length && <SetupChecklist steps={checklist.steps} done={checklist.done} />}

                <div className="mt-auto hidden items-center gap-2.5 rounded-2xl px-2 py-2 md:flex">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-forest font-display text-sm text-white">{name[0]?.toUpperCase()}</span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                </div>
            </aside>

            {/* ---------- the page, on a big rounded sheet ---------- */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-canvas md:my-2 md:mr-2 md:rounded-[2rem] md:shadow-soft">
                <header className="flex h-16 shrink-0 items-center justify-end gap-2 px-4 sm:px-6">
                    <CopyLink username={user.page.username} />
                </header>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </div>
        </div>
    );
}
