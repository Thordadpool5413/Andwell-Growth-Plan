import services from "../data/services.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import launchPlan from "../data/launchPlan.js";
import { namedProviderRows } from "../data/providers.js";
import { DEFAULT_SCENARIO } from "../data/constants.js";

export function getCountyMath(row, scenario = DEFAULT_SCENARIO) {
  const meta = services[row.service];
  const market = cmsCountyMarket[row.county];
  const conversionRate = scenario.conversionRate;
  const marginOverride = scenario.marginOverrides[row.service];
  const margin = marginOverride !== undefined ? marginOverride : meta.margin;

  let demandPool = row.age65 * meta.demandRate;
  let reimbursement = meta.reimbursement;
  let basis = "Planning proxy";

  if (market && row.service === "Home Healthcare") {
    demandPool = market.hh.users;
    reimbursement = market.hh.ppu;
    basis = "CMS direct HH market";
  }
  if (market && row.service === "Mobile Wound") {
    demandPool = Math.round(market.hh.users * 0.2);
    basis = "CMS HH wound proxy";
  }
  if (market && row.service === "Therapy Care") {
    demandPool = Math.round(market.hh.users * 0.4);
    basis = "CMS HH therapy proxy";
  }

  const capture =
    row.service === "Home Healthcare"
      ? scenario.hhCapture
      : row.service === "Mobile Wound"
        ? scenario.woundCapture
        : scenario.therapyCapture;

  const starts = capture.map((rate) => Math.round(demandPool * rate));
  const referrals = starts.map((value) => Math.ceil(value / conversionRate));
  const revenue = starts.map((value) => value * reimbursement);

  return {
    ...row,
    meta: { ...meta, margin },
    market,
    basis,
    demandPool,
    reimbursement,
    starts,
    referrals,
    revenue,
    totalStarts: starts.reduce((a, b) => a + b, 0),
    totalReferrals: referrals.reduce((a, b) => a + b, 0),
    totalRevenue: revenue.reduce((a, b) => a + b, 0),
    totalContribution: revenue.reduce((a, b) => a + Math.round(b * margin), 0),
  };
}

export function buildRows(scenario = DEFAULT_SCENARIO) {
  return launchPlan.map((row) => getCountyMath(row, scenario));
}

export function rollupByService(rows) {
  return Object.keys(services)
    .map((service) => {
      const group = rows.filter((row) => row.service === service);
      return {
        service,
        starts: group.reduce((sum, row) => sum + row.starts[0], 0),
        revenue: group.reduce((sum, row) => sum + row.revenue[0], 0),
        color: services[service].color,
      };
    })
    .filter((row) => row.starts > 0);
}

export function getProviderSummary(service) {
  const rows = namedProviderRows.filter((provider) => provider.service === service);
  const ranked = [...rows].sort((a, b) => b.beneficiaries - a.beneficiaries);
  const andwell = ranked.find((provider) => provider.isAndwellCmsRecord);
  return {
    service,
    providers: rows.length,
    beneficiaries: rows.reduce((sum, row) => sum + row.beneficiaries, 0),
    payment: rows.reduce((sum, row) => sum + row.payment, 0),
    andwellShare: andwell?.providerVolumeShare || 0,
    andwellRank: andwell ? ranked.findIndex((row) => row.isAndwellCmsRecord) + 1 : null,
  };
}

const NATIONAL_CHAINS = [
  "amedisys", "centerwell", "gentiva", "kindred", "compassus",
  "elara", "constellation", "enhabit", "lhc group", "bayada",
];

export function getCompetitiveThreatScore(county) {
  const market = cmsCountyMarket[county];
  if (!market) return null;

  const hhProviders = namedProviderRows.filter(
    (p) => p.service === "Home Healthcare" && p.locationCounty === county && !p.isAndwellCmsRecord,
  );
  const hosProviders = namedProviderRows.filter(
    (p) => p.service === "Hospice" && p.locationCounty === county && !p.isAndwellCmsRecord,
  );
  const allCompetitors = [...hhProviders, ...hosProviders];

  const competitorCount = allCompetitors.length;
  const totalBeneficiaries = allCompetitors.reduce((s, p) => s + p.beneficiaries, 0);
  const totalShare = allCompetitors.reduce((s, p) => s + p.providerVolumeShare, 0);
  const hasNationalChain = allCompetitors.some((p) =>
    NATIONAL_CHAINS.some((chain) => p.providerName.toLowerCase().includes(chain)),
  );
  const providerDensity = (market.hh.prov + market.hos.prov) / (market.ffs / 10000);

  const countScore = Math.min(competitorCount / 8, 1) * 25;
  const shareScore = Math.min(totalShare / 0.6, 1) * 30;
  const nationalScore = hasNationalChain ? 20 : 0;
  const densityScore = Math.min(providerDensity / 8, 1) * 25;

  const raw = countScore + shareScore + nationalScore + densityScore;
  const score = Math.round(raw);

  let level = "Low";
  if (score >= 70) level = "Fortress";
  else if (score >= 50) level = "High";
  else if (score >= 30) level = "Moderate";

  return {
    county,
    score,
    level,
    competitorCount,
    totalBeneficiaries,
    totalShare,
    hasNationalChain,
    providerDensity: Math.round(providerDensity * 10) / 10,
  };
}

export function getMarketPenetration(county, rows) {
  const market = cmsCountyMarket[county];
  if (!market) return null;

  const countyRows = rows.filter((r) => r.county === county);
  const y1Starts = countyRows.reduce((s, r) => s + r.starts[0], 0);
  const y3Starts = countyRows.reduce((s, r) => s + r.starts[2], 0);
  const totalMarket = market.hh.users + market.hos.users;

  return {
    county,
    y1Penetration: totalMarket > 0 ? y1Starts / totalMarket : 0,
    y3Penetration: totalMarket > 0 ? y3Starts / totalMarket : 0,
    totalMarket,
    y1Starts,
    y3Starts,
    revenuePerBeneficiary: market.ffs > 0
      ? Math.round(countyRows.reduce((s, r) => s + r.revenue[0], 0) / market.ffs)
      : 0,
  };
}

export function getCountyIntelligence(county, rows) {
  const threat = getCompetitiveThreatScore(county);
  const penetration = getMarketPenetration(county, rows);
  const market = cmsCountyMarket[county];

  if (!market) return null;

  const providerDensityHH = market.ffs > 0
    ? Math.round((market.hh.prov / (market.ffs / 10000)) * 10) / 10
    : 0;
  const providerDensityHos = market.ffs > 0
    ? Math.round((market.hos.prov / (market.ffs / 10000)) * 10) / 10
    : 0;
  const hhUtilization = market.hh.rate;

  return {
    county,
    threat,
    penetration,
    providerDensityHH,
    providerDensityHos,
    hhUtilization,
    ffs: market.ffs,
  };
}

export function getHeatmapValue(county, mode, rows) {
  const market = cmsCountyMarket[county];
  if (!market) return 0;

  const countyRows = rows.filter((r) => r.county === county);

  switch (mode) {
    case "revenue":
      return countyRows.reduce((s, r) => s + r.revenue[0], 0);
    case "demand":
      return market.hh.users + market.hos.users;
    case "competition": {
      const threat = getCompetitiveThreatScore(county);
      return threat ? threat.score : 0;
    }
    case "penetration": {
      const pen = getMarketPenetration(county, rows);
      return pen ? pen.y1Penetration * 100 : 0;
    }
    default:
      return 0;
  }
}
