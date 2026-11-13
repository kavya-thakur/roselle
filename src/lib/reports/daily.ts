import { prisma } from "@/lib/db/prisma";
import { pageStats } from "@/lib/analytics/stats";
import { getPublishedPage } from "@/lib/pages/publish";
import { summarise } from "@/lib/bookings";
import { sendEmail } from "@/lib/email/send";
import { SITE_URL } from "@/lib/site";
import { plural } from "@/lib/utils/format";
import { hasNews, weeklyEmailText } from "./weekly";

const DAY = 24 * 60 * 60 * 1000;

// The morning nudge: enquiries still New after a day, one email per creator listing them.
// Each enquiry is mentioned once (remindedAt), so nobody is nagged about the same person daily.
export async function sendReminders(now = new Date()) {
    const waiting = await prisma.enquiry.findMany({
        where: { status: "NEW", remindedAt: null, createdAt: { lt: new Date(now.getTime() - DAY) }, page: { suspendedAt: null } },
        orderBy: { createdAt: "asc" },
        select: { id: true, pageId: true, name: true, service: true, createdAt: true, page: { select: { user: { select: { email: true } } } } },
    });

    const byPage = new Map<number, typeof waiting>();
    for (const enquiry of waiting) byPage.set(enquiry.pageId, [...(byPage.get(enquiry.pageId) ?? []), enquiry]);

    for (const enquiries of byPage.values()) {
        const count = enquiries.length;
        const list = enquiries.map((e) => {
            const days = Math.floor((now.getTime() - e.createdAt.getTime()) / DAY);
            return `  - ${e.name}${e.service ? ` (${e.service})` : ""}, waiting ${plural(days, "day")}`;
        });
        await sendEmail({
            to: enquiries[0].page.user.email,
            subject: count === 1 ? `${enquiries[0].name} is waiting to hear from you` : `${count} people are waiting to hear from you`,
            text: [`${count === 1 ? "Someone asked" : "People asked"} to work with you and ${count === 1 ? "hasn't" : "haven't"} heard back yet:`, "", ...list, "", "The sooner you reply, the more likely they book.", `Reply from your inbox: ${SITE_URL}/inbox`].join("\n"),
        });
        await prisma.enquiry.updateMany({ where: { id: { in: enquiries.map((e) => e.id) } }, data: { remindedAt: now } });
    }

    return byPage.size;
}

// The service worth naming in the email: the most asked about, if it really leads (asked about
// at least twice, and more than the next one). A tie at one enquiry each says nothing.
function standsOut(services: { service: string; enquiries: number }[]) {
    const [first, second] = services;
    return first && first.enquiries >= 2 && first.enquiries > (second?.enquiries ?? 0) ? { service: first.service, enquiries: first.enquiries } : null;
}

// The Monday email, to every creator who hasn't turned it off and whose page had something
// happen. One creator at a time: a failure for one doesn't stop the rest.
// ponytail: sequential, inside one daily run; fine for hundreds of creators, use a queue past that
// (and Brevo's free plan sends 300 emails a day)
export async function sendWeeklyEmails(now = new Date()) {
    const users = await prisma.user.findMany({
        where: { weeklyEmail: true, page: { publishedAt: { not: null }, suspendedAt: null } },
        select: { email: true, currency: true, monthlyGoal: true, page: { select: { id: true, username: true } } },
    });

    let sent = 0;
    for (const user of users) {
        try {
            const page = user.page!;
            const [published, stats, won, open] = await Promise.all([
                getPublishedPage(page.username),
                pageStats(page.id, 7),
                prisma.enquiry.findMany({ where: { pageId: page.id, status: { in: ["BOOKED", "PAID"] } }, select: { status: true, amount: true, bookedAt: true } }),
                prisma.enquiry.count({ where: { pageId: page.id, status: { in: ["NEW", "REPLIED"] } } }),
            ]);
            const money = summarise(won.map((e) => ({ ...e, bookedAt: e.bookedAt?.toISOString() ?? null })), now);
            const topSource = [...stats.sources].sort((a, b) => b.enquiries - a.enquiries || b.count - a.count)[0]?.label ?? null;

            const week = {
                name: published?.doc.profile.name || page.username,
                currency: user.currency,
                visitors: stats.current.visitors,
                enquiries: stats.current.enquiries,
                booked: stats.current.booked,
                bookedValue: stats.current.bookedValue,
                topSource,
                topService: standsOut(stats.services),
                replyHours: stats.replyHours,
                awaitingPayment: money.awaitingPayment,
                openEnquiries: open,
                month: { booked: money.bookedThisMonth, goal: user.monthlyGoal },
            };
            if (!hasNews(week)) continue;

            await sendEmail({
                to: user.email,
                subject: `Your week: ${plural(week.visitors, "visitor")}, ${plural(week.enquiries, "enquiry", "enquiries")}, ${week.booked} booked`,
                text: weeklyEmailText(week, { analytics: `${SITE_URL}/analytics`, inbox: `${SITE_URL}/inbox`, settings: `${SITE_URL}/settings` }),
            });
            sent += 1;
        } catch (error) {
            console.error(`Weekly email for ${user.page?.username} failed:`, error);
        }
    }
    return sent;
}
