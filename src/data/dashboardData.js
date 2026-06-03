import cmsCountyMarket from "./cmsCountyMarket.js";
import cmsMeta from "./cmsMeta.js";
import launchPlan from "./launchPlan.js";
import { namedProviderRows } from "./providers.js";
import dataSourceStatus from "./generated/cmsDataSourceStatus.json" with { type: "json" };
import maineBenchmarks from "./generated/maineBenchmarks.json" with { type: "json" };
import maineCountyMarketData from "./generated/maineCountyMarketData.json" with { type: "json" };
import maineHomeHealthAgencies from "./generated/maineHomeHealthAgencies.json" with { type: "json" };
import maineHomeHealthQuality from "./generated/maineHomeHealthQuality.json" with { type: "json" };
import maineHhcaHps from "./generated/maineHhcaHps.json" with { type: "json" };
import maineHhvbp from "./generated/maineHhvbp.json" with { type: "json" };
import maineHospiceProviders from "./generated/maineHospiceProviders.json" with { type: "json" };
import maineHospiceQuality from "./generated/maineHospiceQuality.json" with { type: "json" };
import maineHospiceCahps from "./generated/maineHospiceCahps.json" with { type: "json" };
import maineHospiceZipData from "./generated/maineHospiceZipData.json" with { type: "json" };
import hrsaMaineHospiceFacilities from "./generated/hrsaMaineHospiceFacilities.json" with { type: "json" };
import { classifyProvider } from "./andwell.js";

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

const homeHealthByCounty = byCounty(maineHomeHealthAgencies);
const hospiceByCounty = byCounty(maineHospiceProviders);
const hospiceQualityByCounty = byCounty(maineHospiceQuality);
const hospiceCahpsByCounty = byCounty(maineHospiceCahps);
const hrsaByCounty = byCounty(hrsaMaineHospiceFacilities);
const hhvbpByCcn = Object.fromEntries(maineHhvbp.filter((row) => row.ccn).map((row) => [row.ccn, row]));

function sourceMarketToFlat(county, sourceMarket) {
  if (!sourceMarket) return null;
  return {
    county,
    ffs: sourceMarket.ffs,
    home_health_users: sourceMarket.hh?.users ?? null,
    home_health_provider_count: sourceMarket.hh?.prov ?? null,
    hospice_users: sourceMarket.hos?.users ?? null,
    hospice_provider_count: sourceMarket.hos?.prov ?? null,
    source_type: "seeded_cms_puf",
    generated_at: cmsMeta.fetchedAt,
  };
}

export function getFreshness() {
  const generatedAt = dashboardData.generatedAt || cmsMeta.fetchedAt || null;
  return {
    generatedAt,
    label: "Data bundled in app",
    reportingPeriod: cmsMeta.datasetYear ? `${cmsMeta.datasetYear} CMS public-use files plus provider-data snapshots` : "CMS/HRSA bundled snapshots",
    recordCount:
      maineHomeHealthAgencies.length +
      maineHhvbp.length +
      maineHospiceProviders.length +
      maineHospiceCahps.length +
      hrsaMaineHospiceFacilities.length,
    maineCountyCount: MAINE_COUNTIES.length,
    sourceConfidence: "CMS/HRSA sourced records with modeled planning outputs clearly labeled.",
  };
}

export function getCountyMarket(county) {
  const generated = maineCountyMarketData.find((row) => row.county === county) || null;
  const source = sourceMarketToFlat(county, cmsCountyMarket[county]);
  const providerCounts = {
    home_health_provider_count: homeHealthByCounty[county]?.length ?? null,
    hospice_provider_count: hospiceByCounty[county]?.length ?? null,
  };
  return {
    ...(source || {}),
    ...(generated || {}),
    county,
    home_health_provider_count: generated?.home_health_provider_count ?? providerCounts.home_health_provider_count ?? source?.home_health_provider_count ?? 0,
    hospice_provider_count: generated?.hospice_provider_count ?? providerCounts.hospice_provider_count ?? source?.hospice_provider_count ?? 0,
    source_type: generated?.source_type || source?.source_type || "unavailable",
    generated_at: generated?.generated_at || source?.generated_at || null,
    missing_note: generated || source ? null : "CMS county market row is not bundled for this county.",
  };
}

