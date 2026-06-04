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

function normalizeProviderName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(llc|inc|corp|corporation|company|co|the|dba)\b\.?/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const hospiceProviderByCcn = Object.fromEntries(maineHospiceProviders.filter((row) => row.ccn).map((row) => [row.ccn, row]));
const homeHealthByCcn = Object.fromEntries(maineHomeHealthAgencies.filter((row) => row.ccn).map((row) => [row.ccn, row]));
const hhcahpsByCcn = Object.fromEntries(maineHhcaHps.filter((row) => row.ccn).map((row) => [row.ccn, row]));
const hospiceCahpsByCcn = Object.fromEntries(maineHospiceCahps.filter((row) => row.ccn).map((row) => [row.ccn, row]));
const hospiceQualityByCcn = maineHospiceQuality.reduce((acc, row) => {
  if (!row.ccn) return acc;
  acc[row.ccn] ||= [];
  acc[row.ccn].push(row);
  return acc;
}, {});
const hhvbpByCcn = Object.fromEntries(maineHhvbp.filter((row) => row.ccn).map((row) => [row.ccn, row]));

function assignHrsaCounty(row) {
  const matchedProvider = hospiceProviderByCcn[row.cms_provider_number];
  if (matchedProvider?.county) return { county: matchedProvider.county, method: "cms_ccn_match" };
  const city = String(row.city || "").trim().toUpperCase();
  const cityMap = {
    AUBURN: "Androscoggin",
    BANGOR: "Penobscot",
    BRUNSWICK: "Cumberland",
    LEWISTON: "Androscoggin",
    ROCKPORT: "Knox",
    SACO: "York",
    "SOUTH PORTLAND": "Cumberland",
    WATERVILLE: "Kennebec",
  };
  if (cityMap[city]) return { county: cityMap[city], method: "city_lookup" };
  const zip = String(row.zip_code || "").slice(0, 5);
  if (zip.startsWith("043") || ["04901", "04903", "04917", "04937"].includes(zip)) return { county: "Kennebec", method: "zip_lookup" };
  if (zip.startsWith("041") || zip.startsWith("04011")) return { county: "Cumberland", method: "zip_lookup" };
  if (zip.startsWith("044")) return { county: "Penobscot", method: "zip_lookup" };
  if (zip.startsWith("048")) return { county: "Knox", method: "zip_lookup" };
  if (zip.startsWith("0407")) return { county: "York", method: "zip_lookup" };
  return { county: null, method: "unassigned" };
}

const assignedHrsaFacilities = hrsaMaineHospiceFacilities.map((row) => {
  const assigned = row.county ? { county: row.county, method: row.county_assignment_method || "source_county" } : assignHrsaCounty(row);
  return {
    ...row,
    county: assigned.county,
    county_assignment_method: assigned.method,
  };
});

const homeHealthByCounty = byCounty(maineHomeHealthAgencies);
const hospiceByCounty = byCounty(maineHospiceProviders);
const hospiceQualityByCounty = byCounty(maineHospiceQuality);
const hospiceCahpsByCounty = byCounty(maineHospiceCahps);
const hhcahpsByCounty = byCounty(maineHhcaHps);
const hrsaByCounty = byCounty(assignedHrsaFacilities);

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
  const measures = Object.values(row?.measures || {}).filter((measure) => measure.score != null);
  return measures.find((measure) => (measure.measure_name || "").toLowerCase().includes("rated")) || measures[0] || null;
}

function getHospiceMeasure(row, code) {
  return row?.measures?.[code] || null;
}

function hospiceScore(value) {
  return value == null ? null : Number(value);
}

function hospiceRemainder(top, low, middle) {
  if (middle != null) return hospiceScore(middle);
  if (top == null || low == null) return null;
  return Math.max(0, Number((100 - Number(top) - Number(low)).toFixed(0)));
}

function hospiceTriplet(row, config) {
  const top = hospiceScore(getHospiceMeasure(row, config.codes.top)?.score);
  const low = hospiceScore(getHospiceMeasure(row, config.codes.low)?.score);
  const middle = hospiceRemainder(top, low, getHospiceMeasure(row, config.codes.middle)?.score);
  const reportingPeriod =
    getHospiceMeasure(row, config.codes.top)?.reporting_period ||
    getHospiceMeasure(row, config.codes.middle)?.reporting_period ||
    getHospiceMeasure(row, config.codes.low)?.reporting_period ||
    null;

  if (top == null && middle == null && low == null) return null;

  return {
    id: config.id,
    title: config.title,
    positiveLabel: config.positiveLabel,
    middleLabel: config.middleLabel,
    negativeLabel: config.negativeLabel,
    positiveValue: top,
    middleValue: middle,
    negativeValue: low,
    reportingPeriod,
    explanation: config.explanation,
  };
}

