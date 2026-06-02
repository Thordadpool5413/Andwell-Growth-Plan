import services from "../data/services.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import launchPlan from "../data/launchPlan.js";
import { namedProviderRows } from "../data/providers.js";
import { DEFAULT_SCENARIO, STAFFING_RATIOS, SENSITIVITY_VARIABLES, OPPORTUNITY_WEIGHTS } from "../data/constants.js";

const SMART_SCENARIO_BASES = {
  conversionRate: [0.65, 0.7, 0.75, 0.8, 0.85, 0.9],
  hhCapture: [0.08, 0.1, 0.12, 0.14, 0.16],
  woundCapture: [0.18, 0.22, 0.26, 0.3, 0.34],
  therapyCapture: [0.14, 0.18, 0.22, 0.26, 0.3],
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundToStep(value, step = 0.01) {
  return Math.round(value / step) * step;
}

function buildCaptureCurve(base, growthCurve, max) {
  return growthCurve.map((factor) => clamp(roundToStep(base * factor), 0.01, max));
}

function getScenarioTotals(rows) {
  return {
    y1Revenue: rows.reduce((sum, row) => sum + row.revenue[0], 0),
    y2Revenue: rows.reduce((sum, row) => sum + row.revenue[1], 0),
    y3Revenue: rows.reduce((sum, row) => sum + row.revenue[2], 0),
    y1Referrals: rows.reduce((sum, row) => sum + row.referrals[0], 0),
    y1Starts: rows.reduce((sum, row) => sum + row.starts[0], 0),
    totalContribution: rows.reduce((sum, row) => sum + row.totalContribution, 0),
  };
}

function summarizeScenario(scenario) {
  const rows = buildRows(scenario);
  const totals = getScenarioTotals(rows);
  const counties = [...new Set(rows.map((row) => row.county))];
  const countySummaries = counties
    .map((county) => {
      const countyRows = rows.filter((row) => row.county === county);
      const countyRevenue = countyRows.reduce((sum, row) => sum + row.revenue[0], 0);
      const intelligence = getCountyIntelligence(county, rows);
      return {
        county,
        y1Revenue: countyRevenue,
        opportunityScore: intelligence?.opportunityScore?.score || 0,
        threatScore: intelligence?.threat?.score || 0,
      };
    })
    .sort((a, b) => b.y1Revenue - a.y1Revenue);

  const totalY1Revenue = totals.y1Revenue || 1;
  const weightedOpportunityScore = countySummaries.reduce(
    (sum, county) => sum + county.opportunityScore * (county.y1Revenue / totalY1Revenue),
    0,
  );
  const staffing = getStaffingModel(rows);
  const y1Fte = staffing.totalFTE?.[0] || 0;
  const totalRevenue = totals.y1Revenue + totals.y2Revenue + totals.y3Revenue;

  return {
    scenario,
    rows,
    totals,
    topCounty: countySummaries[0] || null,
    weightedOpportunityScore,
    concentrationRisk: countySummaries[0] ? countySummaries[0].y1Revenue / totalY1Revenue : 0,
    y1Fte,
    referralsPerStart: totals.y1Starts > 0 ? totals.y1Referrals / totals.y1Starts : 0,
    contributionMargin: totalRevenue > 0 ? totals.totalContribution / totalRevenue : 0,
  };
}

function normalizeMetric(value, min, max) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function getStrategyLabel(recommended, baseline) {
  const revenueLift = baseline.totals.y1Revenue > 0
    ? (recommended.totals.y1Revenue - baseline.totals.y1Revenue) / baseline.totals.y1Revenue
    : 0;

  if (revenueLift >= 0.12 && recommended.concentrationRisk <= baseline.concentrationRisk + 0.02) {
    return "Balanced growth";
  }
  if (revenueLift >= 0.18) {
    return "Aggressive expansion";
  }
  if (recommended.concentrationRisk < baseline.concentrationRisk || recommended.referralsPerStart < baseline.referralsPerStart) {
    return "Risk-adjusted plan";
  }
  return "Steady optimization";
}

function getPrimaryLever(recommended, baseline) {
  const levers = [
    { label: "Conversion rate", delta: recommended.scenario.conversionRate - baseline.scenario.conversionRate, format: "percent" },
    { label: "HH capture", delta: recommended.scenario.hhCapture[0] - baseline.scenario.hhCapture[0], format: "percent" },
    { label: "Wound capture", delta: recommended.scenario.woundCapture[0] - baseline.scenario.woundCapture[0], format: "percent" },
    { label: "Therapy capture", delta: recommended.scenario.therapyCapture[0] - baseline.scenario.therapyCapture[0], format: "percent" },
  ].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return levers[0];
}

export function areScenariosEqual(left, right) {
  return (
    left.conversionRate === right.conversionRate &&
    JSON.stringify(left.hhCapture) === JSON.stringify(right.hhCapture) &&
    JSON.stringify(left.woundCapture) === JSON.stringify(right.woundCapture) &&
    JSON.stringify(left.therapyCapture) === JSON.stringify(right.therapyCapture) &&
    JSON.stringify(left.marginOverrides || {}) === JSON.stringify(right.marginOverrides || {})
  );
}

export function getSmartScenarioRecommendation(currentScenario = DEFAULT_SCENARIO) {
  const searchSpace = {
    conversionRate: [...new Set([...SMART_SCENARIO_BASES.conversionRate, roundToStep(currentScenario.conversionRate, 0.05)])].sort((a, b) => a - b),
    hhCapture: [...new Set([...SMART_SCENARIO_BASES.hhCapture, roundToStep(currentScenario.hhCapture[0])])].sort((a, b) => a - b),
    woundCapture: [...new Set([...SMART_SCENARIO_BASES.woundCapture, roundToStep(currentScenario.woundCapture[0])])].sort((a, b) => a - b),
    therapyCapture: [...new Set([...SMART_SCENARIO_BASES.therapyCapture, roundToStep(currentScenario.therapyCapture[0])])].sort((a, b) => a - b),
  };

  const candidates = [];

  searchSpace.conversionRate.forEach((conversionRate) => {
    searchSpace.hhCapture.forEach((hhCapture) => {
      searchSpace.woundCapture.forEach((woundCapture) => {
        searchSpace.therapyCapture.forEach((therapyCapture) => {
          const scenario = {
            ...DEFAULT_SCENARIO,
            marginOverrides: currentScenario.marginOverrides || {},
            conversionRate,
            hhCapture: buildCaptureCurve(hhCapture, [1, 1.5, 2], 0.5),
            woundCapture: buildCaptureCurve(woundCapture, [1, 1.35, 1.7], 0.7),
            therapyCapture: buildCaptureCurve(therapyCapture, [1, 1.45, 1.9], 0.6),
          };
          candidates.push(summarizeScenario(scenario));
        });
      });
    });
  });

  const revenueRange = {
    min: Math.min(...candidates.map((candidate) => candidate.totals.y1Revenue)),
    max: Math.max(...candidates.map((candidate) => candidate.totals.y1Revenue)),
  };
  const contributionRange = {
    min: Math.min(...candidates.map((candidate) => candidate.totals.totalContribution)),
    max: Math.max(...candidates.map((candidate) => candidate.totals.totalContribution)),
  };
  const opportunityRange = {
    min: Math.min(...candidates.map((candidate) => candidate.weightedOpportunityScore)),
    max: Math.max(...candidates.map((candidate) => candidate.weightedOpportunityScore)),
  };
  const concentrationRange = {
    min: Math.min(...candidates.map((candidate) => candidate.concentrationRisk)),
    max: Math.max(...candidates.map((candidate) => candidate.concentrationRisk)),
  };
  const staffingRange = {
    min: Math.min(...candidates.map((candidate) => candidate.y1Fte)),
    max: Math.max(...candidates.map((candidate) => candidate.y1Fte)),
  };
  const marginRange = {
    min: Math.min(...candidates.map((candidate) => candidate.contributionMargin)),
    max: Math.max(...candidates.map((candidate) => candidate.contributionMargin)),
  };

  const scoredCandidates = candidates
    .map((candidate) => {
      const revenueScore = normalizeMetric(candidate.totals.y1Revenue, revenueRange.min, revenueRange.max);
      const contributionScore = normalizeMetric(candidate.totals.totalContribution, contributionRange.min, contributionRange.max);
      const opportunityScore = normalizeMetric(candidate.weightedOpportunityScore, opportunityRange.min, opportunityRange.max);
      const concentrationScore = 1 - normalizeMetric(candidate.concentrationRisk, concentrationRange.min, concentrationRange.max);
      const staffingScore = 1 - normalizeMetric(candidate.y1Fte, staffingRange.min, staffingRange.max);
      const marginScore = normalizeMetric(candidate.contributionMargin, marginRange.min, marginRange.max);

      const score =
        revenueScore * 0.34 +
        contributionScore * 0.24 +
        opportunityScore * 0.18 +
        concentrationScore * 0.14 +
        staffingScore * 0.05 +
        marginScore * 0.05;

      return {
        ...candidate,
        optimizerScore: score,
      };
    })
    .sort((a, b) => b.optimizerScore - a.optimizerScore);

  const baseline = summarizeScenario(currentScenario);
  const recommended = scoredCandidates[0];
  const primaryLever = getPrimaryLever(recommended, baseline);
  const strategyLabel = getStrategyLabel(recommended, baseline);
  const y1RevenueDelta = recommended.totals.y1Revenue - baseline.totals.y1Revenue;
  const contributionDelta = recommended.totals.totalContribution - baseline.totals.totalContribution;
  const concentrationDelta = recommended.concentrationRisk - baseline.concentrationRisk;
  const staffingDelta = recommended.y1Fte - baseline.y1Fte;

  const rationale = [
    `${strategyLabel} shifts Year 1 revenue by ${y1RevenueDelta.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, signDisplay: "always" })} and 3-year contribution by ${contributionDelta.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, signDisplay: "always" })}.`,
    `Primary lever: ${primaryLever.label} ${primaryLever.delta >= 0 ? "up" : "down"} ${Math.abs(primaryLever.delta * 100).toFixed(0)} points from the current plan.`,
    concentrationDelta <= 0
      ? `Keeps concentration risk in check at ${(recommended.concentrationRisk * 100).toFixed(1)}% of Year 1 revenue from the top county.`
      : `Accepts a modest concentration increase to ${(recommended.concentrationRisk * 100).toFixed(1)}% while staffing stays at ${recommended.y1Fte} Year 1 FTEs.`,
  ];

  return {
    recommendedScenario: recommended.scenario,
    strategyLabel,
    baseline,
    recommended,
    alternatives: scoredCandidates.slice(1, 3),
    deltas: {
      y1Revenue: y1RevenueDelta,
      totalContribution: contributionDelta,
      concentrationRisk: concentrationDelta,
      y1Fte: staffingDelta,
    },
    rationale,
  };
}

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
  const opportunityScore = getOpportunityScore(county, rows);
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
    opportunityScore,
    providerDensityHH,
    providerDensityHos,
    hhUtilization,
    ffs: market.ffs,
  };
}

