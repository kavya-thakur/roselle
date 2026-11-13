import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/send";
import { hashToken } from "./session";
import type { TokenKind } from "@/generated/prisma/client";

const LIFETIME_HOURS: Record<TokenKind, number> = { VERIFY_EMAIL: 72, RESET_PASSWORD: 1 };

// A fresh one-time token for a link in an email. Older ones of the same kind stop working,
// so only the latest email's link does.
async function createToken(userId: number, kind: TokenKind) {
    const token = randomBytes(32).toString("base64url");
    await prisma.$transaction([
        prisma.token.deleteMany({ where: { userId, kind } }),
        prisma.token.create({ data: { id: hashToken(token), userId, kind, expiresAt: new Date(Date.now() + LIFETIME_HOURS[kind] * 60 * 60 * 1000) } }),
    ]);
    return token;
}

// The user a token belongs to, or null when it's wrong, used or expired. It's deleted either way.
export async function redeemToken(token: string, kind: TokenKind) {
    const row = await prisma.token.findUnique({ where: { id: hashToken(token) } }).catch(() => null);
    if (!row || row.kind !== kind) return null;

    await prisma.token.delete({ where: { id: row.id } }).catch(() => {});
    return row.expiresAt > new Date() ? row.userId : null;
}

// The address emails link to: APP_URL in production, else wherever this request came in
export const appUrl = (origin: string) => (process.env.APP_URL || origin).replace(/\/$/, "");

export async function sendVerifyEmail(user: { id: number; email: string }, origin: string) {
    const token = await createToken(user.id, "VERIFY_EMAIL");
    await sendEmail({
        to: user.email,
        subject: "Confirm your email for Roselle",
        text: `Welcome to Roselle!\n\nConfirm this is your email address:\n${appUrl(origin)}/verify?token=${token}\n\nThe link works for 3 days. If you didn't sign up, ignore this email.`,
    });
}

export async function sendResetEmail(user: { id: number; email: string }, origin: string) {
    const token = await createToken(user.id, "RESET_PASSWORD");
    await sendEmail({
        to: user.email,
        subject: "Reset your Roselle password",
        text: `Someone (hopefully you) asked to reset the password for your Roselle account.\n\nChoose a new one here:\n${appUrl(origin)}/reset?token=${token}\n\nThe link works for one hour. If it wasn't you, ignore this email: your password stays the same.`,
    });
}