export function getAllCountyMarkets() {
  return MAINE_COUNTIES.map(({ name, fips }) => ({ fips, ...getCountyMarket(name) }));
}

export function hhvbpDisplayScore(row) {
  if (!row) return null;
  if (row.total_performance_score != null) return Number(row.total_performance_score);
  const fields = [
    "discharged_to_community_score",
    "avoidable_hospitalizations_score",
    "ed_use_score",
    "care_of_patients_score",
    "communication_score",
    "overall_rating_score",
    "willingness_to_recommend_score",
  ];
  const vals = fields.map((field) => row[field]).filter((value) => value != null).map(Number);
  return vals.length ? vals.reduce((sum, value) => sum + value, 0) / vals.length : null;
}

function bestHospiceMeasure(row) {
  const measures = Object.values(row.measures || {}).filter((measure) => measure.score != null);
  return measures.find((measure) => (measure.measure_name || "").toLowerCase().includes("rated")) || measures[0] || null;
}

export function getCountyQualitySummary(county) {
  const homeHealth = homeHealthByCounty[county] || [];
  const hhvbp = homeHealth.map((agency) => hhvbpByCcn[agency.ccn]).filter(Boolean);
  const hospiceProviders = hospiceByCounty[county] || [];
  const hospiceQuality = hospiceQualityByCounty[county] || [];
  const hospiceCahps = hospiceCahpsByCounty[county] || [];
  const starRows = homeHealth.filter((row) => row.star_rating != null);
  const hhvbpRows = hhvbp.map((row) => ({ ...row, display_score: hhvbpDisplayScore(row) })).filter((row) => row.display_score != null);
  const hospiceScores = hospiceCahps.map((row) => ({ row, measure: bestHospiceMeasure(row) })).filter((item) => item.measure?.score != null);
  const allScores = [
    ...starRows.map((row) => ({ provider: row.provider_name, type: "Home health star rating", score: Number(row.star_rating), source: "CMS 6jpm-sxkc" })),
    ...hhvbpRows.map((row) => ({ provider: row.provider_name, type: "HHVBP composite", score: row.display_score, source: "CMS 56d7-4994" })),
    ...hospiceScores.map(({ row, measure }) => ({ provider: row.provider_name, type: measure.measure_name || "Hospice CAHPS score", score: Number(measure.score), source: "CMS gxki-hrr8" })),
  ].sort((a, b) => b.score - a.score);

  return {
    county,
    homeHealth,
    hhvbp: hhvbpRows,
    hospiceProviders,
    hospiceQuality,
    hospiceCahps,
    avgHomeHealthStar: starRows.length ? starRows.reduce((sum, row) => sum + Number(row.star_rating), 0) / starRows.length : null,
    avgHhvbpScore: hhvbpRows.length ? hhvbpRows.reduce((sum, row) => sum + row.display_score, 0) / hhvbpRows.length : null,
    avgHospiceCahpsScore: hospiceScores.length ? hospiceScores.reduce((sum, item) => sum + Number(item.measure.score), 0) / hospiceScores.length : null,
    bestScore: allScores[0] || null,
    lowestScore: allScores.length ? allScores[allScores.length - 1] : null,
    outliers: allScores.filter((item) => item.score === allScores[0]?.score || item.score === allScores[allScores.length - 1]?.score).slice(0, 4),
    missingNotes: [
      !homeHealth.length ? "No CMS home health agency records assigned to this county." : null,
      !hhvbpRows.length ? "No HHVBP agency records matched to this county by CCN." : null,
      !hospiceCahps.length ? "No CMS hospice CAHPS records assigned to this county." : null,
    ].filter(Boolean),
  };
}

