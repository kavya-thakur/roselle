import { formatHours, formatMoney, formatPercent, plural, shareOf } from "@/lib/utils/format";

export interface WeeklyNumbers {
    name: string;
    currency: string;
    visitors: number;
    enquiries: number;
    booked: number;
    bookedValue: number;
    // the place that brought the most enquiries (or visitors, when there were no enquiries)
    topSource: string | null;
    // the service with the most enquiries, and how many
    topService: { service: string; enquiries: number } | null;
    replyHours: number | null;
    awaitingPayment: number;
    openEnquiries: number;
    month: { booked: number; goal: number | null };
}

// Was there anything worth an email? A quiet week gets none, so the email always has news.
export const hasNews = (week: WeeklyNumbers) => week.visitors > 0 || week.enquiries > 0 || week.openEnquiries > 0;

// The Monday email: last week in a few lines, then what needs doing. Plain text, read in a minute.
export function weeklyEmailText(week: WeeklyNumbers, links: { analytics: string; inbox: string; settings: string }) {
    const money = (amount: number) => formatMoney(amount, week.currency);
    const lines = [
        `Hi ${week.name},`,
        "",
        "Here's how your page did over the last 7 days:",
        "",
        `  ${plural(week.visitors, "visitor")}`,
        `  ${plural(week.enquiries, "enquiry", "enquiries")}${week.enquiries && shareOf(week.enquiries, week.visitors) ? ` (${shareOf(week.enquiries, week.visitors)} of visitors)` : ""}`,
        `  ${week.booked} booked${week.booked ? `, worth ${money(week.bookedValue)}` : ""}`,
    ];

    const highlights = [
        week.topSource && `Most of your interest came from ${week.topSource}.`,
        week.topService && `${week.topService.service} was asked about most (${plural(week.topService.enquiries, "time")}).`,
        week.replyHours !== null && `You replied in ${formatHours(week.replyHours)} on average.${week.replyHours > 24 ? " Replying within a day wins noticeably more work." : ""}`,
    ].filter((line): line is string => !!line);
    if (highlights.length) lines.push("", ...highlights);

    if (week.month.goal) {
        lines.push("", `This month: ${money(week.month.booked)} of your ${money(week.month.goal)} goal (${formatPercent(Math.min(week.month.booked / week.month.goal, 1))}).`);
    } else if (week.month.booked) {
        lines.push("", `Booked so far this month: ${money(week.month.booked)}.`);
    }

    const todo = [
        week.openEnquiries && `${plural(week.openEnquiries, "enquiry is", "enquiries are")} still open.`,
        week.awaitingPayment && `${money(week.awaitingPayment)} is booked but not paid yet.`,
    ].filter((line): line is string => !!line);
    if (todo.length) lines.push("", "To do:", ...todo.map((line) => `  - ${line}`), `Your inbox: ${links.inbox}`);

    lines.push("", `All your numbers: ${links.analytics}`, "", `Don't want this email? Turn it off in Settings: ${links.settings}`);
    return lines.join("\n");
}
