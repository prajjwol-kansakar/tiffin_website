import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

let pool;

/**
 * Returns the shared PostgreSQL pool, or null when DATABASE_URL is unset.
 * Callers can use their existing demo behavior when no database is configured.
 */
export function getPool() {
  if (!connectionString) {
    return null;
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return pool;
}