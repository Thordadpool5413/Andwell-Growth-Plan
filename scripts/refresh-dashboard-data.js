#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CMS_DATASET_REGISTRY, HRSA_DATASETS } from "../src/data/cmsDatasetRegistry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "src/data/generated");
const PAGE_SIZE = 500;
const REQUEST_TIMEOUT_MS = 45000;
const GENERATED_AT = new Date().toISOString();

const COUNTY_BY_FIPS = {
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

const CITY_TO_COUNTY = {
  "AUGUSTA": "Kennebec",
  "AUBURN": "Androscoggin",
  "BANGOR": "Penobscot",
  "BAR HARBOR": "Hancock",
  "BATH": "Sagadahoc",
  "BELFAST": "Waldo",
  "BIDDEFORD": "York",
  "BRUNSWICK": "Cumberland",
  "CALAIS": "Washington",
  "CARIBOU": "Aroostook",
  "DAMARISCOTTA": "Lincoln",
  "DOVER-FOXCROFT": "Piscataquis",
  "EASTPORT": "Washington",
  "ELLSWORTH": "Hancock",
  "FALMOUTH": "Cumberland",
  "FARMINGTON": "Franklin",
  "FORT KENT": "Aroostook",
  "FRYEBURG": "Oxford",
  "GORHAM": "Cumberland",
  "HALLOWELL": "Kennebec",
  "HOULTON": "Aroostook",
  "KENNEBUNK": "York",
  "KITTERY": "York",
  "LEWISTON": "Androscoggin",
  "LINCOLN": "Penobscot",
  "MACHIAS": "Washington",
  "MADAWASKA": "Aroostook",
  "NORWAY": "Oxford",
  "OAKLAND": "Kennebec",
  "PORTLAND": "Cumberland",
  "PRESQUE ISLE": "Aroostook",
  "ROCKLAND": "Knox",
  "SACO": "York",
  "SANFORD": "York",
  "SCARBOROUGH": "Cumberland",
  "SKOWHEGAN": "Somerset",
  "SOUTH PORTLAND": "Cumberland",
  "TOPSHAM": "Sagadahoc",
  "WALDOBORO": "Lincoln",
  "WATERVILLE": "Kennebec",
  "WELLS": "York",
  "WESTBROOK": "Cumberland",
  "WISCASSET": "Lincoln",
  "YORK": "York",
};

const ZIP_TO_COUNTY_PREFIXES = [
  [/^039|^0400|^0401|^0402|^0403|^0404|^0405|^0407|^0408/, "York"],
  [/^0406|^041|^0409/, "Cumberland"],
  [/^0421|^0422|^0423|^0424|^0425|^0426|^0427|^0428|^0429/, "Androscoggin"],
  [/^043/, "Kennebec"],
  [/^0440|^0441|^0442|^0443|^0444|^0445|^0446|^0447|^0448|^0449/, "Penobscot"],
  [/^0453|^0454|^0455|^0456|^0457|^0458/, "Lincoln"],
  [/^0456|^0457|^0458|^0459/, "Sagadahoc"],
  [/^046/, "Hancock"],
  [/^047/, "Aroostook"],
  [/^048/, "Knox"],
  [/^0490|^0491|^0492|^0493|^0494|^0495|^0496/, "Somerset"],
  [/^0497|^0498|^0499/, "Waldo"],
];

function toNumber(value) {
  if (value == null || value === "" || value === "Not Available" || value === "Not Applicable") return null;
  const parsed = Number(String(value).replace(/[$,% ,]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(llc|inc|corp|corporation|company|co|the|dba)\b\.?/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countyFromZip(zip) {
  const z = String(zip || "").padStart(5, "0").slice(0, 5);
  if (["04901", "04903", "04917", "04937"].includes(z)) return "Kennebec";
  const hit = ZIP_TO_COUNTY_PREFIXES.find(([pattern]) => pattern.test(z));
  return hit?.[1] || null;
}

function assignCounty(row) {
  const rawCounty = row.countyparish || row.county_name || row.county || "";
  if (rawCounty) {
    const county = String(rawCounty).replace(/\s+County$/i, "").trim();
    if (Object.values(COUNTY_BY_FIPS).includes(county)) return { county, countyAssignmentMethod: "source_county" };
  }
  const zipCounty = countyFromZip(row.zip_code || row.zip || row.provider_zip || row.ZIP || row.CMS_PROVIDER_ZIP_CD);
  if (zipCounty) return { county: zipCounty, countyAssignmentMethod: "zip_prefix" };
  const city = String(row.citytown || row.city || row.provider_city || row.CITY || row.CMS_PROVIDER_CITY || "").trim().toUpperCase();
  if (CITY_TO_COUNTY[city]) return { county: CITY_TO_COUNTY[city], countyAssignmentMethod: "city_lookup" };
  return { county: null, countyAssignmentMethod: "unassigned" };
}

async function fetchText(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${url}: ${text.slice(0, 180)}`);
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`Expected JSON from ${url}, received ${contentType || "unknown content type"}: ${text.slice(0, 120)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

async function queryCmsDataset(dataset, conditions = []) {
  const rows = [];
  let offset = 0;
  while (true) {
    const payload = { limit: PAGE_SIZE, offset, conditions };
    const json = await fetchText(dataset.dataEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const page = json.results || json.data || [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return rows;
}

function normalizeHomeHealth(row) {
  const countyInfo = assignCounty(row);
  const ccn = String(row.cms_certification_number_ccn || row.ccn || "").trim();
  return {
    ccn,
    provider_name: row.provider_name || "",
    normalized_name: normalizeName(row.provider_name),
    address: row.address || "",
    city: row.citytown || "",
    state: row.state || "ME",
    zip_code: row.zip_code || "",
    phone: row.telephone_number || "",
    ownership: row.type_of_ownership || "",
    county: countyInfo.county,
    county_assignment_method: countyInfo.countyAssignmentMethod,
    certification_date: row.certification_date || null,
    star_rating: toNumber(row.quality_of_patient_care_star_rating),
    timely_care_pct: toNumber(row.how_often_the_home_health_team_began_their_patients_care_in_d440),
    walking_improve_pct: toNumber(row.how_often_patients_got_better_at_walking_or_moving_around),
    medication_teaching_pct: toNumber(row.how_often_the_home_health_team_taught_patients_or_their_fami_d4ba),
    source_dataset_id: CMS_DATASET_REGISTRY.homeHealthAgencies.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  };
}

function normalizeHhcahps(row, providerByCcn) {
  const provider = providerByCcn.get(String(row.cms_certification_number_ccn || "").trim());
  return {
    ccn: String(row.cms_certification_number_ccn || "").trim(),
    provider_name: provider?.provider_name || null,
    county: provider?.county || null,
    summary_star_rating: toNumber(row.hhcahps_survey_summary_star_rating),
    professional_care_star_rating: toNumber(row.star_rating_for_health_team_gave_care_in_a_professional_way),
    communication_star_rating: toNumber(row.star_rating_for_health_team_communicated_well_with_them),
    overall_care_star_rating: toNumber(row.star_rating_for_how_patients_rated_overall_care_from_agency),
    recommend_pct: toNumber(row.percent_of_patients_who_reported_yes_they_would_definitely__2707),
    completed_surveys: toNumber(row.number_of_completed_surveys),
    survey_response_rate: toNumber(row.survey_response_rate),
    source_dataset_id: CMS_DATASET_REGISTRY.homeHealthHhcahpsProvider.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  };
}

function normalizeHhvbp(row) {
  const countyInfo = assignCounty(row);
  return {
    ccn: String(row.cms_certification_number_ccn || "").trim(),
    provider_name: row.provider_name || "",
    normalized_name: normalizeName(row.provider_name),
    state: row.state || "ME",
    county: countyInfo.county,
    county_assignment_method: countyInfo.countyAssignmentMethod,
    total_performance_score: toNumber(row.total_performance_score),
    payment_adjustment_pct: row.payment_adjustment_percentage || row.payment_adjustment_pct || null,
    payment_year: row.payment_year || "2026",
    discharged_to_community_score: toNumber(row.discharged_to_community_py_hha_measure_value),
    avoidable_hospitalizations_score: toNumber(row.ach_py_hha_measure_value),
    ed_use_score: toNumber(row.ed_use_py_hha_measure_value),
    care_of_patients_score: toNumber(row.care_of_patients_py_hha_measure_value),
    communication_score: toNumber(row.communication_py_hha_measure_value),
    overall_rating_score: toNumber(row.overall_rating_py_hha_measure_value),
    willingness_to_recommend_score: toNumber(row.willingness_to_recommend_py_hha_measure_value),
    reporting_period: row.discharged_to_community_py_hha_data_period || row.overall_rating_py_hha_data_period || null,
    source_dataset_id: CMS_DATASET_REGISTRY.homeHealthHhvbpAgencyData.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  };
}

function normalizeHospiceGeneral(row) {
  const countyInfo = assignCounty(row);
  return {
    ccn: String(row.cms_certification_number_ccn || "").trim(),
    provider_name: row.facility_name || "",
    normalized_name: normalizeName(row.facility_name),
    address: [row.address_line_1, row.address_line_2].filter(Boolean).join(" "),
    city: row.citytown || "",
    state: row.state || "ME",
    zip_code: row.zip_code || "",
    phone: row.telephone_number || "",
    ownership: row.ownership_type || "",
    county: countyInfo.county,
    county_assignment_method: countyInfo.countyAssignmentMethod,
    certification_date: row.certification_date || null,
    source_dataset_id: CMS_DATASET_REGISTRY.hospiceGeneralInformation.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  };
}

function normalizeHospiceMeasure(row) {
  const countyInfo = assignCounty(row);
  return {
    ccn: String(row.cms_certification_number_ccn || "").trim(),
    provider_name: row.facility_name || "",
    county: countyInfo.county,
    county_assignment_method: countyInfo.countyAssignmentMethod,
    measure_code: row.measure_code || "",
    measure_name: row.measure_name || "",
    score: toNumber(row.score),
    star_rating: toNumber(row.star_rating),
    reporting_period: row.date || row.measure_date_range || null,
    source_dataset_id: row.star_rating !== undefined
      ? CMS_DATASET_REGISTRY.hospiceCahpsProviderData.identifier
      : CMS_DATASET_REGISTRY.hospiceProviderData.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  };
}

function groupHospiceQuality(rows) {
  const byCcn = new Map();
  for (const row of rows) {
    if (!row.ccn) continue;
    if (!byCcn.has(row.ccn)) {
      byCcn.set(row.ccn, {
        ccn: row.ccn,
        provider_name: row.provider_name,
        county: row.county,
        county_assignment_method: row.county_assignment_method,
        measures: {},
        source_type: "sourced_cms",
        generated_at: GENERATED_AT,
      });
    }
    const record = byCcn.get(row.ccn);
    if (row.measure_code) {
      record.measures[row.measure_code] = {
        measure_name: row.measure_name,
        score: row.score,
        star_rating: row.star_rating,
        reporting_period: row.reporting_period,
        source_dataset_id: row.source_dataset_id,
      };
    }
  }
  return [...byCcn.values()].sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

function dedupeByIdentifier(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const key = row.ccn || `${row.normalized_name}|${row.zip_code || row.city}`;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function average(rows, field) {
  const values = rows.map((row) => toNumber(row[field])).filter((value) => value != null);
  return values.length ? Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)) : null;
}

function buildBenchmarks({ homeHealth, hhcahps, hhvbp, hospiceQuality, hospiceCahps }) {
  return {
    generated_at: GENERATED_AT,
    source_type: "calculated_from_sourced_cms",
    home_health: {
      maine_provider_count: homeHealth.length,
      avg_quality_star_rating: average(homeHealth, "star_rating"),
      avg_timely_care_pct: average(homeHealth, "timely_care_pct"),
      avg_walking_improve_pct: average(homeHealth, "walking_improve_pct"),
      hhcahps_provider_count: hhcahps.length,
      avg_hhcahps_summary_star: average(hhcahps, "summary_star_rating"),
      avg_hhcahps_recommend_pct: average(hhcahps, "recommend_pct"),
    },
    hhvbp: {
      maine_provider_count: hhvbp.length,
      avg_total_performance_score: average(hhvbp, "total_performance_score"),
    },
    hospice: {
      maine_provider_count: hospiceQuality.length,
      quality_measure_rows: hospiceQuality.reduce((sum, row) => sum + Object.keys(row.measures || {}).length, 0),
      cahps_provider_count: hospiceCahps.length,
    },
  };
}

function buildCountyMarketSeed({ homeHealth, hospiceGeneral, hospiceZip, countyMarket }) {
  const result = {};
  for (const [county, market] of Object.entries(countyMarket)) {
    result[county] = {
      county,
      ffs: market.ffs,
      home_health_users: market.hh.users,
      home_health_provider_count: homeHealth.filter((row) => row.county === county).length || market.hh.prov,
      hospice_users: market.hos.users,
      hospice_provider_count: hospiceGeneral.filter((row) => row.county === county).length || market.hos.prov,
      hospice_zip_records: hospiceZip.filter((row) => row.county === county).length,
      source_type: "sourced_cms_and_seeded_puf",
      generated_at: GENERATED_AT,
    };
  }
  return Object.values(result);
}

function buildSourceStatus(files) {
  return {
    generated_at: GENERATED_AT,
    sources: Object.fromEntries(
      Object.entries(CMS_DATASET_REGISTRY).map(([key, dataset]) => [
        key,
        {
          program: dataset.program,
          name: dataset.name,
          identifier: dataset.identifier,
          metadata_endpoint: dataset.metadataEndpoint,
          data_endpoint: dataset.dataEndpoint,
          purpose: dataset.purpose,
          maine_records: files[key] ?? null,
          status: files[key] == null ? "configured" : "loaded",
        },
      ]),
    ),
    hrsa: {
      cmsApprovedHospices: {
        ...HRSA_DATASETS.cmsApprovedHospices,
        maine_records: files.hrsaMaineHospiceFacilities ?? null,
        status: files.hrsaMaineHospiceFacilities == null ? "configured" : "loaded",
      },
    },
  };
}

function writeJson(name, data) {
  writeFileSync(resolve(OUT_DIR, name), `${JSON.stringify(data, null, 2)}\n`);
  const count = Array.isArray(data) ? data.length : data?.records?.length ?? data?.count ?? null;
  console.log(`  wrote ${name}${count != null ? ` (${count} records)` : ""}`);
}

async function fetchHrsaHospiceFacilities() {
  try {
    const json = await fetchText(HRSA_DATASETS.cmsApprovedHospices.endpoint);
    return (json.features || []).map((feature) => {
      const row = feature.attributes || feature;
      const countyInfo = assignCounty(row);
      return {
        facility_name: row.FACILITY_NM || row.facility_nm || "",
        address: row.CMS_PROVIDER_ADDRESS || row.ADDRESS || row.address || "",
        city: row.CMS_PROVIDER_CITY || row.CITY || row.city || "",
        state: row.CMS_PROVIDER_STATE_ABBR || row.STATE || row.state || "ME",
        zip_code: row.CMS_PROVIDER_ZIP_CD || row.ZIP || row.zip || "",
        cms_provider_number: row.CMS_PROVIDER_NUM || null,
        phone: row.PHONE_NUM || null,
        latitude: toNumber(feature.geometry?.y || row.Y || row.y),
        longitude: toNumber(feature.geometry?.x || row.X || row.x),
        county: countyInfo.county,
        county_assignment_method: countyInfo.countyAssignmentMethod,
        source_dataset_id: "hrsa-cms-approved-facilities-hospices",
        source_type: "sourced_hrsa",
        generated_at: GENERATED_AT,
      };
    }).filter((row) => row.state === "ME" || row.county);
  } catch (err) {
    console.warn(`  HRSA fetch warning: ${err.message}`);
    return [];
  }
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const [x, y] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(x - x1, y - y1);
  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

function roundPoint([lng, lat]) {
  return [Number(lng.toFixed(4)), Number(lat.toFixed(4))];
}

function simplifyRing(points, tolerance = 0.0035) {
  if (points.length <= 6) return points.map(roundPoint);
  const closed = points[0][0] === points.at(-1)[0] && points[0][1] === points.at(-1)[1];
  const work = closed ? points.slice(0, -1) : points;
  function dp(start, end, output) {
    let maxDistance = 0;
    let index = start;
    for (let i = start + 1; i < end; i++) {
      const distance = perpendicularDistance(work[i], work[start], work[end]);
      if (distance > maxDistance) { index = i; maxDistance = distance; }
    }
    if (maxDistance > tolerance) {
      dp(start, index, output);
      output.push(work[index]);
      dp(index, end, output);
    }
  }
  const output = [work[0]];
  dp(0, work.length - 1, output);
  output.push(work[work.length - 1]);
  const rounded = output.map(roundPoint);
  if (closed) rounded.push(rounded[0]);
  return rounded;
}

function simplifyGeometry(geometry) {
  if (geometry.type === "Polygon") return { ...geometry, coordinates: geometry.coordinates.map((ring) => simplifyRing(ring)) };
  if (geometry.type === "MultiPolygon") return { ...geometry, coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => simplifyRing(ring))) };
  return geometry;
}

async function fetchMaineCountyGeoJson() {
  const url = "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/State_County/MapServer/1/query?where=STATE%3D%2723%27&outFields=NAME,GEOID,STATE,COUNTY&outSR=4326&f=geojson";
  const geoJson = await fetchText(url);
  geoJson.features = (geoJson.features || []).map((feature) => ({
    ...feature,
    geometry: simplifyGeometry(feature.geometry),
    properties: {
      ...feature.properties,
      name: feature.properties.NAME,
      fips: feature.properties.GEOID,
      source: "US Census TIGERweb county boundary service",
    },
  })).sort((a, b) => a.properties.name.localeCompare(b.properties.name));
  return geoJson;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log("Refreshing dashboard CMS/HRSA data...");

  const cmsState = [{ property: "state", value: "ME", operator: "=" }];
  const [
    hhRaw,
    hhvbpRaw,
    hospiceGeneralRaw,
    hospiceQualityRaw,
    hospiceCahpsRaw,
    hospiceZipRaw,
    maineCountyGeoJson,
    hrsaFacilities,
  ] = await Promise.all([
    queryCmsDataset(CMS_DATASET_REGISTRY.homeHealthAgencies, cmsState),
    queryCmsDataset(CMS_DATASET_REGISTRY.homeHealthHhvbpAgencyData, cmsState),
    queryCmsDataset(CMS_DATASET_REGISTRY.hospiceGeneralInformation, cmsState),
    queryCmsDataset(CMS_DATASET_REGISTRY.hospiceProviderData, cmsState),
    queryCmsDataset(CMS_DATASET_REGISTRY.hospiceCahpsProviderData, cmsState),
    queryCmsDataset(CMS_DATASET_REGISTRY.hospiceZipData, cmsState),
    fetchMaineCountyGeoJson(),
    fetchHrsaHospiceFacilities(),
  ]);

  const homeHealth = dedupeByIdentifier(hhRaw.map(normalizeHomeHealth));
  const providerByCcn = new Map(homeHealth.map((row) => [row.ccn, row]));
  const hhcahpsRaw = await queryCmsDataset(CMS_DATASET_REGISTRY.homeHealthHhcahpsProvider, []);
  const hhcahps = hhcahpsRaw
    .map((row) => normalizeHhcahps(row, providerByCcn))
    .filter((row) => providerByCcn.has(row.ccn));
  const hhvbp = dedupeByIdentifier(hhvbpRaw.map(normalizeHhvbp));
  const hospiceGeneral = dedupeByIdentifier(hospiceGeneralRaw.map(normalizeHospiceGeneral));
  const hospiceQuality = groupHospiceQuality(hospiceQualityRaw.map(normalizeHospiceMeasure));
  const hospiceCahps = groupHospiceQuality(hospiceCahpsRaw.map(normalizeHospiceMeasure));
  const hospiceZip = hospiceZipRaw.map((row) => ({
    ccn: String(row.cms_certification_number_ccn || "").trim(),
    zip_code: row.zip_code,
    state: row.state || "ME",
    ...assignCounty(row),
    source_dataset_id: CMS_DATASET_REGISTRY.hospiceZipData.identifier,
    source_type: "sourced_cms",
    generated_at: GENERATED_AT,
  }));

  const { default: cmsCountyMarket } = await import("../src/data/cmsCountyMarket.js");
  const countyMarket = buildCountyMarketSeed({ homeHealth, hospiceGeneral, hospiceZip, countyMarket: cmsCountyMarket });
  const benchmarks = buildBenchmarks({ homeHealth, hhcahps, hhvbp, hospiceQuality, hospiceCahps });

  writeJson("maineHomeHealthAgencies.json", homeHealth);
  writeJson("maineHomeHealthQuality.json", homeHealth);
  writeJson("maineHhcaHps.json", hhcahps);
  writeJson("maineHhvbp.json", hhvbp);
  writeJson("maineHospiceProviders.json", hospiceGeneral);
  writeJson("maineHospiceQuality.json", hospiceQuality);
  writeJson("maineHospiceCahps.json", hospiceCahps);
  writeJson("maineHospiceZipData.json", hospiceZip);
  writeJson("maineCountyMarketData.json", countyMarket);
  writeJson("maineBenchmarks.json", benchmarks);
  writeJson("hrsaMaineHospiceFacilities.json", hrsaFacilities);
  writeJson("cmsDataSourceStatus.json", buildSourceStatus({
    homeHealthAgencies: homeHealth.length,
    homeHealthHhcahpsProvider: hhcahps.length,
    homeHealthHhvbpAgencyData: hhvbp.length,
    hospiceGeneralInformation: hospiceGeneral.length,
    hospiceProviderData: hospiceQuality.length,
    hospiceCahpsProviderData: hospiceCahps.length,
    hospiceZipData: hospiceZip.length,
    hrsaMaineHospiceFacilities: hrsaFacilities.length,
  }));
  writeJson("maineCountyBoundaries.json", maineCountyGeoJson);

  console.log("Dashboard data refresh complete.");
}

main().catch((err) => {
  console.error(`Dashboard data refresh failed: ${err.message}`);
  process.exit(1);
});
