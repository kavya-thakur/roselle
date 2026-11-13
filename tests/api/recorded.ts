// What the stand-ins in setup.ts record. Kept in a file of its own with no imports: the stand-in
// for next/server loads it, so it must not load next/server back.
export const cookieJar = new Map<string, string>();
export const emails: { to: string; subject: string; text: string; replyTo?: { email: string; name?: string }; fromName?: string }[] = [];
export const pending: Promise<unknown>[] = [];
