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
