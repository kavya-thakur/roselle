import { createHash } from "node:crypto";
import { SITE_URL } from "@/lib/site";

// Uploaded photos live on Cloudinary's free plan (no card, about 25 GB a month of storage and
// traffic); the page keeps only their address. Two calls to its HTTP API, so no SDK.
// Without CLOUDINARY_URL (on your own computer, and in the tests) photos are kept in the
// database instead (api/media/route.ts), so nothing needs an account to run locally.

// CLOUDINARY_URL is the one line Cloudinary's dashboard gives: cloudinary://<key>:<secret>@<cloud>
export function cloudinary() {
    const raw = process.env.CLOUDINARY_URL;
    if (!raw) return null;
    const url = new URL(raw);
    return { key: url.username, secret: decodeURIComponent(url.password), cloud: url.hostname };
}

type Config = NonNullable<ReturnType<typeof cloudinary>>;

// Each person's photos in a folder of their own, named after the site too, so two copies of
// Roselle (a laptop and the live site) can share one Cloudinary account without mixing
export const folderOf = (userId: number) => `roselle/${new URL(SITE_URL).hostname}/u${userId}`;

// Cloudinary's signature: the parameters, sorted, as a=1&b=2, followed by the secret, sha1'd
export function signature(params: Record<string, string | number>, secret: string) {
    const query = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join("&");
    return createHash("sha1").update(query + secret).digest("hex");
}

export async function uploadImage(config: Config, file: File, userId: number) {
    const params = { folder: folderOf(userId), timestamp: Math.floor(Date.now() / 1000) };
    const form = new FormData();
    form.append("file", file);
    for (const [key, value] of Object.entries(params)) form.append(key, String(value));
    form.append("api_key", config.key);
    form.append("signature", signature(params, config.secret));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/image/upload`, { method: "POST", body: form });
    const json = await response.json().catch(() => null);
    if (!response.ok || typeof json?.secure_url !== "string") throw new Error(`Cloudinary answered ${response.status}: ${json?.error?.message ?? "no address"}`);
    return json.secure_url as string;
}

// Everything in one person's folder, for when they delete their account.
// ponytail: a photo replaced or removed from a page stays until then; sweep unused ones (compare
// the folder with the addresses in their pages) if storage nears the free allowance
// ponytail: up to 1000 photos per call, far more than a page holds; loop on `next_cursor` if not
export async function deleteImagesOf(userId: number) {
    const config = cloudinary();
    if (!config) return;
    const auth = Buffer.from(`${config.key}:${config.secret}`).toString("base64");
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloud}/resources/image/upload?prefix=${encodeURIComponent(`${folderOf(userId)}/`)}`, {
        method: "DELETE",
        headers: { authorization: `Basic ${auth}` },
    });
    if (!response.ok) throw new Error(`Cloudinary answered ${response.status} deleting ${folderOf(userId)}`);
}