export function getCountyProviderLandscape(county) {
  const providerFileRows = namedProviderRows.filter((row) => row.locationCounty === county);
  const homeHealth = homeHealthByCounty[county] || [];
  const hospiceProviders = hospiceByCounty[county] || [];
  const hrsaFacilities = hrsaByCounty[county] || [];
  const combined = [
    ...providerFileRows.map((row) => ({
      id: `provider-file-${row.service}-${row.providerName}`,
      provider_name: row.providerName,
      provider_type: row.service,
      county: row.locationCounty,
      source_type: "seeded_provider_file",
      beneficiaries: row.beneficiaries,
      provider_file_share: row.providerVolumeShare,
      is_andwell: row.isAndwellCmsRecord,
      ...classifyProvider(row),
    })),
    ...homeHealth.map((row) => ({
      id: `cms-hh-${row.ccn}`,
      provider_name: row.provider_name,
      provider_type: "Home health",
      county: row.county,
      source_type: "sourced_cms",
      ccn: row.ccn,
      address: row.address,
      city: row.city,
      zip_code: row.zip_code,
      ...classifyProvider(row),
    })),
    ...hospiceProviders.map((row) => ({
      id: `cms-hospice-${row.ccn}`,
      provider_name: row.provider_name,
      provider_type: "Hospice",
      county: row.county,
      source_type: "sourced_cms",
      ccn: row.ccn,
      address: row.address,
      city: row.city,
      zip_code: row.zip_code,
      ...classifyProvider(row),
    })),
    ...hrsaFacilities.map((row, index) => ({
      id: `hrsa-hospice-${row.cms_provider_num || index}`,
      provider_name: row.facility_name,
      provider_type: "Hospice facility",
      county: row.county,
      source_type: "sourced_hrsa",
      city: row.city,
      zip_code: row.zip_code,
      ...classifyProvider(row),
    })),
  ];

  const byClassification = combined.reduce((acc, row) => {
    acc[row.classification] = (acc[row.classification] || 0) + 1;
    return acc;
  }, {});

  return {
    county,
    providerFileRows,
    homeHealth,
    hospiceProviders,
    hrsaFacilities,
    combined,
    byClassification,
    counts: {
      all: combined.length,
      homeHealth: homeHealth.length,
      hospice: hospiceProviders.length,
      hrsa: hrsaFacilities.length,
      providerFile: providerFileRows.length,
    },
  };
}

export function getCountyMapMetrics(county, rows = []) {
  const market = getCountyMarket(county);
  const planRows = rows.filter((row) => row.county === county);
  const landscape = getCountyProviderLandscape(county);
  const y1Revenue = planRows.reduce((sum, row) => sum + row.revenue[0], 0);
  const y1Starts = planRows.reduce((sum, row) => sum + row.starts[0], 0);
  const y1Referrals = planRows.reduce((sum, row) => sum + row.referrals[0], 0);
  const demandPool = (market.home_health_users || 0) + (market.hospice_users || 0);
  const providerCount = (market.home_health_provider_count || 0) + (market.hospice_provider_count || 0) || landscape.counts.homeHealth + landscape.counts.hospice;
  const competitionDensity = market.ffs ? Number(((providerCount / market.ffs) * 10000).toFixed(1)) : providerCount;
  const marketPenetration = demandPool ? (y1Starts / demandPool) * 100 : 0;

  return {
    county,
    priority: getCountyPriority(county, rows),
    revenue: y1Revenue,
    starts: y1Starts,
    referrals: y1Referrals,
    demand: demandPool,
    competitionDensity,
    marketPenetration,
    allProviders: providerCount,
    homeHealth: market.home_health_provider_count || landscape.counts.homeHealth,
    hospice: market.hospice_provider_count || landscape.counts.hospice,
    source: market.source_type,
    missingNote: market.missing_note,
  };
}

