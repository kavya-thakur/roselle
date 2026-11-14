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

// 25000, "USD" -> "$25,000". Whole amounts, the currency's own symbol, no decimals. Rupees are
// grouped the Indian way (₹1,00,000), as people there write them.
export const formatMoney = (amount: number, currency: string) =>
    new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

// "INR" -> "₹": the symbol on its own, for an amount box
export const currencySymbol = (currency: string) =>
    new Intl.NumberFormat("en", { style: "currency", currency }).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;

// A length of time in hours, as people say it: "40 minutes", "5 hours", "2 days"
export function formatHours(hours: number) {
    if (hours < 1) return plural(Math.max(1, Math.round(hours * 60)), "minute");
    if (hours < 48) return plural(Math.round(hours), "hour");
    return plural(Math.round(hours / 24), "day");
}

// a / b as a percentage, or null when it would be meaningless: nothing to divide by, or over 100%
// (one visitor can send several enquiries, and a blocked tracker can hide a visit)
export const shareOf = (part: number, whole: number) => (whole > 0 && part <= whole ? formatPercent(part / whole) : null);

// 1, "visitor" -> "1 visitor"; 3, "enquiry", "enquiries" -> "3 enquiries"
export const plural = (count: number, one: string, many = `${one}s`) => `${formatNumber(count)} ${count === 1 ? one : many}`;
