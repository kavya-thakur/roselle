// "just now", "5 minutes ago", "3 days ago", then the date itself
export function timeAgo(iso: string) {
    const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

// 1234 -> "1,234"
export const formatNumber = (value: number) => value.toLocaleString("en-US");

// A share of a whole, as a whole percentage: 0.4567 -> "46%"
export const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
