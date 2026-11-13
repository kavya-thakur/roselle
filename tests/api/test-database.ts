// The test database: the same server as DATABASE_URL, a database of its own (roselle_test),
// so tests never touch real data. TEST_DATABASE_URL overrides it.
export function testDatabaseUrl() {
    try {
        process.loadEnvFile();
    } catch {}
    if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

    const url = new URL(process.env.DATABASE_URL ?? "postgresql://localhost:5432/roselle");
    url.pathname = "/roselle_test";
    return url.toString();
}
