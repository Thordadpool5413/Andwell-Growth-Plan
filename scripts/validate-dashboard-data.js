import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DEFAULT_SCENARIO, HEATMAP_MODES } from "../src/data/constants.js";
import {
  MAINE_COUNTIES,
  buildDashboardAiContext,
  dashboardData,
  getCountyDashboardRecord,
  getHighQualityProviders,
  getMapMetricValue,
  getProviderProfileByCcn,
  getMapMetricValue,
  getReferralSummary,
  getRevenueMix,
} from "../src/data/dashboardData.js";
import { buildRows } from "../src/utils/calculations.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const rows = buildRows(DEFAULT_SCENARIO);
const boundaries = JSON.parse(readFileSync(path.join(root, "src/data/generated/maineCountyBoundaries.json"), "utf8"));
const boundaryNames = new Set((boundaries.features || []).map((feature) => (feature.properties?.name || feature.properties?.NAME || "").replace(/\s+County$/i, "")));

assert(MAINE_COUNTIES.length === 16, `Expected 16 Maine counties, found ${MAINE_COUNTIES.length}.`);
for (const county of MAINE_COUNTIES) {
  assert(boundaryNames.has(county.name), `Missing county boundary for ${county.name}.`);
  const record = getCountyDashboardRecord(county.name, rows);
  assert(record.county === county.name, `County record mismatch for ${county.name}.`);
  for (const mode of HEATMAP_MODES) {
    if (mode.key === "priority") continue;
    const value = getMapMetricValue(county.name, mode.key, rows);
    assert(Number.isFinite(value), `Map metric ${mode.key} is not numeric for ${county.name}.`);
  }
}

const homeHealthCcns = new Set(dashboardData.homeHealthAgencies.map((row) => row.ccn).filter(Boolean));
const hospiceCcns = new Set(dashboardData.hospiceProviders.map((row) => row.ccn).filter(Boolean));
assert(homeHealthCcns.size === dashboardData.homeHealthAgencies.filter((row) => row.ccn).length, "Duplicate home health CCNs found.");
assert(hospiceCcns.size === dashboardData.hospiceProviders.filter((row) => row.ccn).length, "Duplicate hospice CCNs found.");

const linkedHhvbp = dashboardData.hhvbp.filter((row) => row.ccn && homeHealthCcns.has(row.ccn));
assert(linkedHhvbp.length > 0, "No HHVBP records link to home health agencies by CCN.");
const linkedHhcahps = dashboardData.hhcahps.filter((row) => row.ccn && homeHealthCcns.has(row.ccn));
assert(linkedHhcahps.length > 0, "No HHCAHPS records link to home health agencies by CCN.");
const assignedHrsa = dashboardData.hrsaHospiceFacilities.filter((row) => row.county);
assert(assignedHrsa.length > 0, "No HRSA hospice facilities have a county assignment.");
assert(getProviderProfileByCcn("207019")?.hhcahps, "Andwell provider profile is missing HHCAHPS evidence.");
assert(getHighQualityProviders({ service: "homehealth" }).length > 0, "High quality provider selector returned no home health evidence.");

const referralSummary = getReferralSummary(rows);
assert(referralSummary.totals.referrals > 0, "Referral model produced no Year 1 referrals.");
assert(referralSummary.totals.starts > 0, "Referral model produced no Year 1 starts.");

const revenueMix = getRevenueMix(rows);
assert(revenueMix.byService.length > 0, "Revenue mix by service is empty.");
assert(revenueMix.byCounty.length > 0, "Revenue mix by county is empty.");

const aiContext = buildDashboardAiContext({ rows, selectedCounty: "York" });
assert(aiContext.selected_county?.county === "York", "AI context did not include selected county.");
assert(aiContext.selected_county?.quality, "AI context did not include selected county quality summary.");
assert(aiContext.selected_county?.mapMetrics, "AI context did not include selected county map metrics.");

console.log(JSON.stringify({
  success: true,
  counties: MAINE_COUNTIES.length,
  boundaryCount: boundaryNames.size,
  homeHealthAgencies: dashboardData.homeHealthAgencies.length,
  hospiceProviders: dashboardData.hospiceProviders.length,
  linkedHhvbp: linkedHhvbp.length,
  linkedHhcahps: linkedHhcahps.length,
  assignedHrsa: assignedHrsa.length,
  referralRows: referralSummary.byCounty.length,
  revenueServiceLines: revenueMix.byService.length,
}, null, 2));