export function getStaffingModel(rows) {
  const byService = {};
  Object.entries(STAFFING_RATIOS).forEach(([service, ratio]) => {
    const serviceRows = rows.filter((r) => r.service === service);
    const y1Starts = serviceRows.reduce((s, r) => s + r.starts[0], 0);
    const y2Starts = serviceRows.reduce((s, r) => s + r.starts[1], 0);
    const y3Starts = serviceRows.reduce((s, r) => s + r.starts[2], 0);
    const y1FTE = Math.ceil(y1Starts / ratio.patientsPerFTE);
    const y2FTE = Math.ceil(y2Starts / ratio.patientsPerFTE);
    const y3FTE = Math.ceil(y3Starts / ratio.patientsPerFTE);
    byService[service] = {
      role: ratio.role,
      patientsPerFTE: ratio.patientsPerFTE,
      avgSalary: ratio.avgSalary,
      y1: { starts: y1Starts, fte: y1FTE, cost: y1FTE * ratio.avgSalary, costPerStart: y1Starts > 0 ? Math.round((y1FTE * ratio.avgSalary) / y1Starts) : 0 },
      y2: { starts: y2Starts, fte: y2FTE, cost: y2FTE * ratio.avgSalary, costPerStart: y2Starts > 0 ? Math.round((y2FTE * ratio.avgSalary) / y2Starts) : 0 },
      y3: { starts: y3Starts, fte: y3FTE, cost: y3FTE * ratio.avgSalary, costPerStart: y3Starts > 0 ? Math.round((y3FTE * ratio.avgSalary) / y3Starts) : 0 },
    };
  });

  const byCounty = {};
  const counties = [...new Set(rows.map((r) => r.county))];
  counties.forEach((county) => {
    const countyRows = rows.filter((r) => r.county === county);
    const ftes = [0, 1, 2].map((yi) => {
      let total = 0;
      countyRows.forEach((r) => {
        const ratio = STAFFING_RATIOS[r.service];
        if (ratio) total += Math.ceil(r.starts[yi] / ratio.patientsPerFTE);
      });
      return total;
    });
    byCounty[county] = { y1: ftes[0], y2: ftes[1], y3: ftes[2] };
  });

  const totalFTE = [0, 1, 2].map((yi) =>
    Object.values(byService).reduce((s, svc) => s + [svc.y1, svc.y2, svc.y3][yi].fte, 0),
  );
  const totalCost = [0, 1, 2].map((yi) =>
    Object.values(byService).reduce((s, svc) => s + [svc.y1, svc.y2, svc.y3][yi].cost, 0),
  );

  return { byService, byCounty, totalFTE, totalCost };
}

