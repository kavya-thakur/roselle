import { z } from "zod";

// Lowercased so "Ada@x.com" and "ada@x.com" are one account, and sign in finds it either way
export const emailSchema = z
    .email("Invalid email")
    .max(254, "Must be at most 254 characters")
    .transform((email) => email.toLowerCase());

export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Must be at most 200 characters");

// Names that are already pages of the site itself (/login is the sign-in page)
const RESERVED_USERNAMES = ["login", "register", "logout", "editor", "analytics", "settings", "api", "go", "media", "pricing", "about", "help", "terms", "privacy", "admin", "forgot", "reset", "verify", "report", "inbox"];

// The address of a page: <our address>/<username>
export const usernameSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "At least 3 characters")
    .max(30, "At most 30 characters")
    .regex(/^[a-z0-9_.]+$/, "Only letters, numbers, dots and underscores")
    .regex(/^[a-z0-9].*[a-z0-9]$/, "Start and end with a letter or number")
    .refine((name) => !RESERVED_USERNAMES.includes(name), "That name is taken");