export function getHospiceCahpsSummary(row) {
  if (!row) return null;

  const groups = [
    hospiceTriplet(row, {
      id: "overall_rating",
      title: "Overall hospice rating",
      positiveLabel: "Rated 9 or 10",
      middleLabel: "Rated 7 or 8",
      negativeLabel: "Rated 6 or lower",
      explanation: "Higher 9-10 ratings and lower 6-or-below ratings indicate stronger caregiver experience.",
      codes: { top: "RATING_TBV", middle: "RATING_MBV", low: "RATING_BBV" },
    }),
    hospiceTriplet(row, {
      id: "recommend",
      title: "Would definitely recommend",
      positiveLabel: "Definitely recommend",
      middleLabel: "Probably recommend",
      negativeLabel: "Would not recommend",
      explanation: "This reflects how strongly family caregivers would recommend the hospice to others.",
      codes: { top: "RECOMMEND_TBV", middle: "RECOMMEND_MBV", low: "RECOMMEND_BBV" },
    }),
    hospiceTriplet(row, {
      id: "team_communication",
      title: "Team communication",
      positiveLabel: "Team always communicated well",
      middleLabel: "Usually communicated well",
      negativeLabel: "Sometimes or never communicated well",
      explanation: "Communication scores reflect how consistently families felt informed and heard.",
      codes: { top: "TEAM_COMM_TBV", middle: "TEAM_COMM_MBV", low: "TEAM_COMM_BBV" },
    }),
    hospiceTriplet(row, {
      id: "timely_care",
      title: "Timely care",
      positiveLabel: "Always received timely help",
      middleLabel: "Usually received timely help",
      negativeLabel: "Sometimes or never received timely help",
      explanation: "Higher positive scores suggest the hospice responded quickly when the family needed help.",
      codes: { top: "TIMELY_CARE_TBV", middle: "TIMELY_CARE_MBV", low: "TIMELY_CARE_BBV" },
    }),
    hospiceTriplet(row, {
      id: "symptom_relief",
      title: "Help with symptoms",
      positiveLabel: "Always helped with symptoms",
      middleLabel: "Usually helped with symptoms",
      negativeLabel: "Sometimes or never helped with symptoms",
      explanation: "Symptom relief measures reflect caregiver confidence that pain and symptoms were managed well.",
      codes: { top: "SYMPTOMS_TBV", middle: "SYMPTOMS_MBV", low: "SYMPTOMS_BBV" },
    }),
    hospiceTriplet(row, {
      id: "emotional_support",
      title: "Emotional and spiritual support",
      positiveLabel: "Right amount of support",
      middleLabel: "Mixed response",
      negativeLabel: "Did not receive enough support",
      explanation: "This captures whether families felt the hospice offered the right emotional and spiritual support.",
      codes: { top: "EMO_REL_TBV", middle: "EMO_REL_MBV", low: "EMO_REL_BBV" },
    }),
    hospiceTriplet(row, {
      id: "respect",
      title: "Respect shown to patient and family",
      positiveLabel: "Always treated with respect",
      middleLabel: "Usually treated with respect",
      negativeLabel: "Sometimes or never treated with respect",
      explanation: "Respect scores indicate how often the care team treated the patient and family with dignity.",
      codes: { top: "RESPECT_TBV", middle: "RESPECT_MBV", low: "RESPECT_BBV" },
    }),
  ].filter(Boolean);

  const summaryStarMeasure = getHospiceMeasure(row, "SUMMARY_STAR_RATING");
  const summaryStarRating = hospiceScore(summaryStarMeasure?.star_rating);
  const ratingTopBox = groups.find((group) => group.id === "overall_rating")?.positiveValue ?? null;
  const recommendTopBox = groups.find((group) => group.id === "recommend")?.positiveValue ?? null;
  const timelyCareTopBox = groups.find((group) => group.id === "timely_care")?.positiveValue ?? null;
  const averagePositiveScore = groups.length
    ? groups
      .map((group) => group.positiveValue)
      .filter((value) => value != null)
      .reduce((sum, value, _, values) => sum + value / values.length, 0)
    : null;

  return {
    summaryStarRating,
    ratingTopBox,
    recommendTopBox,
    timelyCareTopBox,
    averagePositiveScore,
    reportingPeriod: summaryStarMeasure?.reporting_period || groups.find((group) => group.reportingPeriod)?.reportingPeriod || null,
    groups,
  };
}