export function getSensitivityAnalysis(rows) {
  const baseRevenue = rows.reduce((s, r) => s + r.revenue[0], 0);

  return SENSITIVITY_VARIABLES.map((variable) => {
    const buildScenario = (overrideValue) => {
      const s = { ...DEFAULT_SCENARIO };
      switch (variable.key) {
        case "conversionRate": s.conversionRate = overrideValue; break;
        case "hhCapture": s.hhCapture = [overrideValue, overrideValue * 1.5, overrideValue * 2]; break;
        case "woundCapture": s.woundCapture = [overrideValue, overrideValue * 1.4, overrideValue * 1.8]; break;
        case "therapyCapture": s.therapyCapture = [overrideValue, overrideValue * 1.5, overrideValue * 2]; break;
        case "hhReimbursement": {
          const adjusted = launchPlan.map((row) => {
            if (row.service === "Home Healthcare") return { ...row, _reimbOverride: overrideValue };
            return row;
          });
          const lowRows = adjusted.map((row) => {
            const result = getCountyMath(row, s);
            if (row._reimbOverride) {
              const starts = result.starts;
              const revenue = starts.map((st) => st * overrideValue);
              return { ...result, revenue, totalRevenue: revenue.reduce((a, b) => a + b, 0) };
            }
            return result;
          });
          return lowRows.reduce((sum, r) => sum + r.revenue[0], 0);
        }
        case "woundReimbursement": {
          const adjusted2 = launchPlan.map((row) => {
            if (row.service === "Mobile Wound") return { ...row, _reimbOverride: overrideValue };
            return row;
          });
          const lowRows2 = adjusted2.map((row) => {
            const result = getCountyMath(row, s);
            if (row._reimbOverride) {
              const starts = result.starts;
              const revenue = starts.map((st) => st * overrideValue);
              return { ...result, revenue, totalRevenue: revenue.reduce((a, b) => a + b, 0) };
            }
            return result;
          });
          return lowRows2.reduce((sum, r) => sum + r.revenue[0], 0);
        }
        default: break;
      }
      if (variable.key === "hhReimbursement" || variable.key === "woundReimbursement") return 0;
      const newRows = buildRows(s);
      return newRows.reduce((sum, r) => sum + r.revenue[0], 0);
    };

    const lowRevenue = buildScenario(variable.low);
    const highRevenue = buildScenario(variable.high);

    return {
      ...variable,
      baseRevenue,
      lowRevenue,
      highRevenue,
      lowDelta: lowRevenue - baseRevenue,
      highDelta: highRevenue - baseRevenue,
      range: highRevenue - lowRevenue,
    };
  }).sort((a, b) => b.range - a.range);
}

