import { execSync } from "node:child_process";
import { Client } from "pg";
import { testDatabaseUrl } from "./test-database";

// Once per run: make sure the test database exists and has every migration, using the same
// migrations production does (so the tests also prove they apply cleanly).
export default async function setup() {
    const url = new URL(testDatabaseUrl());
    const name = url.pathname.slice(1);
    if (!name.endsWith("_test")) throw new Error(`Refusing to run API tests against "${name}": the test database's name must end in _test`);

    const admin = new URL(url);
    admin.pathname = "/postgres";
    const client = new Client({ connectionString: admin.toString() });
    await client.connect();
    const { rowCount } = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [name]);
    if (!rowCount) await client.query(`CREATE DATABASE "${name}"`);
    await client.end();

    execSync("npx prisma migrate deploy", { env: { ...process.env, DATABASE_URL: url.toString(), DIRECT_URL: "" }, stdio: "pipe" });
}
