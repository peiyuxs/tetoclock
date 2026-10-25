import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import postgres from "postgres";

const require = createRequire(import.meta.url);
require("@next/env").loadEnvConfig(process.cwd());

function databaseOptions() {
  const ssl = process.env.PGSSLMODE?.toLowerCase() === "disable" ? false : "require";
  if (process.env.TIMESCALE_SERVICE_URL) {
    return [process.env.TIMESCALE_SERVICE_URL, { ssl, prepare: false }];
  }

  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    throw new Error(
      "Configure TIMESCALE_SERVICE_URL or PGHOST, PGUSER, PGPASSWORD, and PGDATABASE in frontend/.env.local.",
    );
  }

  const port = PGPORT ? Number(PGPORT) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PGPORT must be a valid TCP port.");
  }

  return [
    { host: PGHOST, port, username: PGUSER, password: PGPASSWORD, database: PGDATABASE },
    { ssl, prepare: false },
  ];
}

const database = postgres(...databaseOptions());
const migrationPath = path.join(process.cwd(), "migrations", "0001_initial.sql");
const migration = await readFile(migrationPath, "utf8");
const statements = migration
  .split(/;\s*(?:\r?\n|$)/)
  .map((statement) => statement.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await database.unsafe(statement);
  }
  console.log(`Applied ${statements.length} TETO'Clock schema statements.`);
} finally {
  await database.end();
}