export function getOpportunityScore(county, rows) {
  const market = cmsCountyMarket[county];
  if (!market) return null;

  const allMarkets = Object.values(cmsCountyMarket);
  const maxMarket = Math.max(...allMarkets.map((m) => m.hh.users + m.hos.users));
  const marketSize = (market.hh.users + market.hos.users) / maxMarket;

  const threat = getCompetitiveThreatScore(county);
  const lowCompetition = threat ? 1 - threat.score / 100 : 0.5;

  const countyRows = rows.filter((r) => r.county === county);
  const currentServices = countyRows.length > 0 ? countyRows[0].current.split(",").length : 0;
  const maxServices = 8;
  const andwellPresence = Math.min(currentServices / maxServices, 1);

  const maxFFS = Math.max(...allMarkets.map((m) => m.ffs));
  const y1Revenue = countyRows.reduce((s, r) => s + r.revenue[0], 0);
  const revenueEfficiency = maxFFS > 0 ? Math.min((y1Revenue / market.ffs) / (rows.reduce((s, r) => s + r.revenue[0], 0) / Object.values(cmsCountyMarket).reduce((s, m) => s + m.ffs, 0)), 2) / 2 : 0;

  const y3Revenue = countyRows.reduce((s, r) => s + r.revenue[2], 0);
  const growthPotential = y1Revenue > 0 ? Math.min((y3Revenue - y1Revenue) / y1Revenue, 2) / 2 : 0;

  const raw =
    marketSize * OPPORTUNITY_WEIGHTS.marketSize +
    lowCompetition * OPPORTUNITY_WEIGHTS.lowCompetition +
    andwellPresence * OPPORTUNITY_WEIGHTS.andwellPresence +
    revenueEfficiency * OPPORTUNITY_WEIGHTS.revenueEfficiency +
    growthPotential * OPPORTUNITY_WEIGHTS.growthPotential;

  const score = Math.round(raw * 100);

  let tier = "Watch";
  if (score >= 80) tier = "Prime";
  else if (score >= 60) tier = "Strong";
  else if (score >= 40) tier = "Developing";

  const factors = [
    { name: "Market size", value: Math.round(marketSize * 100), weight: OPPORTUNITY_WEIGHTS.marketSize, direction: marketSize > 0.5 ? "up" : "down" },
    { name: "Low competition", value: Math.round(lowCompetition * 100), weight: OPPORTUNITY_WEIGHTS.lowCompetition, direction: lowCompetition > 0.5 ? "up" : "down" },
    { name: "Andwell presence", value: Math.round(andwellPresence * 100), weight: OPPORTUNITY_WEIGHTS.andwellPresence, direction: andwellPresence > 0.5 ? "up" : "down" },
    { name: "Revenue efficiency", value: Math.round(revenueEfficiency * 100), weight: OPPORTUNITY_WEIGHTS.revenueEfficiency, direction: revenueEfficiency > 0.5 ? "up" : "down" },
    { name: "Growth potential", value: Math.round(growthPotential * 100), weight: OPPORTUNITY_WEIGHTS.growthPotential, direction: growthPotential > 0.5 ? "up" : "down" },
  ];

  return { county, score, tier, factors, y1Revenue, y3Revenue, marketUsers: market.hh.users + market.hos.users, threatScore: threat?.score || 0 };
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
