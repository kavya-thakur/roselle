import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// scrypt is built into Node and made for passwords (slow on purpose), so no bcrypt package
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, length: number) => Promise<Buffer>;

// Stored as "salt:hash", both hex
export async function hashPassword(password: string) {
    const salt = randomBytes(16);
    const hash = await scryptAsync(password, salt, 64);
    return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
    const [salt, hash] = passwordHash.split(":");
    if (!salt || !hash) return false;

    const attempt = await scryptAsync(password, Buffer.from(salt, "hex"), 64);
    // compares every byte whatever happens, so the time taken says nothing about the hash
    return timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}
