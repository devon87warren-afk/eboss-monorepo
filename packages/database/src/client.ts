/**
 * Cloud SQL Database Client
 *
 * Provides a connection pool to Cloud SQL PostgreSQL via the Cloud SQL Auth Proxy
 * sidecar (localhost:5432). Includes a `withContext` helper that sets session
 * variables for Row-Level Security before executing queries.
 *
 * Environment Variables:
 *   DB_HOST     - Database host (default: 127.0.0.1, via Cloud SQL Proxy)
 *   DB_PORT     - Database port (default: 5432)
 *   DB_NAME     - Database name (default: eboss)
 *   DB_USER     - Database user (from GCP Secret Manager)
 *   DB_PASSWORD  - Database password (from GCP Secret Manager)
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// ---------------------------------------------------------------------------
// Pool Configuration
// ---------------------------------------------------------------------------

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'eboss',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Log unexpected errors on idle clients so they don't crash the process.
pool.on('error', (err) => {
  console.error('[database] Unexpected error on idle client', err);
});

// ---------------------------------------------------------------------------
// Session Context
// ---------------------------------------------------------------------------

/**
 * Parameters required to set RLS session context.
 * Must be provided on every request so that RLS policies can enforce
 * territory-scoped access.
 */
export interface SessionContext {
  /** Current authenticated user UUID */
  userId: string;
  /** Territory ID the user belongs to */
  territoryId: string;
  /** User role for role-based policy checks */
  userRole: string;
}

/**
 * Execute a callback within a database session that has RLS context variables
 * set. The client is automatically released back to the pool when the callback
 * completes (or throws).
 *
 * @example
 * ```ts
 * const rows = await withContext(
 *   { userId: 'abc', territoryId: 'west-1', userRole: 'technician' },
 *   async (client) => {
 *     const res = await client.query('SELECT * FROM units');
 *     return res.rows;
 *   },
 * );
 * ```
 */
export async function withContext<T>(
  ctx: SessionContext,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    // Set session variables that RLS policies read via current_setting().
    // Using set_config with is_local=true so they are scoped to the current
    // transaction and automatically cleared when the client is released.
    await client.query('BEGIN');
    await client.query(
      `SELECT set_config('app.current_user_id', $1, true),
              set_config('app.current_territory_id', $2, true),
              set_config('app.current_user_role', $3, true)`,
      [ctx.userId, ctx.territoryId, ctx.userRole],
    );

    const result = await fn(client);

    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ROLLBACK failed (e.g. connection lost); ignore so original error propagates
    }
    throw err;
  } finally {
    client.release();
  }
}

// ---------------------------------------------------------------------------
// Convenience Helpers
// ---------------------------------------------------------------------------

/**
 * Run a single query with RLS context. Shorthand for common read operations.
 */
export async function queryWithContext<T extends QueryResultRow = QueryResultRow>(
  ctx: SessionContext,
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return withContext(ctx, (client) => client.query<T>(text, values));
}

/**
 * Run a query without RLS context (e.g. health checks, migrations).
 * Use sparingly — most application queries should go through `withContext`.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, values);
}

/**
 * Gracefully shut down the connection pool.
 * Call this during process shutdown (e.g. SIGTERM handler).
 */
export async function disconnect(): Promise<void> {
  await pool.end();
}

export { pool };
