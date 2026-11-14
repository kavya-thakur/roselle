import { NextRequest, NextResponse } from "next/server";
import { sendReminders, sendWeeklyEmails, tidyUp } from "@/lib/reports/daily";

// Vercel calls this once a day (vercel.json) with "Authorization: Bearer <CRON_SECRET>".
// Morning reminders and a tidy of expired rows every day, the weekly email on Mondays. ?weekly=1 sends it on any day,
// for trying it out. Without CRON_SECRET set, nobody can run it.
export const maxDuration = 60;

export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ ok: false, message: "Not allowed" }, { status: 401 });
    }

    const now = new Date();
    const reminded = await sendReminders(now);
    const weekly = now.getUTCDay() === 1 || req.nextUrl.searchParams.get("weekly") === "1" ? await sendWeeklyEmails(now) : 0;

    const removed = await tidyUp(now);

    return NextResponse.json({ ok: true, data: { reminded, weekly, removed } });
}
