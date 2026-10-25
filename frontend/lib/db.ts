import postgres from "postgres";

type Database = ReturnType<typeof postgres>;

const globalForDatabase = globalThis as typeof globalThis & {
  tetoclockDatabase?: Database;
};

export function getDatabase(): Database {
  if (globalForDatabase.tetoclockDatabase) {
    return globalForDatabase.tetoclockDatabase;
  }

  const connectionString = process.env.TIMESCALE_SERVICE_URL;
  const ssl = process.env.PGSSLMODE?.toLowerCase() === "disable" ? false : "require";

  if (connectionString) {
    globalForDatabase.tetoclockDatabase = postgres(connectionString, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 10,
      prepare: false,
      ssl,
    });
    return globalForDatabase.tetoclockDatabase;
  }

  const { PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT } = process.env;
  if (!PGHOST || !PGUSER || !PGPASSWORD || !PGDATABASE) {
    throw new Error(
      "Tiger Cloud credentials are missing. Configure TIMESCALE_SERVICE_URL or PGHOST, PGUSER, PGPASSWORD, and PGDATABASE.",
    );
  }

  const port = PGPORT ? Number(PGPORT) : 5432;
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PGPORT must be a valid TCP port.");
  }

  globalForDatabase.tetoclockDatabase = postgres({
    host: PGHOST,
    port,
    username: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    ssl,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

  return globalForDatabase.tetoclockDatabase;
}
