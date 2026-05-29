#!/usr/bin/env node
/**
 * Andwell CMS Data Refresh Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches the latest Home Health and Hospice data from CMS Open Data API and
 * regenerates three files:
 *   src/data/cmsCountyMarket.js   — county-level market metrics (FFS, HH, Hospice)
 *   src/data/providers.js         — Maine named provider rows (HH + Hospice)
 *   src/data/cmsMeta.js           — dataset year, fetch date, record counts
 *
 * Usage:
 *   node scripts/refresh-cms-data.js              # auto-detect most recent year
 *   node scripts/refresh-cms-data.js --year 2022  # pin to a specific year
 *   node scripts/refresh-cms-data.js --dry-run    # fetch & log; do NOT write files
 *
 * No API keys required — uses CMS Open Data (data.cms.gov) public API.
 * ─────────────────────────────────────────────────────────────────────────────
 * CMS API source datasets:
 *   Geographic Variation by County  — county FFS, HH users, Hospice users
 *   PAC Utilization – HHA           — Maine HHA provider beneficiaries, payment
 *   PAC Utilization – Hospice       — Maine Hospice provider beneficiaries, payment
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── CMS API Configuration ────────────────────────────────────────────────────

const CMS_BASE = "https://data.cms.gov/data-api/v1/dataset";

const DATASETS = {
  GEO_VAR:     "6219697b-8f6c-4164-bed4-cd9317c58ebc", // Geographic Variation by National, State & County
  HHA_PAC:     "43ef03ce-2b60-40a8-958e-146195b5fec7", // Post-Acute Care Utilization – Home Health Agency
  HOSPICE_PAC: "4e73f1b5-82cb-4682-8ad2-28493f0b6840", // Post-Acute Care Utilization – Hospice
};

// Maine county FIPS codes (all begin with "23")
const MAINE_COUNTIES = new Set([
  "23001", "23003", "23005", "23007", "23009", "23011",
  "23013", "23015", "23017", "23019", "23021", "23023",
  "23025", "23027", "23029", "23031",
]);

// Map "23XXX" FIPS → county name
const FIPS_TO_COUNTY = {
  "23001": "Androscoggin",
  "23003": "Aroostook",
  "23005": "Cumberland",
  "23007": "Franklin",
  "23009": "Hancock",
  "23011": "Kennebec",
  "23013": "Knox",
  "23015": "Lincoln",
  "23017": "Oxford",
  "23019": "Penobscot",
  "23021": "Piscataquis",
  "23023": "Sagadahoc",
  "23025": "Somerset",
  "23027": "Waldo",
  "23029": "Washington",
  "23031": "York",
};

// Maine city (uppercased) → county — used to assign provider location county
const CITY_TO_COUNTY = {
  PORTLAND: "Cumberland", SOUTH_PORTLAND: "Cumberland", "SOUTH PORTLAND": "Cumberland",
  "SO PORTLAND": "Cumberland", WESTBROOK: "Cumberland",
  SCARBOROUGH: "Cumberland", GORHAM: "Cumberland", FALMOUTH: "Cumberland",
  YARMOUTH: "Cumberland", BRUNSWICK: "Cumberland", CAPE_ELIZABETH: "Cumberland",
  WINDHAM: "Cumberland", STANDISH: "Cumberland", FREEPORT: "Cumberland",
  BIDDEFORD: "York", SACO: "York", SANFORD: "York", YORK: "York",
  KENNEBUNK: "York", KITTERY: "York", WELLS: "York", SPRINGVALE: "York",
  "OLD ORCHARD BEACH": "York", "SOUTH BERWICK": "York", ELIOT: "York",
  BERWICK: "York", BUXTON: "York", WATERBORO: "York", LIMERICK: "York",
  BANGOR: "Penobscot", BREWER: "Penobscot", HAMPDEN: "Penobscot",
  HERMON: "Penobscot", ORONO: "Penobscot", "OLD TOWN": "Penobscot",
  LINCOLN: "Penobscot", DEXTER: "Penobscot", MILLINOCKET: "Penobscot",
  NEWPORT: "Penobscot", CORINNA: "Penobscot",
  LEWISTON: "Androscoggin", AUBURN: "Androscoggin", LISBON: "Androscoggin",
  RUMFORD: "Oxford", NORWAY: "Oxford", "SOUTH PARIS": "Oxford", BETHEL: "Oxford",
  OXFORD: "Oxford", FRYEBURG: "Oxford",
  WATERVILLE: "Kennebec", AUGUSTA: "Kennebec", GARDINER: "Kennebec",
  HALLOWELL: "Kennebec", WINTHROP: "Kennebec", OAKLAND: "Kennebec",
  BATH: "Sagadahoc", TOPSHAM: "Sagadahoc", RICHMOND: "Sagadahoc",
  WISCASSET: "Lincoln", DAMARISCOTTA: "Lincoln", BOOTHBAY: "Lincoln",
  WALDOBORO: "Lincoln", NEWCASTLE: "Lincoln",
  ROCKLAND: "Knox", CAMDEN: "Knox", THOMASTON: "Knox", ROCKPORT: "Knox", UNION: "Knox",
  BELFAST: "Waldo", SEARSPORT: "Waldo", UNITY: "Waldo", WINTERPORT: "Waldo",
  ELLSWORTH: "Hancock", "BAR HARBOR": "Hancock", BUCKSPORT: "Hancock",
  "NORTHEAST HARBOR": "Hancock", "SOUTHWEST HARBOR": "Hancock",
  CASTINE: "Hancock", "BLUE HILL": "Hancock", "DEER ISLE": "Hancock",
  SKOWHEGAN: "Somerset", MADISON: "Somerset", PITTSFIELD: "Somerset",
  FARMINGTON: "Franklin", WILTON: "Franklin", JAY: "Franklin",
  "DOVER-FOXCROFT": "Piscataquis", DOVER: "Piscataquis", GUILFORD: "Piscataquis", GREENVILLE: "Piscataquis",
  "PRESQUE ISLE": "Aroostook", CARIBOU: "Aroostook", "FORT KENT": "Aroostook",
  HOULTON: "Aroostook", MADAWASKA: "Aroostook", "VAN BUREN": "Aroostook",
  CALAIS: "Washington", EASTPORT: "Washington", MACHIAS: "Washington",
  LUBEC: "Washington", PRINCETON: "Washington", MILBRIDGE: "Washington",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const num = (v) => parseFloat(v) || 0;
const int = (v) => parseInt(v, 10) || 0;
const round = (v, d = 0) => { const f = 10 ** d; return Math.round(num(v) * f) / f; };

function cityToCounty(city) {
  if (!city) return null;
  const key = city.toUpperCase().trim();
  return CITY_TO_COUNTY[key] || null;
}

async function fetchPage(datasetId, params, retries = 3) {
  const url = `${CMS_BASE}/${datasetId}/data?${new URLSearchParams(params)}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
      const json = await res.json();
      return json.data || json || [];
    } catch (e) {
      if (i === retries - 1) throw e;
      const wait = 1500 * (i + 1);
      console.warn(`   ⚠ Retry ${i + 1} for ${datasetId} (${e.message}) — waiting ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

async function fetchAll(datasetId, baseParams, pageSize = 2000) {
  let offset = 0;
  const all = [];
  while (true) {
    const page = await fetchPage(datasetId, { ...baseParams, size: pageSize, offset });
    if (!Array.isArray(page) || !page.length) break;
    all.push(...page);
    if (page.length < pageSize) break;
    offset += pageSize;
    process.stdout.write(`\r   Fetched ${all.length} rows...`);
  }
  if (all.length) process.stdout.write("\n");
  return all;
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function discoverLatestYear() {
  const rows = await fetchPage(DATASETS.GEO_VAR, {
    "filter[BENE_GEO_LVL][value]": "National",
    "filter[BENE_AGE_LVL][value]": "All",
    size: 20,
  });
  const years = [...new Set(rows.map((r) => int(r.YEAR)))].filter(Boolean).sort((a, b) => b - a);
  return years[0] || 2022;
}

async function fetchGeoVarMaine(year) {
  console.log(`  → Geographic Variation county rows (${year})...`);
  // Fetch all county rows for the target year; filter for Maine (FIPS starts with "23") client-side
  const rows = await fetchAll(DATASETS.GEO_VAR, {
    "filter[BENE_GEO_LVL][value]": "County",
    "filter[BENE_AGE_LVL][value]": "All",
    "filter[YEAR][value]": String(year),
  });
  return rows.filter((r) => MAINE_COUNTIES.has(String(r.BENE_GEO_CD)));
}

async function fetchHHAProviders(_year) {
  console.log(`  → HHA providers (ME), using STATE=ME single filter then filtering client-side...`);
  // CMS API does not support compound filters — compound queries return 0 rows.
  // Use STATE=ME as the sole API filter; filter SMRY_CTGRY=PROVIDER client-side.
  // The API returns the most recent available year's data when no YEAR filter is applied.
  const rows = await fetchAll(DATASETS.HHA_PAC, {
    "filter[STATE][value]": "ME",
  });
  return rows.filter((r) => r.SMRY_CTGRY === "PROVIDER");
}

async function fetchHospiceProviders(_year) {
  console.log(`  → Hospice providers (ME), using STATE=ME single filter then filtering client-side...`);
  const rows = await fetchAll(DATASETS.HOSPICE_PAC, {
    "filter[STATE][value]": "ME",
  });
  return rows.filter((r) => r.SMRY_CTGRY === "PROVIDER");
}

// ─── Transformers ─────────────────────────────────────────────────────────────

function buildCountyMarket(geoRows, hhaRows, hospiceRows) {
  // County description format: "ME-York", "ME-Cumberland" — strip "ME-" prefix
  const result = {};

  for (const r of geoRows) {
    const fips = String(r.BENE_GEO_CD || "");
    const county = FIPS_TO_COUNTY[fips];
    if (!county) continue;

    const hhPay  = int(r.HH_MDCR_PYMT_AMT);
    const hhUsers = int(r.BENES_HH_CNT);
    const hosPay  = int(r.HOSPC_MDCR_PYMT_AMT);
    const hosUsers = int(r.BENES_HOSPC_CNT);

    result[county] = {
      ffs:  int(r.BENES_OM_CNT),       // Original Medicare (FFS) beneficiaries
      hh: {
        prov:  0,                        // filled below from provider rows
        users: hhUsers,
        rate:  round(hhUsers / Math.max(int(r.BENES_OM_CNT), 1), 4),
        pay:   hhPay,
        ppu:   hhUsers > 0 ? round(hhPay / hhUsers) : 0,
      },
      hos: {
        prov:  0,                        // filled below from provider rows
        users: hosUsers,
        ppu:   hosUsers > 0 ? round(hosPay / hosUsers) : 0,
      },
    };
  }

  // Count distinct providers per county from provider-level data
  for (const r of hhaRows) {
    const county = cityToCounty(r.PRVDR_CITY);
    if (county && result[county]) result[county].hh.prov++;
  }
  for (const r of hospiceRows) {
    const county = cityToCounty(r.PRVDR_CITY);
    if (county && result[county]) result[county].hos.prov++;
  }

  return result;
}

function buildProviders(hhaRows, hospiceRows) {
  const hhTotal  = hhaRows.reduce((s, r) => s + int(r.BENE_DSTNCT_CNT), 0);
  const hosTotal = hospiceRows.reduce((s, r) => s + int(r.BENE_DSTNCT_CNT), 0);

  const mapRow = (r, service, total) => {
    const benes = int(r.BENE_DSTNCT_CNT);
    if (benes < 10) return null; // CMS suppresses small cells; skip
    return {
      service,
      providerName:       (r.PRVDR_NAME || "").trim(),
      locationCounty:     cityToCounty(r.PRVDR_CITY) || (r.PRVDR_CITY || "Unknown"),
      beneficiaries:      benes,
      episodes:           int(r.TOT_EPSD_STAY_CNT),
      payment:            int(r.TOT_MDCR_PYMT_AMT),
      providerVolumeShare: total > 0 ? round(benes / total, 4) : 0,
      isAndwellCmsRecord:  (r.PRVDR_NAME || "").toLowerCase().includes("androscoggin home"),
    };
  };

  const hhProviders = hhaRows
    .sort((a, b) => int(b.BENE_DSTNCT_CNT) - int(a.BENE_DSTNCT_CNT))
    .map((r) => mapRow(r, "Home Healthcare", hhTotal))
    .filter(Boolean);

  const hosProviders = hospiceRows
    .sort((a, b) => int(b.BENE_DSTNCT_CNT) - int(a.BENE_DSTNCT_CNT))
    .map((r) => mapRow(r, "Hospice", hosTotal))
    .filter(Boolean);

  return [...hhProviders, ...hosProviders];
}

// ─── Validators ───────────────────────────────────────────────────────────────

function validate(countyMarket, providers, hhaRows, hospiceRows) {
  const warnings = [];

  for (const [county, m] of Object.entries(countyMarket)) {
    if (m.ffs === 0)       warnings.push(`${county}: ffs beneficiaries = 0 (check CMS data year)`);
    if (m.hh.users === 0)  warnings.push(`${county}: hh.users = 0`);
  }

  const unmapped = [
    ...hhaRows.filter((r) => !cityToCounty(r.PRVDR_CITY)).map((r) => `HHA ${r.PRVDR_NAME} (${r.PRVDR_CITY})`),
    ...hospiceRows.filter((r) => !cityToCounty(r.PRVDR_CITY)).map((r) => `Hospice ${r.PRVDR_NAME} (${r.PRVDR_CITY})`),
  ];
  if (unmapped.length) {
    warnings.push(`${unmapped.length} providers not mapped to a county — provider counts may be low`);
    unmapped.slice(0, 5).forEach((m) => warnings.push(`  └ ${m}`));
  }

  return warnings;
}

// ─── Writers ──────────────────────────────────────────────────────────────────

function formatCountyMarket(data) {
  const entries = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([county, m]) =>
        `  ${county}: { ffs: ${m.ffs}, hh: { prov: ${m.hh.prov}, users: ${m.hh.users}, rate: ${m.hh.rate}, pay: ${m.hh.pay}, ppu: ${m.hh.ppu} }, hos: { prov: ${m.hos.prov}, users: ${m.hos.users}, ppu: ${m.hos.ppu} } },`,
    )
    .join("\n");
  return `const cmsCountyMarket = {\n${entries}\n};\n\nexport default cmsCountyMarket;\n`;
}

function formatProviders(providers) {
  const rows = providers
    .map(
      (p) =>
        `  { service: "${p.service}", providerName: "${p.providerName.replace(/"/g, "'")}", locationCounty: "${p.locationCounty}", beneficiaries: ${p.beneficiaries}, episodes: ${p.episodes}, payment: ${p.payment}, providerVolumeShare: ${p.providerVolumeShare}, isAndwellCmsRecord: ${p.isAndwellCmsRecord} },`,
    )
    .join("\n");

  // Preserve the static strategic planning context rows (these don't come from the API)
  return `export const namedProviderRows = [\n${rows}\n];\n
export const marketShareBuildRows = [
  { layer: "County market volume", status: "Built in", data: "CMS county home health users, hospice users, provider counts, utilization, payment, and FFS beneficiaries.", limitation: "Shows total county market size but not which named agency owns the county volume.", need: "Use as the county denominator for market share and opportunity sizing." },
  { layer: "Andwell actual volume", status: "Partially built", data: "Provider files show the Androscoggin Home Healthcare and Hospice CMS record at the provider level.", limitation: "Not Andwell actual volume by county served and not all service lines.", need: "Upload Andwell actual county and service line volume for the same period as CMS market data." },
  { layer: "Named competitor list", status: "Built in for HH and Hospice", data: "Named Maine home health and hospice provider rows with provider name, location, beneficiaries, episodes, and payment.", limitation: "Provider location is not the same as every county served.", need: "Add provider service area ZIP files or a curated local competitor matrix by county." },
  { layer: "Competitor volume", status: "Built in at provider level", data: "Provider level beneficiary, episode, and Medicare payment volume for Home Healthcare and Hospice.", limitation: "The uploaded files do not allocate each provider\\'s patients to each Maine county.", need: "Add county served volume, claims attribution, provider ZIP service areas, or an accepted allocation model." },
  { layer: "Service line overlap", status: "Partially inferred", data: "Andwell visible service footprint plus provider file rows for Home Healthcare and Hospice.", limitation: "Does not prove each named competitor offers Mobile Wound, Therapy Care, GUIDE, or other service lines.", need: "Add competitor service matrix by county and service line." },
  { layer: "Share calculation", status: "Partially built", data: "Statewide provider file share and modeled Year 1 capture against county CMS market volume.", limitation: "True county level Andwell versus competitor share still requires county attributed volume by provider.", need: "Use Andwell actual volume divided by CMS county market volume, and competitor county volume divided by CMS county market volume." },
];

export const marketShareFormulaRows = [
  { metric: "Andwell provider file share", formula: "Andwell CMS provider beneficiaries divided by total Maine provider file beneficiaries", state: "Built in" },
  { metric: "Named competitor provider file share", formula: "Named competitor beneficiaries divided by total Maine provider file beneficiaries", state: "Built in" },
  { metric: "Andwell actual county market share", formula: "Andwell actual county service line volume divided by comparable CMS county market volume", state: "Needs Andwell data" },
  { metric: "Named competitor county market share", formula: "Named competitor county service line volume divided by comparable CMS county market volume", state: "Needs county attribution" },
  { metric: "Modeled Year 1 capture", formula: "Modeled Year 1 growth volume divided by comparable CMS county market volume", state: "Built in" },
  { metric: "Provider density", formula: "CMS provider count divided by FFS beneficiaries times 10,000", state: "Built in" },
];
`;
}

function formatMeta(meta) {
  return `const cmsMeta = ${JSON.stringify(meta, null, 2)};\n\nexport default cmsMeta;\n`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const yearIdx = args.indexOf("--year");
  const targetYear = yearIdx >= 0 ? parseInt(args[yearIdx + 1], 10) : null;
  const dryRun = args.includes("--dry-run");

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   Andwell CMS Data Refresh                   ║");
  console.log("╚══════════════════════════════════════════════╝");
  if (dryRun) console.log("  DRY RUN — files will NOT be written\n");

  // ── Step 1: Determine target year ─────────────────────────────────────────
  let year = targetYear;
  if (!year) {
    console.log("1. Discovering most recent CMS data year...");
    year = await discoverLatestYear();
    console.log(`   → Found year: ${year}`);
  } else {
    console.log(`1. Using specified year: ${year}`);
  }

  // ── Step 2: Fetch ─────────────────────────────────────────────────────────
  console.log("\n2. Fetching from CMS Open Data API...");
  const [geoRows, hhaRows, hospiceRows] = await Promise.all([
    fetchGeoVarMaine(year),
    fetchHHAProviders(year),
    fetchHospiceProviders(year),
  ]);

  console.log(`\n   Geographic variation: ${geoRows.length} Maine county rows`);
  console.log(`   HHA providers:        ${hhaRows.length} Maine providers`);
  console.log(`   Hospice providers:    ${hospiceRows.length} Maine providers`);

  if (!geoRows.length) {
    console.error(`\n❌ No geographic variation data returned for year ${year}.`);
    console.error("   Try a different year: node scripts/refresh-cms-data.js --year 2022");
    process.exit(1);
  }

  // ── Step 3: Transform ─────────────────────────────────────────────────────
  console.log("\n3. Transforming data...");
  const countyMarket = buildCountyMarket(geoRows, hhaRows, hospiceRows);
  const providers    = buildProviders(hhaRows, hospiceRows);
  const counties     = Object.keys(countyMarket).sort();

  console.log(`   County market: ${counties.length} counties — ${counties.join(", ")}`);
  console.log(`   Providers: ${providers.filter((p) => p.service === "Home Healthcare").length} HHA, ${providers.filter((p) => p.service === "Hospice").length} Hospice`);

  // ── Step 4: Validate ──────────────────────────────────────────────────────
  console.log("\n4. Validating...");
  const warnings = validate(countyMarket, providers, hhaRows, hospiceRows);
  if (warnings.length) {
    warnings.forEach((w) => console.warn(`   ⚠ ${w}`));
  } else {
    console.log("   ✓ No data-quality issues found");
  }

  // ── Step 5: Write ─────────────────────────────────────────────────────────
  const fetchedAt = new Date().toISOString();
  const modelDate = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  const meta = {
    datasetYear: year,
    fetchedAt,
    modelDate,
    sources: {
      geoVar:      { datasetId: DATASETS.GEO_VAR,     description: "Medicare Geographic Variation by National, State & County", rows: geoRows.length },
      hhaPac:      { datasetId: DATASETS.HHA_PAC,     description: "Medicare Post-Acute Care Utilization – Home Health Agency",  rows: hhaRows.length },
      hospicePac:  { datasetId: DATASETS.HOSPICE_PAC, description: "Medicare Post-Acute Care Utilization – Hospice",            rows: hospiceRows.length },
    },
    coverage: {
      counties:          counties,
      hhProviders:       providers.filter((p) => p.service === "Home Healthcare").length,
      hospiceProviders:  providers.filter((p) => p.service === "Hospice").length,
    },
    warnings: warnings.length,
  };

  if (dryRun) {
    console.log("\n5. DRY RUN — output preview:");
    console.log("   cmsCountyMarket.js sample:", JSON.stringify(Object.entries(countyMarket).slice(0, 2), null, 2));
    console.log("   providers.js sample:", JSON.stringify(providers.slice(0, 2), null, 2));
    console.log("   cmsMeta.js:", JSON.stringify(meta, null, 2));
  } else {
    console.log("\n5. Writing output files...");
    writeFileSync(resolve(ROOT, "src/data/cmsCountyMarket.js"), formatCountyMarket(countyMarket), "utf8");
    writeFileSync(resolve(ROOT, "src/data/providers.js"),       formatProviders(providers),       "utf8");
    writeFileSync(resolve(ROOT, "src/data/cmsMeta.js"),         formatMeta(meta),                 "utf8");
    console.log("   ✓ src/data/cmsCountyMarket.js");
    console.log("   ✓ src/data/providers.js");
    console.log("   ✓ src/data/cmsMeta.js");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════╗");
  console.log(`║  ✅ Refresh complete — CMS year ${year}         ║`);
  console.log(`║  ${counties.length} counties · ${meta.coverage.hhProviders} HHA providers · ${meta.coverage.hospiceProviders} Hospice     ║`);
  if (warnings.length) {
    console.log(`║  ⚠ ${warnings.length} warnings — review above before committing ║`);
  }
  if (!dryRun) {
    console.log("║  Restart dev server (npm run dev) to reload   ║");
  }
  console.log("╚══════════════════════════════════════════════╝\n");
}

main().catch((err) => {
  console.error("\n❌ Fatal:", err.message);
  if (err.cause) console.error("   Cause:", err.cause);
  process.exit(1);
});