export function getCountyQualitySummary(county) {
  const homeHealth = homeHealthByCounty[county] || [];
  const hhvbp = homeHealth.map((agency) => hhvbpByCcn[agency.ccn]).filter(Boolean);
  const hhcahps = [
    ...homeHealth.map((agency) => hhcahpsByCcn[agency.ccn]).filter(Boolean),
    ...(hhcahpsByCounty[county] || []),
  ].filter((row, index, arr) => row?.ccn && arr.findIndex((candidate) => candidate.ccn === row.ccn) === index);
  const hospiceProviders = hospiceByCounty[county] || [];
  const hospiceQuality = hospiceQualityByCounty[county] || [];
  const hospiceCahps = hospiceCahpsByCounty[county] || [];
  const starRows = homeHealth.filter((row) => row.star_rating != null);
  const hhvbpRows = hhvbp.map((row) => ({ ...row, display_score: hhvbpDisplayScore(row) })).filter((row) => row.display_score != null);
  const hhcahpsRows = hhcahps.filter((row) => row.summary_star_rating != null || row.recommend_pct != null);
  const hospiceScores = hospiceCahps.map((row) => ({ row, measure: bestHospiceMeasure(row) })).filter((item) => item.measure?.score != null);
  const allScores = [
    ...starRows.map((row) => ({ provider: row.provider_name, type: "Home health star rating", score: Number(row.star_rating), source: "CMS 6jpm-sxkc" })),
    ...hhcahpsRows
      .map((row) => ({ provider: row.provider_name, type: "HHCAHPS summary star", score: Number(row.summary_star_rating), source: "CMS ccn4-8vby" }))
      .filter((row) => Number.isFinite(row.score)),
    ...hhvbpRows.map((row) => ({ provider: row.provider_name, type: "HHVBP composite", score: row.display_score, source: "CMS 56d7-4994" })),
    ...hospiceScores.map(({ row, measure }) => ({ provider: row.provider_name, type: measure.measure_name || "Hospice CAHPS score", score: Number(measure.score), source: "CMS gxki-hrr8" })),
  ].sort((a, b) => b.score - a.score);
  const hhcahpsStarRows = hhcahpsRows.filter((row) => row.summary_star_rating != null);
  const hhcahpsRecommendRows = hhcahpsRows.filter((row) => row.recommend_pct != null);

  return {
    county,
    homeHealth,
    hhcahps: hhcahpsRows,
    hhvbp: hhvbpRows,
    hospiceProviders,
    hospiceQuality,
    hospiceCahps,
    avgHomeHealthStar: starRows.length ? starRows.reduce((sum, row) => sum + Number(row.star_rating), 0) / starRows.length : null,
    avgHhcahpsStar: hhcahpsStarRows.length ? hhcahpsStarRows.reduce((sum, row) => sum + Number(row.summary_star_rating), 0) / hhcahpsStarRows.length : null,
    avgHhcahpsRecommend: hhcahpsRecommendRows.length ? hhcahpsRecommendRows.reduce((sum, row) => sum + Number(row.recommend_pct), 0) / hhcahpsRecommendRows.length : null,
    avgHhvbpScore: hhvbpRows.length ? hhvbpRows.reduce((sum, row) => sum + row.display_score, 0) / hhvbpRows.length : null,
    avgHospiceCahpsScore: hospiceScores.length ? hospiceScores.reduce((sum, item) => sum + Number(item.measure.score), 0) / hospiceScores.length : null,
    bestScore: allScores[0] || null,
    lowestScore: allScores.length ? allScores[allScores.length - 1] : null,
    outliers: allScores.filter((item) => item.score === allScores[0]?.score || item.score === allScores[allScores.length - 1]?.score).slice(0, 4),
    missingNotes: [
      !homeHealth.length ? "No CMS home health agency records assigned to this county." : null,
      !hhcahpsRows.length ? "No HHCAHPS records matched to this county by CCN." : null,
      !hhvbpRows.length ? "No HHVBP agency records matched to this county by CCN." : null,
      !hospiceCahps.length ? "No CMS hospice CAHPS records assigned to this county." : null,
    ].filter(Boolean),
  };
}

function hospiceCahpsMeasures(row) {
  return Object.entries(row?.measures || {})
    .map(([measure_code, measure]) => ({ measure_code, ...measure }))
    .filter((measure) => measure.measure_name || measure.score != null);
}

