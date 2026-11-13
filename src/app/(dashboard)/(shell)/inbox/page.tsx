import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { prisma } from "@/lib/db/prisma";
import { InboxView } from "./InboxView";

export const metadata: Metadata = { title: "Inbox" };

// Messages from the "Work with me" form, newest first. Opening the inbox marks them read;
// the ones that were new still show as new this once.
export default async function InboxPage() {
    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const messages = await prisma.enquiry.findMany({
        where: { pageId: user.page.id },
        orderBy: { createdAt: "desc" },
        take: 300,
        select: { id: true, name: true, email: true, message: true, createdAt: true, readAt: true },
    });
    await prisma.enquiry.updateMany({ where: { pageId: user.page.id, readAt: null }, data: { readAt: new Date() } });

    return <InboxView messages={messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString(), unread: !message.readAt }))} />;
}
