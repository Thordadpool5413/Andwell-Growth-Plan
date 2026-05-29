import pg from "pg";

const { Pool } = pg;

let _pool = null;

export function getPool() {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    _pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err.message);
    });
  }
  return _pool;
}

export async function query(sql, params) {
  const pool = getPool();
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error("[DB] Query error:", err.message, "\nSQL:", sql.slice(0, 200));
    throw err;
  }
}

export async function dbReady() {
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
