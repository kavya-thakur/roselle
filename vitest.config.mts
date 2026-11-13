import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = { "@": path.resolve(import.meta.dirname, "./src") };

// Two kinds of test:
// - unit: the page rules and calculations, pure functions, no database (npm run test:unit)
// - api: the real route handlers against a real Postgres test database (roselle_test), with only
//   the outside world replaced: emails are captured, the cookie lives in memory (tests/api/setup.ts).
//   One file at a time, because they share that database.
export default defineConfig({
    test: {
        projects: [
            { resolve: { alias }, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } },
            {
                resolve: { alias },
                test: {
                    name: "api",
                    include: ["tests/api/**/*.test.ts"],
                    environment: "node",
                    globalSetup: ["tests/api/global-setup.ts"],
                    setupFiles: ["tests/api/setup.ts"],
                    fileParallelism: false,
                },
            },
        ],
    },
});
