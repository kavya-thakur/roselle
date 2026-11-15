import { defineConfig } from "prisma/config";

// Node reads .env itself (no dotenv); in production the host sets the variables, so no file is fine
try {
    process.loadEnvFile();
} catch {}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    // migrations need a direct connection; Neon gives a pooled one (DATABASE_URL) for the app and
    // a direct one for this (DATABASE_URL_UNPOOLED, as `neon env pull` names it; DIRECT_URL also
    // works). Locally the one address does both.
    datasource: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
    },
});
