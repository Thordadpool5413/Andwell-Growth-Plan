#!/usr/bin/env node
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[migrate] DATABASE_URL not set — skipping.");
  process.exit(0);
}

const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("[migrate] Running CMS schema migrations…");

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_datasets (
        id SERIAL PRIMARY KEY,
        dataset_id TEXT UNIQUE NOT NULL,
        title TEXT,
        topic TEXT,
        description TEXT,
        distribution_url TEXT,
        provider_type TEXT,
        last_checked_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_provider_records (
        id SERIAL PRIMARY KEY,
        cms_certification_number TEXT UNIQUE,
        provider_name TEXT,
        provider_type TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        county TEXT,
        phone TEXT,
        ownership_type TEXT,
        certification_date TEXT,
        quality_score NUMERIC,
        raw_json JSONB,
        synced_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_seeds (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        website TEXT,
        provider_type TEXT,
        known_counties TEXT[],
        parent_company TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_cms_matches (
        id SERIAL PRIMARY KEY,
        competitor_seed_id INTEGER REFERENCES competitor_seeds(id),
        cms_record_id INTEGER REFERENCES cms_provider_records(id),
        match_status TEXT,
        match_confidence NUMERIC,
        provider_name_raw TEXT,
        cms_certification_number TEXT,
        address TEXT,
        city TEXT,
        zip_code TEXT,
        county TEXT,
        evidence_summary TEXT,
        matched_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS competitor_cms_matches_seed_idx
      ON competitor_cms_matches (competitor_seed_id);
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_quality_snapshots (
        id SERIAL PRIMARY KEY,
        cms_certification_number TEXT,
        snapshot_date DATE DEFAULT CURRENT_DATE,
        quality_score NUMERIC,
        family_experience_score NUMERIC,
        timely_care_score NUMERIC,
        raw_json JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_sync_logs (
        id SERIAL PRIMARY KEY,
        sync_type TEXT,
        status TEXT,
        records_fetched INTEGER,
        records_upserted INTEGER,
        errors TEXT[],
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS competitor_web_profiles (
        id SERIAL PRIMARY KEY,
        competitor_seed_id INTEGER REFERENCES competitor_seeds(id),
        crawl_status TEXT,
        services_raw TEXT[],
        counties_raw TEXT[],
        quality_claims TEXT[],
        last_crawled_at TIMESTAMPTZ,
        raw_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS competitor_web_profiles_seed_idx
      ON competitor_web_profiles (competitor_seed_id);
    `);

    console.log("[migrate] All CMS tables and indexes verified/created.");
  } catch (err) {
    console.error("[migrate] Migration error:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
