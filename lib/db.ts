import { Pool } from "pg";

// History is OPTIONAL. With no DATABASE_URL the whole module no-ops and the app
// runs exactly as before. Set DATABASE_URL (Neon, Vercel Postgres, Supabase,
// any Postgres) to switch on score history. Works with any standard Postgres
// connection string.

const url = process.env.DATABASE_URL;

export function isDbEnabled(): boolean {
  return !!url;
}

// Cache the pool across warm serverless invocations.
let _pool: Pool | undefined = (globalThis as { __esfPool?: Pool }).__esfPool;

function getPool(): Pool {
  if (!url) throw new Error("DATABASE_URL not set");
  if (!_pool) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    _pool = new Pool({
      connectionString: url,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
    (globalThis as { __esfPool?: Pool }).__esfPool = _pool;
  }
  return _pool;
}

let _schemaReady = false;
export async function ensureSchema(): Promise<void> {
  if (!isDbEnabled() || _schemaReady) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS score_history (
      id BIGSERIAL PRIMARY KEY,
      ticker TEXT NOT NULL,
      composite REAL NOT NULL,
      band TEXT NOT NULL,
      scored_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_sh_ticker_time ON score_history (ticker, scored_at);`
  );
  _schemaReady = true;
}

export interface HistoryPoint {
  composite: number;
  band: string;
  scoredAt: string; // ISO
}

// Bulk-insert a batch of scores recorded "now".
export async function recordScores(
  rows: { ticker: string; composite: number; band: string }[]
): Promise<number> {
  if (!isDbEnabled() || rows.length === 0) return 0;
  await ensureSchema();
  const pool = getPool();

  const values: (string | number)[] = [];
  const placeholders = rows
    .map((r, i) => {
      const b = i * 3;
      values.push(r.ticker.toUpperCase(), r.composite, r.band);
      return `($${b + 1}, $${b + 2}, $${b + 3})`;
    })
    .join(",");

  await pool.query(
    `INSERT INTO score_history (ticker, composite, band) VALUES ${placeholders}`,
    values
  );
  return rows.length;
}

// Oldest → newest, capped, for charting.
export async function getHistory(ticker: string, limit = 120): Promise<HistoryPoint[]> {
  if (!isDbEnabled()) return [];
  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT composite, band, scored_at
       FROM score_history
      WHERE ticker = $1
      ORDER BY scored_at DESC
      LIMIT $2`,
    [ticker.toUpperCase(), limit]
  );
  return rows
    .map((r: { composite: number; band: string; scored_at: string }) => ({
      composite: Number(r.composite),
      band: r.band,
      scoredAt: new Date(r.scored_at).toISOString(),
    }))
    .reverse();
}
