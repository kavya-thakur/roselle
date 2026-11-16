import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { isAdmin } from "@/lib/auth/admin";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { sendEmail } from "@/lib/email/send";
import { refreshPublicPage } from "@/lib/pages/publish";
import { SITE_URL } from "@/lib/site";
import { adminActionSchema } from "@/lib/validations/report";
import { planNow } from "@/lib/plans";

// Taking a page down, putting it back, dismissing a report, or giving and ending Pro by hand.
// Admins only (ADMIN_EMAILS).
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) throw new Error("UNAUTHORIZED");
        // the same answer as for a missing page: nothing here for non-admins
        if (!isAdmin(user.email)) return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });

        const parsed = await parseBody(req, adminActionSchema);
        if (!parsed.success) return parsed.response;
        const body = parsed.data;

        if (body.action === "grantPro" || body.action === "endPro") {
            const account = await prisma.user.findUnique({ where: { id: body.userId }, select: { plan: true, proUntil: true, page: { select: { username: true } } } });
            if (!account) return NextResponse.json({ ok: false, message: "That account is gone" }, { status: 404 });

            const running = planNow(account.plan, account.proUntil) === "PRO" ? account.proUntil : null;
            const from = running && running > new Date() ? running : new Date();
            await prisma.user.update({
                where: { id: body.userId },
                data:
                    body.action === "endPro"
                        ? { plan: "FREE", proUntil: null }
                        : // a fresh end date also means a fresh set of "ends soon" emails
                          { plan: "PRO", proUntil: body.days === null ? null : new Date(from.getTime() + body.days * 24 * 60 * 60 * 1000), billingReminderKey: null },
            });
            // the badge comes or goes on their page straight away
            if (account.page) refreshPublicPage(account.page.username);
            return NextResponse.json({ ok: true });
        }

        if (body.action === "dismiss") {
            await prisma.report.update({ where: { id: body.reportId }, data: { resolvedAt: new Date() } });
            return NextResponse.json({ ok: true });
        }

        const page = await prisma.page.findUnique({ where: { username: body.username }, select: { id: true, username: true, user: { select: { email: true } } } });
        if (!page) return NextResponse.json({ ok: false, message: `There's no page called ${body.username}` }, { status: 404 });

        if (body.action === "suspend") {
            // taking it down settles every open report about it
            await prisma.$transaction([
                prisma.page.update({ where: { id: page.id }, data: { suspendedAt: new Date(), suspendedReason: body.reason } }),
                prisma.report.updateMany({ where: { pageId: page.id, resolvedAt: null }, data: { resolvedAt: new Date() } }),
            ]);
            after(() =>
                sendEmail({
                    to: page.user.email,
                    subject: "Your Roselle page has been taken down",
                    text: `Your page ${SITE_URL}/${page.username} has been taken down because it breaks our rules:\n\n${body.reason}\n\nYou can still sign in, but the page can't be seen or published. If you think this is a mistake, reply to this email.\n\nOur rules: ${SITE_URL}/terms`,
                }).catch((error) => console.error("Takedown email error:", error)),
            );
        } else {
            await prisma.page.update({ where: { id: page.id }, data: { suspendedAt: null, suspendedReason: null } });
        }

        refreshPublicPage(page.username);
        return NextResponse.json({ ok: true });
    } catch (error) {
        return handleRouteError(error, "Admin");
    }
}
