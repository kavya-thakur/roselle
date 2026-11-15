import { tooManyAttempts } from "@/lib/api/rateLimit";

// Brevo's free plan sends 300 emails a day across the whole site, then stops until tomorrow.
// These keep any one page or person from using that up, so the emails that matter most
// (confirming an address, resetting a password) always have room.

const DAY = 24 * 60 * 60 * 1000;

// New-enquiry emails to one creator in 24 hours. Enquiries past this are still saved to the
// inbox, and the morning reminder lists them, so nothing is lost; it only stops a flood of
// spam from emailing (and using up the day's emails) one message at a time.
export const ENQUIRY_EMAILS_A_DAY = 20;

// Payment and review requests Roselle emails for one creator in 24 hours. Past this they send
// it themselves (WhatsApp or their own email), which has no limit.
// ponytail: counted in this server's memory; a shared store (Upstash) if it ever matters
export const SENT_FOR_YOU_A_DAY = 20;
export const sentTooManyFor = (userId: number) => tooManyAttempts(`sent-for:${userId}`, SENT_FOR_YOU_A_DAY, DAY);

export const SENT_FOR_YOU_LIMIT_MESSAGE = `Roselle has sent ${SENT_FOR_YOU_A_DAY} emails for you today. Send this one from your WhatsApp or your own email instead.`;
