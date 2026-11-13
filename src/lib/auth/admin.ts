// Who can see /admin and take pages down: the addresses in ADMIN_EMAILS, comma separated.
// ponytail: a list in the environment, no roles in the database; add a role column if there are ever many admins.
export const adminEmails = () =>
    (process.env.ADMIN_EMAILS ?? "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean);

export const isAdmin = (email: string) => adminEmails().includes(email.toLowerCase());
