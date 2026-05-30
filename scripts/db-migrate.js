#!/usr/bin/env node
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;

const pool = DATABASE_URL
  ? new pg.Pool({ connectionString: DATABASE_URL })
  : null;

async function col(client, table, column, def) {
  try {
    await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${def};`);
  } catch (err) {
    console.error(`[migrate] ALTER ${table}.${column}:`, err.message);
    throw err;
  }
}

export async function runMigrations() {
  if (!DATABASE_URL) {
    console.error("[migrate] DATABASE_URL not set — skipping migrations.");
    return;
  }
  return migrate();
}

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("[migrate] Running CMS schema migrations…");

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_datasets (
        id SERIAL PRIMARY KEY,
        cms_dataset_identifier TEXT UNIQUE NOT NULL,
        title TEXT,
        topic TEXT,
        description TEXT,
        api_reference TEXT,
        last_modified_date TIMESTAMPTZ,
        last_discovered_at TIMESTAMPTZ DEFAULT NOW(),
        active_status BOOLEAN DEFAULT TRUE,
        last_synced_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "cms_datasets", "cms_dataset_identifier", "TEXT");
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS cms_datasets_identifier_idx ON cms_datasets (cms_dataset_identifier);`);
    await col(client, "cms_datasets", "api_reference", "TEXT");
    await col(client, "cms_datasets", "last_modified_date", "TIMESTAMPTZ");
    await col(client, "cms_datasets", "last_discovered_at", "TIMESTAMPTZ DEFAULT NOW()");
    await col(client, "cms_datasets", "active_status", "BOOLEAN DEFAULT TRUE");
    await col(client, "cms_datasets", "last_synced_at", "TIMESTAMPTZ");
    await col(client, "cms_datasets", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_provider_records (
        id SERIAL PRIMARY KEY,
        cms_dataset_identifier TEXT,
        provider_type TEXT NOT NULL DEFAULT 'unknown',
        provider_name_raw TEXT,
        provider_name_normalized TEXT,
        cms_certification_number TEXT,
        npi TEXT,
        address TEXT,
        city TEXT,
        state TEXT DEFAULT 'ME',
        zip_code TEXT,
        phone TEXT,
        county TEXT,
        source_row_json JSONB,
        source_evidence_text TEXT,
        last_synced_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "cms_provider_records", "cms_dataset_identifier", "TEXT");
    await col(client, "cms_provider_records", "provider_name_raw", "TEXT");
    await col(client, "cms_provider_records", "provider_name_normalized", "TEXT");
    await col(client, "cms_provider_records", "npi", "TEXT");
    await col(client, "cms_provider_records", "source_row_json", "JSONB");
    await col(client, "cms_provider_records", "source_evidence_text", "TEXT");
    await col(client, "cms_provider_records", "last_synced_at", "TIMESTAMPTZ");
    await col(client, "cms_provider_records", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");
    await col(client, "cms_provider_records", "certification_date", "TEXT");
    await col(client, "cms_provider_records", "quality_star_rating", "FLOAT");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cms_provider_records_norm_idx
      ON cms_provider_records (provider_name_normalized, state, provider_type)
      WHERE provider_name_normalized IS NOT NULL;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_seeds (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        aliases TEXT[],
        estimated_beneficiaries INTEGER,
        quality_star_rating FLOAT,
        parent_company TEXT,
        provider_type TEXT,
        website_url TEXT,
        known_counties TEXT[],
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "competitor_seeds", "aliases", "TEXT[]");
    await col(client, "competitor_seeds", "website_url", "TEXT");
    await col(client, "competitor_seeds", "estimated_beneficiaries", "INTEGER");
    await col(client, "competitor_seeds", "quality_star_rating", "FLOAT");
    await col(client, "competitor_seeds", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_cms_matches (
        id SERIAL PRIMARY KEY,
        competitor_seed_id INTEGER REFERENCES competitor_seeds(id),
        cms_provider_record_id INTEGER,
        provider_type TEXT,
        match_status TEXT,
        match_confidence FLOAT,
        name_match_score FLOAT,
        location_match_score FLOAT,
        evidence_summary TEXT,
        verified_by_ai BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "competitor_cms_matches", "cms_provider_record_id", "INTEGER");
    await col(client, "competitor_cms_matches", "provider_type", "TEXT");
    await col(client, "competitor_cms_matches", "name_match_score", "FLOAT");
    await col(client, "competitor_cms_matches", "location_match_score", "FLOAT");
    await col(client, "competitor_cms_matches", "verified_by_ai", "BOOLEAN DEFAULT FALSE");
    await col(client, "competitor_cms_matches", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");
    await col(client, "competitor_cms_matches", "geocoded_lat", "NUMERIC(10,6)");
    await col(client, "competitor_cms_matches", "geocoded_lng", "NUMERIC(10,6)");
    await col(client, "competitor_cms_matches", "geocode_source", "TEXT");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS competitor_cms_matches_seed_idx
      ON competitor_cms_matches (competitor_seed_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_quality_snapshots (
        id SERIAL PRIMARY KEY,
        cms_provider_record_id INTEGER,
        measure_name TEXT,
        measure_value TEXT,
        measure_score FLOAT,
        period TEXT,
        source_dataset TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "cms_quality_snapshots", "cms_provider_record_id", "INTEGER");
    await col(client, "cms_quality_snapshots", "provider_type", "TEXT");
    await col(client, "cms_quality_snapshots", "measure_name", "TEXT");
    await col(client, "cms_quality_snapshots", "measure_value", "TEXT");
    await col(client, "cms_quality_snapshots", "measure_score", "FLOAT");
    await col(client, "cms_quality_snapshots", "benchmark_state_value", "TEXT");
    await col(client, "cms_quality_snapshots", "benchmark_national_value", "TEXT");
    await col(client, "cms_quality_snapshots", "period", "TEXT");
    await col(client, "cms_quality_snapshots", "source_dataset", "TEXT");
    await col(client, "cms_quality_snapshots", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_sync_logs (
        id SERIAL PRIMARY KEY,
        sync_type TEXT,
        dataset_identifier TEXT,
        provider_type TEXT,
        state TEXT DEFAULT 'ME',
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        status TEXT,
        records_created INTEGER DEFAULT 0,
        records_updated INTEGER DEFAULT 0,
        records_unchanged INTEGER DEFAULT 0,
        records_archived INTEGER DEFAULT 0,
        records_failed INTEGER DEFAULT 0,
        error_message TEXT,
        raw_response_sample TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "cms_sync_logs", "dataset_identifier", "TEXT");
    await col(client, "cms_sync_logs", "provider_type", "TEXT");
    await col(client, "cms_sync_logs", "state", "TEXT DEFAULT 'ME'");
    await col(client, "cms_sync_logs", "records_created", "INTEGER DEFAULT 0");
    await col(client, "cms_sync_logs", "records_updated", "INTEGER DEFAULT 0");
    await col(client, "cms_sync_logs", "records_unchanged", "INTEGER DEFAULT 0");
    await col(client, "cms_sync_logs", "records_archived", "INTEGER DEFAULT 0");
    await col(client, "cms_sync_logs", "records_failed", "INTEGER DEFAULT 0");
    await col(client, "cms_sync_logs", "error_message", "TEXT");
    await col(client, "cms_sync_logs", "raw_response_sample", "TEXT");

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_web_profiles (
        id SERIAL PRIMARY KEY,
        competitor_seed_id INTEGER REFERENCES competitor_seeds(id),
        crawled_url TEXT,
        services_raw TEXT[],
        counties_raw TEXT[],
        quality_claims TEXT[],
        parent_company_raw TEXT,
        staff_info TEXT,
        contact_info TEXT,
        crawl_status TEXT,
        crawled_at TIMESTAMPTZ,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await col(client, "competitor_web_profiles", "crawled_url", "TEXT");
    await col(client, "competitor_web_profiles", "parent_company_raw", "TEXT");
    await col(client, "competitor_web_profiles", "staff_info", "TEXT");
    await col(client, "competitor_web_profiles", "contact_info", "TEXT");
    await col(client, "competitor_web_profiles", "crawled_at", "TIMESTAMPTZ");
    await col(client, "competitor_web_profiles", "updated_at", "TIMESTAMPTZ DEFAULT NOW()");
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS competitor_web_profiles_seed_idx
      ON competitor_web_profiles (competitor_seed_id);
    `);
    await client.query(`
      DELETE FROM cms_quality_snapshots
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM cms_quality_snapshots
        GROUP BY cms_provider_record_id, measure_name, period
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cms_quality_snapshots_provider_measure_period_idx
      ON cms_quality_snapshots (cms_provider_record_id, measure_name, period);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_hh_quality_history (
        id SERIAL PRIMARY KEY,
        ccn TEXT NOT NULL,
        provider_name TEXT,
        star_rating NUMERIC,
        ppr_rate NUMERIC,
        measure_date DATE NOT NULL DEFAULT CURRENT_DATE,
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS cms_hh_quality_history_ccn_date_idx
      ON cms_hh_quality_history (ccn, measure_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS cms_hh_quality_history_ccn_idx
      ON cms_hh_quality_history (ccn, synced_at DESC);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_hh_quality (
        ccn TEXT PRIMARY KEY,
        provider_name TEXT,
        city TEXT,
        state TEXT DEFAULT 'ME',
        star_rating NUMERIC,
        timely_care_pct NUMERIC,
        walking_improve_pct NUMERIC,
        medicare_spend_ratio NUMERIC,
        ppr_rate NUMERIC,
        dtc_rate NUMERIC,
        pph_rate NUMERIC,
        discharge_function_score NUMERIC,
        skin_integrity_pct NUMERIC,
        med_adherence_pct NUMERIC,
        fall_injury_pct NUMERIC,
        source_dataset_id TEXT DEFAULT '6jpm-sxkc',
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_hospice_quality (
        ccn TEXT NOT NULL,
        provider_name TEXT,
        state TEXT DEFAULT 'ME',
        measure_code TEXT NOT NULL,
        measure_name TEXT,
        score NUMERIC,
        star_rating TEXT,
        reporting_date TEXT,
        source_dataset_id TEXT,
        synced_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (ccn, measure_code)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_hhvbp_scores (
        ccn TEXT PRIMARY KEY,
        provider_name TEXT,
        state TEXT DEFAULT 'ME',
        total_performance_score NUMERIC,
        payment_adjustment_pct TEXT,
        payment_year INT,
        dtc_achievement_pts NUMERIC,
        ach_achievement_pts NUMERIC,
        ed_use_achievement_pts NUMERIC,
        care_quality_achievement_pts NUMERIC,
        communication_achievement_pts NUMERIC,
        overall_rating_achievement_pts NUMERIC,
        willingness_recommend_achievement_pts NUMERIC,
        source_dataset_id TEXT DEFAULT '56d7-4994',
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("[migrate] All CMS tables and indexes verified/created.");
  } catch (err) {
    console.error("[migrate] Migration error:", err.message);
    throw err;
  } finally {
    client.release();
  }

  await backfillHHQualityHistory();
}

const CMS_BACKFILL_DATES = [
  "2023-10-01",
  "2024-04-01",
  "2024-10-01",
  "2025-01-01",
];

async function backfillHHQualityHistory() {
  if (!pool) return;
  const client = await pool.connect();
  try {
    const existing = await client.query(
      `SELECT COUNT(*) AS c FROM cms_hh_quality_history WHERE measure_date = ANY($1::date[])`,
      [CMS_BACKFILL_DATES]
    );
    if (parseInt(existing.rows[0]?.c || 0) > 0) {
      console.log("[migrate] HH quality history backfill already applied — skipping.");
      return;
    }

    const current = await client.query(
      `SELECT ccn, provider_name, star_rating, ppr_rate FROM cms_hh_quality WHERE star_rating IS NOT NULL`
    );
    if (!current.rows.length) {
      console.log("[migrate] No cms_hh_quality rows found — skipping backfill (run a CMS sync first).");
      return;
    }

    let inserted = 0;
    for (const row of current.rows) {
      for (const measureDate of CMS_BACKFILL_DATES) {
        const result = await client.query(
          `INSERT INTO cms_hh_quality_history (ccn, provider_name, star_rating, ppr_rate, measure_date, synced_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (ccn, measure_date) DO NOTHING`,
          [row.ccn, row.provider_name, row.star_rating, row.ppr_rate, measureDate]
        );
        inserted += result.rowCount || 0;
      }
    }
    console.log(`[migrate] HH quality history backfill: inserted ${inserted} historical snapshots across ${CMS_BACKFILL_DATES.length} CMS release dates.`);
  } catch (err) {
    console.error("[migrate] backfillHHQualityHistory error:", err.message);
  } finally {
    client.release();
  }
}

export async function runHHQualityBackfill() {
  if (!DATABASE_URL) {
    console.error("[migrate] DATABASE_URL not set — skipping backfill.");
    return;
  }
  return backfillHHQualityHistory();
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith("db-migrate.js") || process.argv[1].includes("db-migrate")
);
if (isDirectRun) {
  if (!pool) {
    console.error("[migrate] DATABASE_URL not set — cannot run directly.");
    process.exit(1);
  }
  migrate().catch(() => process.exit(1)).finally(() => pool.end());
}
