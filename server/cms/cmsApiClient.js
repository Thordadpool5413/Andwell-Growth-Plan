import { query } from "./db.js";

const BASE_URL = process.env.CMS_PROVIDER_DATA_BASE_URL || "https://data.cms.gov/provider-data/api/1";
const DATA_API_BASE = process.env.CMS_DATA_API_BASE_URL || "https://data.cms.gov/provider-data/api/1";
const TIMEOUT_MS = parseInt(process.env.CMS_REQUEST_TIMEOUT_MS || "15000");
const MAX_PAGE = parseInt(process.env.CMS_MAX_PAGE_SIZE || "500");
const DEFAULT_STATE = process.env.CMS_DEFAULT_STATE || "ME";
const CACHE_TTL_HOURS = parseInt(process.env.CMS_CACHE_TTL_HOURS || "24");
const LOG_RAW = process.env.CMS_LOG_RAW_RESPONSES === "true";

async function fetchWithRetry(url, options = {}, retries = 3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        if (!res.ok) {
          if (attempt === retries) throw new Error(`CMS HTTP ${res.status}: ${url}`);
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }
        const data = await res.json();
        return data;
      } catch (err) {
        if (err.name === "AbortError") throw new Error(`CMS request timed out: ${url}`);
        if (attempt === retries) throw err;
        await new Promise((r) => setTimeout(r, attempt * 1200));
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

export async function searchCmsDatasets(keyword, topic = null) {
  const url = `${BASE_URL}/metastore/schemas/dataset/items?show-reference-ids=true`;
  try {
    const items = await fetchWithRetry(url);
    if (!Array.isArray(items)) return [];

    const kw = keyword.toLowerCase();
    return items
      .filter((item) => {
        const title = (item.title || "").toLowerCase();
        const desc = (item.description || "").toLowerCase();
        const topicMatch = topic ? (item.theme || []).some((t) => t.data?.toLowerCase().includes(topic.toLowerCase())) : true;
        return topicMatch && (title.includes(kw) || desc.includes(kw));
      })
      .map((item) => ({
        identifier: item.identifier,
        title: item.title,
        description: item.description,
        modified: item.modified,
        released: item.issued,
        topic: (item.theme || []).map((t) => t.data).join(", "),
        apiRef: `${DATA_API_BASE}/datastore/query/${item.identifier}`,
        downloadUrl: item.distribution?.[0]?.downloadURL,
        confidence: computeConfidence(item, keyword),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20);
  } catch (err) {
    console.error("[CMS] searchCmsDatasets error:", err.message);
    return [];
  }
}

function computeConfidence(item, keyword) {
  const kw = keyword.toLowerCase();
  const title = (item.title || "").toLowerCase();
  let score = 0;
  if (title.includes(kw)) score += 50;
  if (title.includes("maine") || title.includes(" me ")) score += 20;
  if (title.includes("provider")) score += 15;
  if (title.includes("quality")) score += 10;
  return score;
}

export async function getDatasetMetadata(datasetId) {
  try {
    const url = `${BASE_URL}/metastore/schemas/dataset/items/${datasetId}`;
    const meta = await fetchWithRetry(url);
    // CMS DKAN endpoint: /datastore/query/{uuid}/0  (resource index suffix is required)
    const colUrl = `${DATA_API_BASE}/datastore/query/${datasetId}/0?limit=1`;
    let columns = [];
    try {
      const sample = await fetchWithRetry(colUrl);
      // DKAN 2.x schema shape: { schema: { fields: [...] } }
      const fields = sample?.schema?.fields || sample?.schema?.[datasetId]?.fields;
      if (Array.isArray(fields)) {
        columns = fields.map((f) => ({ name: f.name, type: f.type, description: f.description }));
      } else if (sample?.results?.[0]) {
        columns = Object.keys(sample.results[0]).map((k) => ({ name: k, type: "text" }));
      } else if (sample?.data?.[0]) {
        columns = Object.keys(sample.data[0]).map((k) => ({ name: k, type: "text" }));
      }
    } catch (_) {}
    return {
      identifier: datasetId,
      title: meta.title,
      description: meta.description,
      modified: meta.modified,
      released: meta.issued,
      columns,
      apiRef: `${DATA_API_BASE}/datastore/query/${datasetId}/0`,
    };
  } catch (err) {
    console.error("[CMS] getDatasetMetadata error:", err.message);
    return null;
  }
}

export async function queryCmsDataset({ datasetId, filters = {}, columns = [], limit = MAX_PAGE, offset = 0, sortField = null, sortDir = "asc" }) {
  try {
    const body = {
      limit,
      offset,
      conditions: Object.entries(filters).map(([col, val]) => ({
        property: col,
        value: val,
        operator: "=",
      })),
    };
    if (sortField) body.sort = { property: sortField, order: sortDir };
    if (columns.length) body.properties = columns;

    // CMS DKAN requires /0 resource-index suffix; POST with JSON body
    const url = `${DATA_API_BASE}/datastore/query/${datasetId}/0`;
    const result = await fetchWithRetry(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // DKAN 2.x returns { count, results, schema, query } — NOT { data }
    const rows = result?.results ?? result?.data ?? [];
    if (LOG_RAW) console.log("[CMS] raw sample:", JSON.stringify(rows[0]).slice(0, 300));

    return {
      rows,
      total: result?.count ?? rows.length,
      offset,
      limit,
      sourceRef: `CMS Dataset ${datasetId}`,
    };
  } catch (err) {
    console.error("[CMS] queryCmsDataset error:", err.message);
    return { rows: [], total: 0, offset, limit, error: err.message };
  }
}

const STATE_COL_CANDIDATES = ["state", "provider_state", "state_cd", "hhcahps_state", "facility_state", "st"];

async function discoverStateColumn(datasetId) {
  try {
    // CMS DKAN endpoint requires /0 suffix
    const url = `${DATA_API_BASE}/datastore/query/${datasetId}/0?limit=1`;
    const sample = await fetchWithRetry(url);
    // DKAN 2.x: results array; schema.fields array
    const firstRow = sample?.results?.[0] ?? sample?.data?.[0];
    const schemaFields = sample?.schema?.fields ?? sample?.schema?.[datasetId]?.fields ?? [];
    const rowKeys = firstRow
      ? Object.keys(firstRow).map((k) => k.toLowerCase())
      : schemaFields.map((f) => f.name.toLowerCase());
    const found = STATE_COL_CANDIDATES.find((c) => rowKeys.includes(c));
    if (!found) console.warn(`[CMS] No state column found in dataset ${datasetId} — state filter skipped`);
    return found || null;
  } catch (err) {
    console.warn(`[CMS] discoverStateColumn error for ${datasetId}:`, err.message);
    return null;
  }
}

export async function geocodeAddress({ address, city, state = "ME", zip = null }) {
  const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!MAPS_KEY) return null;
  const parts = [address, city, state, zip].filter(Boolean);
  if (!parts.length) return null;
  try {
    const q = encodeURIComponent(parts.join(", "));
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&key=${MAPS_KEY}&region=us&components=country:US|administrative_area:ME`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (data.status === "OK" && data.results?.[0]?.geometry?.location) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
    }
    return null;
  } catch {
    return null;
  }
}

export async function fetchMaineProviders(providerType, filters = {}) {
  const cachedDatasets = await getCachedDatasets(providerType);
  const results = [];

  for (const ds of cachedDatasets.slice(0, 3)) {
    try {
      const stateCol = await discoverStateColumn(ds.cms_dataset_identifier);
      const stateFilter = stateCol ? { [stateCol]: DEFAULT_STATE } : {};

      let page = 0;
      let hasMore = true;
      while (hasMore) {
        const r = await queryCmsDataset({
          datasetId: ds.cms_dataset_identifier,
          filters: { ...stateFilter, ...filters },
          limit: MAX_PAGE,
          offset: page * MAX_PAGE,
        });
        if (!r.rows.length) break;
        results.push(...r.rows.map((row) => normalizeProviderRow(row, providerType, ds.cms_dataset_identifier)));
        hasMore = r.rows.length === MAX_PAGE;
        page++;
        if (page > 10) break;
      }
    } catch (err) {
      console.error("[CMS] fetchMaineProviders error:", err.message);
    }
  }

  const deduplicated = deduplicateProviders(results);
  return deduplicated;
}

function normalizeProviderRow(row, providerType, datasetId) {
  const nameField = findField(row, ["provider_name", "organization_name", "facility_name", "name", "providerName"]);
  const stateField = findField(row, ["state", "provider_state", "state_cd"]);
  const cityField = findField(row, ["city", "provider_city", "city_town"]);
  const zipField = findField(row, ["zip_code", "zip", "provider_zip", "postal_code"]);
  const addrField = findField(row, ["address", "provider_address", "street_address", "address_line_1"]);
  const ccnField = findField(row, ["cms_certification_number", "ccn", "provider_id", "cms_provider_number"]);
  const phoneField = findField(row, ["phone_number", "phone", "provider_phone"]);
  const npiField = findField(row, ["npi", "national_provider_identifier"]);

  const rawName = row[nameField] || "";
  return {
    provider_name_raw: rawName,
    provider_name_normalized: normalizeProviderName(rawName),
    cms_dataset_identifier: datasetId,
    provider_type: providerType,
    cms_certification_number: row[ccnField] || null,
    npi: row[npiField] || null,
    address: row[addrField] || null,
    city: row[cityField] || null,
    state: row[stateField] || "ME",
    zip_code: row[zipField] || null,
    phone: row[phoneField] || null,
    county: row.county_name || row.county || null,
    source_row_json: row,
    source_evidence_text: buildEvidenceText(row, rawName, providerType, datasetId),
  };
}

function findField(row, candidates) {
  for (const c of candidates) {
    if (row[c] !== undefined && row[c] !== null) return c;
    const lower = c.toLowerCase();
    const found = Object.keys(row).find((k) => k.toLowerCase() === lower);
    if (found) return found;
  }
  return candidates[0];
}

export function normalizeProviderName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(llc|inc|corp|co|dba|the|an?)\b\.?/gi, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildEvidenceText(row, name, type, datasetId) {
  const city = findField(row, ["city", "provider_city"]);
  const state = findField(row, ["state", "provider_state"]);
  const ccn = findField(row, ["cms_certification_number", "ccn"]);
  return `CMS ${type} provider: ${name}. Location: ${row[city] || ""}, ${row[state] || "ME"}. CCN: ${row[ccn] || "N/A"}. Source: CMS dataset ${datasetId}.`;
}

function deduplicateProviders(rows) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.provider_name_normalized}|${r.zip_code || r.city}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getCachedDatasets(providerType) {
  try {
    // Broad keyword matching to handle CMS topic tagging inconsistencies
    const kw = providerType === "hospice" ? "hospice" : "home health";
    const r = await query(
      `SELECT * FROM cms_datasets WHERE active_status = true
       AND (topic ILIKE $1 OR title ILIKE $1 OR title ILIKE $2 OR topic ILIKE $2)
       ORDER BY last_synced_at DESC NULLS LAST LIMIT 5`,
      [`%${kw}%`, `%${providerType}%`]
    );
    // Fallback: any active dataset if keyword match returns nothing
    if (!r.rows.length) {
      const fallback = await query(
        "SELECT * FROM cms_datasets WHERE active_status = true ORDER BY last_discovered_at DESC LIMIT 5"
      );
      return fallback.rows;
    }
    return r.rows;
  } catch {
    return [];
  }
}

export async function syncToDatabase(providers, providerType, datasetId) {
  let created = 0, updated = 0, unchanged = 0, failed = 0;
  for (const p of providers) {
    try {
      const existing = await query(
        "SELECT id, provider_name_normalized FROM cms_provider_records WHERE provider_name_normalized = $1 AND state = $2 AND provider_type = $3 LIMIT 1",
        [p.provider_name_normalized, p.state || "ME", providerType]
      );
      if (existing.rows.length) {
        await query(
          `UPDATE cms_provider_records SET
            provider_name_raw=$1, cms_certification_number=$2, npi=$3, address=$4, city=$5,
            zip_code=$6, phone=$7, county=$8, source_row_json=$9, source_evidence_text=$10,
            last_synced_at=NOW(), updated_at=NOW()
          WHERE id=$11`,
          [
            p.provider_name_raw, p.cms_certification_number, p.npi, p.address, p.city,
            p.zip_code, p.phone, p.county, JSON.stringify(p.source_row_json), p.source_evidence_text,
            existing.rows[0].id,
          ]
        );
        updated++;
      } else {
        await query(
          `INSERT INTO cms_provider_records
            (cms_dataset_identifier, provider_type, provider_name_raw, provider_name_normalized,
             cms_certification_number, npi, address, city, state, zip_code, phone, county,
             source_row_json, source_evidence_text, last_synced_at)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW())`,
          [
            datasetId, providerType, p.provider_name_raw, p.provider_name_normalized,
            p.cms_certification_number, p.npi, p.address, p.city, p.state || "ME",
            p.zip_code, p.phone, p.county,
            JSON.stringify(p.source_row_json), p.source_evidence_text,
          ]
        );
        created++;
      }
    } catch (err) {
      console.error("[CMS] syncToDatabase row error:", err.message);
      failed++;
    }
  }
  return { created, updated, unchanged, failed };
}

export async function logSync({ syncType, datasetId, providerType, startedAt, status, counts, error, sample }) {
  try {
    await query(
      `INSERT INTO cms_sync_logs
        (sync_type, dataset_identifier, provider_type, state, started_at, completed_at, status,
         records_created, records_updated, records_unchanged, records_archived, records_failed,
         error_message, raw_response_sample)
       VALUES ($1,$2,$3,$4,$5,NOW(),$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        syncType, datasetId, providerType, DEFAULT_STATE, startedAt, status,
        counts?.created || 0, counts?.updated || 0, counts?.unchanged || 0,
        counts?.archived || 0, counts?.failed || 0,
        error || null, sample ? JSON.stringify(sample) : null,
      ]
    );
  } catch (err) {
    console.error("[CMS] logSync error:", err.message);
  }
}
