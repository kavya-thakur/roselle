// How often one visitor may do something: at most `limit` times per `windowMs`.
// Returns true when this attempt is one too many. A "fixed window": the count starts
// over when the window ends. Simple, and plenty for stopping password guessing.
//
// ponytail: the counts live in this server's memory, so a restart clears them and several
// servers each count on their own; move them to Redis when running more than one.
const attempts = new Map<string, { count: number; resetAt: number }>();

export function tooManyAttempts(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || entry.resetAt < now) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count += 1;
    return entry.count > limit;
}

// Who's asking, as far as we can tell: the first address in X-Forwarded-For (set by the
// host's proxy when deployed), or "unknown" locally
export function visitorOf(headers: Headers) {
    return headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
}