function hhcahpsEvidence(row) {
  if (!row) return null;
  return {
    measure_name: "HHCAHPS survey summary star rating",
    measure_value: row.summary_star_rating,
    recommend_pct: row.recommend_pct,
    reporting_period: row.generated_at,
    state_benchmark: dashboardData.benchmarks.home_health?.avg_hhcahps_summary_star ?? null,
    national_benchmark: null,
    source_dataset_id: row.source_dataset_id || "ccn4-8vby",
    confidence: "high",
  };
}

function hhvbpEvidence(row) {
  if (!row) return null;
  return {
    measure_name: row.total_performance_score != null ? "HHVBP total performance score" : "HHVBP composite from available domain measures",
    measure_value: hhvbpDisplayScore(row),
    reporting_period: row.reporting_period,
    state_benchmark: dashboardData.benchmarks.hhvbp?.avg_total_performance_score ?? null,
    national_benchmark: null,
    source_dataset_id: row.source_dataset_id || "56d7-4994",
    confidence: row.total_performance_score != null ? "high" : "medium",
  };
}

export function getProviderProfileByCcn(ccn) {
  if (!ccn) return null;
  const homeHealth = homeHealthByCcn[ccn] || null;
  const hospice = hospiceProviderByCcn[ccn] || null;
  const hhcahps = hhcahpsByCcn[ccn] || null;
  const hhvbp = hhvbpByCcn[ccn] || null;
  const hospiceCahps = hospiceCahpsByCcn[ccn] || null;
  const hospiceQuality = hospiceQualityByCcn[ccn] || [];
  const hrsa = assignedHrsaFacilities.find((row) => row.cms_provider_number === ccn) || null;
  const base = homeHealth || hospice || hrsa;
  if (!base) return null;
  const providerName = base.provider_name || base.facility_name;
  const providerType = homeHealth && hospice ? "Home health and hospice" : homeHealth ? "Home health" : hospice ? "Hospice" : "Hospice facility";
  const classification = classifyProvider(base);
  const highQualityEvidence = [
    homeHealth?.star_rating != null && Number(homeHealth.star_rating) >= 4 ? `CMS home health quality star ${homeHealth.star_rating}` : null,
    hhcahps?.summary_star_rating != null && Number(hhcahps.summary_star_rating) >= 4 ? `HHCAHPS summary star ${hhcahps.summary_star_rating}` : null,
    hhcahps?.recommend_pct != null && Number(hhcahps.recommend_pct) >= (dashboardData.benchmarks.home_health?.avg_hhcahps_recommend_pct ?? 87) ? `HHCAHPS recommend ${hhcahps.recommend_pct}%` : null,
    hhvbpDisplayScore(hhvbp) != null && hhvbpDisplayScore(hhvbp) >= 85 ? `HHVBP available score ${hhvbpDisplayScore(hhvbp).toFixed(1)}` : null,
    bestHospiceMeasure(hospiceCahps)?.score != null && Number(bestHospiceMeasure(hospiceCahps).score) >= 85 ? `Hospice CAHPS ${bestHospiceMeasure(hospiceCahps).score}` : null,
  ].filter(Boolean);

  return {
    ccn,
    provider_name: providerName,
    provider_type: providerType,
    county: base.county || homeHealth?.county || hospice?.county || hhcahps?.county || hrsa?.county || null,
    address: base.address || hrsa?.address || null,
    city: base.city || hrsa?.city || null,
    state: base.state || "ME",
    zip_code: base.zip_code || hrsa?.zip_code || null,
    certification_date: homeHealth?.certification_date || hospice?.certification_date || null,
    source_labels: [
      homeHealth ? "CMS home health 6jpm-sxkc" : null,
      hhcahps ? "CMS HHCAHPS ccn4-8vby" : null,
      hhvbp ? "CMS HHVBP 56d7-4994" : null,
      hospice ? "CMS hospice yc9t-dgbk" : null,
      hospiceCahps ? "CMS Hospice CAHPS gxki-hrr8" : null,
      hrsa ? "HRSA CMS-approved hospice facility" : null,
    ].filter(Boolean),
    classification: classification.classification,
    classification_confidence: classification.confidence,
    classification_evidence: classification.evidence,
    homeHealth,
    hhcahps,
    hhcahpsEvidence: hhcahpsEvidence(hhcahps),
    hhvbp,
    hhvbpEvidence: hhvbpEvidence(hhvbp),
    hospice,
    hospiceQuality,
    hospiceCahps,
    hospiceCahpsMeasures: hospiceCahpsMeasures(hospiceCahps),
    hospiceCahpsSummary: getHospiceCahpsSummary(hospiceCahps),
    hrsa,
    high_quality: highQualityEvidence.length > 0,
    high_quality_evidence: highQualityEvidence,
    missing_reasons: [
      providerType.includes("Home health") && !hhcahps ? "No HHCAHPS record matched by CCN." : null,
      providerType.includes("Home health") && !hhvbp ? "No HHVBP record matched by CCN." : null,
      providerType.includes("Hospice") && !hospiceCahps ? "No Hospice CAHPS record matched by CCN." : null,
      providerType.includes("Hospice") && !hrsa ? "No HRSA facility record matched by CCN." : null,
    ].filter(Boolean),
  };
}

