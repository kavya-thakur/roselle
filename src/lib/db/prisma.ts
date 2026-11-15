import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
    // the generated client the kept one was made from
    prismaClass: typeof PrismaClient | undefined;
};

// DATABASE_URL is Neon's pooled address. On Vercel, attachDatabasePool lets the function close
// idle connections before it's suspended, so they don't pile up on Neon; elsewhere it does nothing.
function createPrismaClient() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    attachDatabasePool(pool);
    return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// next dev reloads modules on every change; one client is kept across reloads, or each reload
// would open a new connection pool. But after `prisma generate` (a migration added a column) the
// client's own code is new, and the kept one wouldn't know the new tables or columns: then it's
// closed and replaced, instead of the dev server needing a restart.
const kept = globalForPrisma.prisma && globalForPrisma.prismaClass === PrismaClient ? globalForPrisma.prisma : undefined;
if (!kept) void globalForPrisma.prisma?.$disconnect();

export const prisma = kept ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
    globalForPrisma.prismaClass = PrismaClient;
}
