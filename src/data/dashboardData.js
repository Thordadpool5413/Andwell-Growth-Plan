import cmsCountyMarket from "./cmsCountyMarket.js";
import cmsMeta from "./cmsMeta.js";
import launchPlan from "./launchPlan.js";
import { namedProviderRows } from "./providers.js";
import dataSourceStatus from "./generated/cmsDataSourceStatus.json";
import maineBenchmarks from "./generated/maineBenchmarks.json";
import maineCountyMarketData from "./generated/maineCountyMarketData.json";
import maineHomeHealthAgencies from "./generated/maineHomeHealthAgencies.json";
import maineHomeHealthQuality from "./generated/maineHomeHealthQuality.json";
import maineHhcaHps from "./generated/maineHhcaHps.json";
import maineHhvbp from "./generated/maineHhvbp.json";
import maineHospiceProviders from "./generated/maineHospiceProviders.json";
import maineHospiceQuality from "./generated/maineHospiceQuality.json";
import maineHospiceCahps from "./generated/maineHospiceCahps.json";
import maineHospiceZipData from "./generated/maineHospiceZipData.json";
import hrsaMaineHospiceFacilities from "./generated/hrsaMaineHospiceFacilities.json";

export const MAINE_COUNTIES = [
  { name: "Androscoggin", fips: "23001" },
  { name: "Aroostook", fips: "23003" },
  { name: "Cumberland", fips: "23005" },
  { name: "Franklin", fips: "23007" },
  { name: "Hancock", fips: "23009" },
  { name: "Kennebec", fips: "23011" },
  { name: "Knox", fips: "23013" },
  { name: "Lincoln", fips: "23015" },
  { name: "Oxford", fips: "23017" },
  { name: "Penobscot", fips: "23019" },
  { name: "Piscataquis", fips: "23021" },
  { name: "Sagadahoc", fips: "23023" },
  { name: "Somerset", fips: "23025" },
  { name: "Waldo", fips: "23027" },
  { name: "Washington", fips: "23029" },
  { name: "York", fips: "23031" },
];

const byCounty = (rows) => rows.reduce((acc, row) => {
  if (!row.county) return acc;
  acc[row.county] ||= [];
  acc[row.county].push(row);
  return acc;
}, {});

export const dashboardData = {
  generatedAt: dataSourceStatus.generated_at,
  cmsMeta,
  dataSourceStatus,
  benchmarks: maineBenchmarks,
  counties: MAINE_COUNTIES,
  countyMarket: maineCountyMarketData,
  rawCountyMarket: cmsCountyMarket,
  launchPlan,
  providers: namedProviderRows,
  homeHealthAgencies: maineHomeHealthAgencies,
  homeHealthQuality: maineHomeHealthQuality,
  hhcahps: maineHhcaHps,
  hhvbp: maineHhvbp,
  hospiceProviders: maineHospiceProviders,
  hospiceQuality: maineHospiceQuality,
  hospiceCahps: maineHospiceCahps,
  hospiceZipData: maineHospiceZipData,
  hrsaHospiceFacilities: hrsaMaineHospiceFacilities,
};

export function getCountyPriority(county, rows = []) {
  const row = rows.find((item) => item.county === county) || launchPlan.find((item) => item.county === county);
  return row?.launchGroup || "Not in plan";
}

export function getCountyDashboardRecord(county, rows = []) {
  const planRows = rows.filter((row) => row.county === county);
  const planSeedRows = launchPlan.filter((row) => row.county === county);
  const market = maineCountyMarketData.find((row) => row.county === county) || null;
  const sourceMarket = cmsCountyMarket[county] || null;
  const priority = getCountyPriority(county, rows);
  return {
    county,
    fips: MAINE_COUNTIES.find((item) => item.name === county)?.fips || null,
    priority,
    inPlan: priority !== "Not in plan",
    planRows,
    planSeedRows,
    market,
    sourceMarket,
    providers: namedProviderRows.filter((row) => row.locationCounty === county),
    homeHealthAgencies: byCounty(maineHomeHealthAgencies)[county] || [],
    hhvbp: byCounty(maineHhvbp)[county] || [],
    hospiceProviders: byCounty(maineHospiceProviders)[county] || [],
    hospiceQuality: byCounty(maineHospiceQuality)[county] || [],
    hospiceCahps: byCounty(maineHospiceCahps)[county] || [],
    hrsaHospiceFacilities: byCounty(hrsaMaineHospiceFacilities)[county] || [],
  };
}

export function buildDashboardAiContext({ rows = [], totals = {}, selectedCounty = "York" } = {}) {
  const selected = getCountyDashboardRecord(selectedCounty, rows);
  const counties = MAINE_COUNTIES.map(({ name }) => {
    const record = getCountyDashboardRecord(name, rows);
    const planRows = record.planRows;
    return {
      county: name,
      priority: record.priority,
      fips: record.fips,
      cms_market: record.market ? {
        ffs: record.market.ffs,
        home_health_users: record.market.home_health_users,
        hospice_users: record.market.hospice_users,
        home_health_provider_count: record.market.home_health_provider_count,
        hospice_provider_count: record.market.hospice_provider_count,
      } : null,
      modeled_plan: planRows.length ? {
        services: planRows.map((row) => row.service),
        y1_revenue: planRows.reduce((sum, row) => sum + row.revenue[0], 0),
        y1_starts: planRows.reduce((sum, row) => sum + row.starts[0], 0),
        y1_referrals: planRows.reduce((sum, row) => sum + row.referrals[0], 0),
      } : null,
      sourced_provider_counts: {
        home_health_agencies: record.homeHealthAgencies.length,
        hospice_providers: record.hospiceProviders.length,
        hrsa_hospice_facilities: record.hrsaHospiceFacilities.length,
      },
    };
  });

  return {
    provenance_rules: [
      "CMS and HRSA records are sourced public data.",
      "County launch priority, referral goals, starts, and revenue are modeled planning outputs.",
      "Provider file share is not true county market share.",
      "If a requested field is not present in this context, state that it is unavailable.",
    ],
    selected_county: selected,
    totals,
    benchmarks: maineBenchmarks,
    counties,
    data_sources: dataSourceStatus,
  };
}

export default dashboardData;