export function getProviderProfileByName(name) {
  const normalized = normalizeProviderName(name);
  if (!normalized) return null;
  const candidates = [
    ...maineHomeHealthAgencies,
    ...maineHospiceProviders,
    ...assignedHrsaFacilities.map((row) => ({ ...row, provider_name: row.facility_name })),
  ];
  const exact = candidates.find((row) => normalizeProviderName(row.provider_name || row.facility_name) === normalized);
  const fuzzy = exact || candidates.find((row) => {
    const candidate = normalizeProviderName(row.provider_name || row.facility_name);
    return candidate.includes(normalized) || normalized.includes(candidate);
  });
  return fuzzy?.ccn || fuzzy?.cms_provider_number ? getProviderProfileByCcn(fuzzy.ccn || fuzzy.cms_provider_number) : null;
}

export function getProviderIntelligenceRows({ county = null, service = "all", includeAndwell = true } = {}) {
  const rows = namedProviderRows
    .filter((row) => includeAndwell || !row.isAndwellCmsRecord)
    .filter((row) => !county || row.locationCounty === county)
    .filter((row) => {
      if (service === "all") return true;
      if (service === "homehealth") return row.service === "Home Healthcare";
      if (service === "hospice") return row.service === "Hospice";
      return row.service === service;
    })
    .map((row) => {
      const profile = getProviderProfileByName(row.providerName);
      const classification = classifyProvider(row);
      const sourceLabels = profile?.source_labels?.length ? profile.source_labels : ["CMS provider file PUF seed"];
      return {
        id: `${row.service}-${row.providerName}-${row.locationCounty}`,
        provider_name: row.providerName,
        provider_type: row.service === "Home Healthcare" ? "Home health" : row.service,
        county: row.locationCounty,
        ccn: profile?.ccn || null,
        address: profile?.address || null,
        city: profile?.city || null,
        zip_code: profile?.zip_code || null,
        certification_date: profile?.certification_date || null,
        beneficiaries: row.beneficiaries,
        episodes: row.episodes,
        payment: row.payment,
        provider_file_share: row.providerVolumeShare,
        presence_score: Math.round((row.providerVolumeShare || 0) * 1000) / 10,
        share_label: "Modeled provider presence from statewide CMS provider-file volume; not county market share.",
        confidence: profile ? "high" : "medium",
        source_labels: sourceLabels,
        is_andwell: row.isAndwellCmsRecord,
        classification: profile?.classification || classification.classification,
        classification_confidence: profile?.classification_confidence || classification.confidence,
        hhcahps: profile?.hhcahps || null,
        hhcahpsEvidence: profile?.hhcahpsEvidence || null,
        hhvbp: profile?.hhvbp || null,
        hhvbpEvidence: profile?.hhvbpEvidence || null,
        hospiceCahps: profile?.hospiceCahps || null,
        hospiceCahpsMeasures: profile?.hospiceCahpsMeasures || [],
        hrsa: profile?.hrsa || null,
        quality_star_rating: profile?.homeHealth?.star_rating ?? null,
        high_quality: profile?.high_quality || false,
        high_quality_evidence: profile?.high_quality_evidence || [],
        missing_reasons: profile?.missing_reasons || ["No CMS provider profile matched by CCN or normalized name."],
        profile,
      };
    });

  return rows.sort((a, b) => (b.beneficiaries || 0) - (a.beneficiaries || 0));
}

export function getTopProviders({ county = null, service = "all", limit = 8 } = {}) {
  return getProviderIntelligenceRows({ county, service }).slice(0, limit);
}

export function getHighQualityProviders({ service = "all" } = {}) {
  return getProviderIntelligenceRows({ service }).filter((row) => row.high_quality);
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
  hrsaHospiceFacilities: assignedHrsaFacilities,
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
