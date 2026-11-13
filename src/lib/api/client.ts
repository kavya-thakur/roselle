// The browser's way to call our /api routes. Every route answers { ok, data?, message?, errors? };
// a failed one throws an ApiError carrying the most useful message for the screen.

export class ApiError extends Error {}

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
        throw new ApiError(fieldError || json?.message || "Something went wrong. Please try again.");
    }

    return json.data as T;
}
