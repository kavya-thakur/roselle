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
    // migrations need a direct connection; hosts like Neon give a pooled one (DATABASE_URL) for
    // the app and a direct one for this. Locally the one address does both.
    datasource: {
        url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
});
