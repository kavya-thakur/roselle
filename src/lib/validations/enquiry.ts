import { z } from "zod";
import { emailSchema } from "./common";

// A message from a "Work with me" or Services block
export const enquirySchema = z.object({
    pageId: z.number().int().positive(),
    blockId: z.string().min(1).max(40),
    // which service, when it came from a Services block
    serviceId: z.string().max(40).optional(),
    name: z.string().trim().min(1, "Add your name").max(100, "Must be at most 100 characters"),
    email: emailSchema,
    message: z.string().trim().min(2, "Write a message").max(3000, "Must be at most 3000 characters"),
    // the date they'd like it (an <input type="date"> value); empty = not asked or no preference
    wantedOn: z.union([z.literal(""), z.iso.date("Pick a real date")]).default(""),
    // where the visitor came from, sent by the page like a page view is (see TrackView)
    referrer: z.string().max(2048).optional(),
    utmSource: z.string().max(200).optional(),
    // a field people never see: only spam robots fill it in (see ContactForm)
    website: z.string().max(200).default(""),
});

export const ENQUIRY_STATUSES = ["NEW", "REPLIED", "BOOKED", "PAID", "CLOSED"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

// Moving an enquiry along in the inbox, or setting what it's worth
export const enquiryUpdateSchema = z.object({
    status: z.enum(ENQUIRY_STATUSES).optional(),
    amount: z.number().int("Whole amounts only").min(0).max(100_000_000).nullable().optional(),
});

// Asking a booked client to pay: how much, and where (a payment page address or a UPI id)
export const paymentRequestSchema = z.object({
    amount: z.number().int("Whole amounts only").min(1, "Enter an amount").max(100_000_000),
    link: z.string().trim().min(3, "Add where they pay you").max(500),
    note: z.string().trim().max(500).default(""),
});

// A client's review, from the one-time link in their email
export const reviewSchema = z.object({
    token: z.string().min(1).max(200),
    name: z.string().trim().min(1, "Add your name").max(80, "Must be at most 80 characters"),
    rating: z.number().int().min(1, "Pick a rating").max(5),
    text: z.string().trim().min(5, "Say a little about the work").max(800, "Must be at most 800 characters"),
});

// The currencies bookings can be counted in. A short list on purpose: a long one is harder to pick from.
export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "NZD", "SGD", "AED", "JPY", "CHF", "SEK", "BRL", "MXN", "ZAR"] as const;
// The creator's business settings, from the inbox and settings: each one optional, so one
// control can save just its own
export const businessSettingsSchema = z.object({
    currency: z.enum(CURRENCIES).optional(),
    monthlyGoal: z.number().int().min(1).max(1_000_000_000).nullable().optional(),
    weeklyEmail: z.boolean().optional(),
});

export type EnquiryUpdate = z.infer<typeof enquiryUpdateSchema>;
