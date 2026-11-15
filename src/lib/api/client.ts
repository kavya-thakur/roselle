// The browser's way to call our /api routes. Every route answers { ok, data?, message?, errors? };
// a failed one throws an ApiError carrying the most useful message for the screen.

export class ApiError extends Error {}

// When the answer isn't ours (the host refused it before our code ran, so there's no message in
// it), say what the status means in words people can act on
const STATUS_MESSAGES: Record<number, string> = {
    401: "You've been signed out. Sign in again and retry.",
    413: "That's too big to upload. Photos can be up to 4 MB.",
    429: "That's a lot of requests at once. Wait a minute and try again.",
    502: "The server didn't answer. Please try again in a moment.",
    503: "The server is busy. Please try again in a moment.",
    504: "That took too long. Check your connection and try again.",
};

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}) {
    let response: Response;
    try {
        response = await fetch(`/api${path}`, {
            method: options.method ?? "GET",
            headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
            body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
        });
    } catch {
        // no response at all: the server is down or the network dropped
        throw new ApiError("Can't reach the server. Check your connection and try again.");
    }

    const json = await response.json().catch(() => null);

    if (!response.ok || !json?.ok) {
        // a field error first ("Invalid email"), then the general one ("That name is taken")
        const fieldError = json?.errors && Object.values<string[]>(json.errors).flat()[0];
        throw new ApiError(fieldError || json?.message || STATUS_MESSAGES[response.status] || "Something went wrong on our side. Please try again in a moment.");
    }

    return json.data as T;
}
