import { Pool } from "pg";

let pool: Pool | null = null;

export function getDb(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
      // Serverless-friendly settings: single connection, short timeouts
      max: 1,
      connectionTimeoutMillis: 8_000,
      idleTimeoutMillis: 5_000,
    });
    pool.on("error", (err) => {
      console.error("[DB] pool error — resetting:", err.message);
      pool = null;
    });
  }
  return pool;
}

/**
 * Run a single query and release the client immediately.
 * Preferred in Vercel serverless to avoid keeping connections open.
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<import("pg").QueryResult<T>> {
  const db = getDb();
  const client = await db.connect();
  try {
    return await client.query<T>(sql, params);
  } finally {
    client.release(true); // destroy connection after use (serverless-safe)
  }
}
