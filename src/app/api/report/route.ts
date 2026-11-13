import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { handleRouteError, parseBody } from "@/lib/api/http";
import { tooManyAttempts, visitorOf } from "@/lib/api/rateLimit";
import { adminEmails } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email/send";
import { SITE_URL } from "@/lib/site";
import { REPORT_REASONS, reportSchema } from "@/lib/validations/report";

// A visitor reporting a page. Saved for the admins at /admin, who also get an email.
export async function POST(req: NextRequest) {
    try {
        const parsed = await parseBody(req, reportSchema);
        if (!parsed.success) return parsed.response;

        // enough for real reports, too few to bury a page (or the admins) in them
        if (tooManyAttempts(`report:${visitorOf(req.headers)}`, 5, 60 * 60 * 1000)) {
            return NextResponse.json({ ok: false, message: "You've sent a few reports already. Please try again in an hour." }, { status: 429 });
        }

        const { pageId, reason, details, email } = parsed.data;
        const page = await prisma.page.findUnique({ where: { id: pageId }, select: { username: true } });
        if (!page) return NextResponse.json({ ok: false, message: "That page doesn't exist any more" }, { status: 404 });

        await prisma.report.create({ data: { pageId, reason, details, email: email || null } });

        const admins = adminEmails();
        after(() =>
            Promise.all(
                admins.map((to) =>
                    sendEmail({
                        to,
                        subject: `Report: /${page.username} (${REPORT_REASONS[reason]})`,
                        text: `${SITE_URL}/${page.username} was reported for: ${REPORT_REASONS[reason]}\n\n${details || "(no details)"}\n\nFrom: ${email || "anonymous"}\n\nReview it: ${SITE_URL}/admin`,
                    }),
                ),
            ).catch((error) => console.error("Report email error:", error)),
        );

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        return handleRouteError(error, "Report");
    }
}