export function getMapMetricValue(county, mode, rows = []) {
  const metrics = getCountyMapMetrics(county, rows);
  switch (mode) {
    case "revenue": return metrics.revenue;
    case "demand": return metrics.demand;
    case "competition": return metrics.competitionDensity;
    case "penetration": return metrics.marketPenetration;
    case "allProviders": return metrics.allProviders;
    case "homeHealth": return metrics.homeHealth;
    case "hospice": return metrics.hospice;
    default: return 0;
  }
}

export function getReferralSummary(rows = []) {
  const byCounty = [...new Set(rows.map((row) => row.county))].map((county) => {
    const countyRows = rows.filter((row) => row.county === county);
    const starts = countyRows.reduce((sum, row) => sum + row.starts[0], 0);
    const referrals = countyRows.reduce((sum, row) => sum + row.referrals[0], 0);
    const revenue = countyRows.reduce((sum, row) => sum + row.revenue[0], 0);
    return {
      county,
      priority: countyRows[0]?.launchGroup || "Not in plan",
      serviceDriver: countyRows.map((row) => row.service).join(", "),
      starts,
      referrals,
      conversionRate: referrals ? starts / referrals : 0,
      monthlyRunRate: Math.ceil(referrals / 12),
      quarterlyRunRate: Math.ceil(referrals / 4),
      revenue,
      source: "modeled",
    };
  }).sort((a, b) => b.referrals - a.referrals);
  const totals = byCounty.reduce((acc, row) => {
    acc.starts += row.starts;
    acc.referrals += row.referrals;
    acc.revenue += row.revenue;
    return acc;
  }, { starts: 0, referrals: 0, revenue: 0 });
  return { byCounty, totals, conversionRate: totals.referrals ? totals.starts / totals.referrals : 0 };
}

export function getRevenueMix(rows = []) {
  const byService = Object.values(rows.reduce((acc, row) => {
    acc[row.service] ||= { service: row.service, y1: 0, y2: 0, y3: 0, contribution: 0, source: "modeled" };
    acc[row.service].y1 += row.revenue[0];
    acc[row.service].y2 += row.revenue[1];
    acc[row.service].y3 += row.revenue[2];
    acc[row.service].contribution += row.totalContribution || 0;
    return acc;
  }, {}));
  const byCounty = Object.values(rows.reduce((acc, row) => {
    acc[row.county] ||= { county: row.county, priority: row.launchGroup, y1: 0, y2: 0, y3: 0, source: "modeled" };
    acc[row.county].y1 += row.revenue[0];
    acc[row.county].y2 += row.revenue[1];
    acc[row.county].y3 += row.revenue[2];
    return acc;
  }, {})).sort((a, b) => b.y1 - a.y1);
  return { byService, byCounty };
}

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
  const market = getCountyMarket(county);
  const sourceMarket = cmsCountyMarket[county] || null;
  const priority = getCountyPriority(county, rows);
  const quality = getCountyQualitySummary(county);
  const providerLandscape = getCountyProviderLandscape(county);
  const mapMetrics = getCountyMapMetrics(county, rows);
  return {
    county,
    fips: MAINE_COUNTIES.find((item) => item.name === county)?.fips || null,
    priority,
    inPlan: priority !== "Not in plan",
    planRows,
    planSeedRows,
    market,
    sourceMarket,
    providers: providerLandscape.providerFileRows,
    providerLandscape,
    quality,
    mapMetrics,
    homeHealthAgencies: quality.homeHealth,
    hhvbp: quality.hhvbp,
    hospiceProviders: providerLandscape.hospiceProviders,
    hospiceQuality: quality.hospiceQuality,
    hospiceCahps: quality.hospiceCahps,
    hrsaHospiceFacilities: providerLandscape.hrsaFacilities,
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
