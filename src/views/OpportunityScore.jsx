import React, { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Abbr from "../components/Abbr.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import MethodologyCallout from "../components/MethodologyCallout.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getOpportunityScore } from "../utils/calculations.js";
import { getCountyDashboardRecord, getFreshness, getReferralSummary } from "../data/dashboardData.js";
import { currency, number } from "../utils/formatters.js";

const GROUP_FILTERS = ["All", "Priority 1", "Priority 2", "Priority 3"];

function FilterChip({ label, active, onClick, dark }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors duration-100 ${
        active
          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
          : dark
            ? "border-slate-600 bg-slate-800 text-slate-200 hover:border-slate-500 hover:bg-slate-700"
            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function OpportunityScore({ rows }) {
  const { dark } = useDarkMode();
  const freshness = getFreshness();
  const [groupFilter, setGroupFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const referralSummary = getReferralSummary(rows);
  const referralByCounty = Object.fromEntries(referralSummary.byCounty.map((row) => [row.county, row]));

  const scoredRows = useMemo(() => {
    const counties = [...new Set(rows.map((row) => row.county))];
    return counties
      .map((county) => {
        const score = getOpportunityScore(county, rows);
        if (!score) return null;
        const countyRows = rows.filter((row) => row.county === county);
        const record = getCountyDashboardRecord(county, rows);
        const referral = referralByCounty[county] || {};
        const primaryDriver = [...score.factors].sort((a, b) => b.value - a.value)[0];
        return {
          ...score,
          launchGroup: countyRows[0]?.launchGroup || "Not in plan",
          primaryDriver: primaryDriver?.name || "Modeled opportunity",
          priorityStatus: countyRows[0]?.launchGroup || "Not in plan",
          referralOpportunity: referral.referrals || 0,
          providerContext: `${record.providerLandscape.counts.homeHealth} HH · ${record.providerLandscape.counts.hospice} hospice`,
          marketPenetration: record.mapMetrics.marketPenetration || 0,
          competitionDensity: record.mapMetrics.competitionDensity || 0,
          sourceLabel: "Calculated from CMS/HRSA source data and modeled planning outputs",
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  }, [rows, referralByCounty]);

  const visibleRows = scoredRows.filter((row) => {
    const groupOk = groupFilter === "All" || row.launchGroup === groupFilter;
    return groupOk && row.score >= minScore;
  });
  const avgScore = scoredRows.length ? Math.round(scoredRows.reduce((sum, row) => sum + row.score, 0) / scoredRows.length) : 0;
  const topCounty = scoredRows[0];
  const filteredY1 = visibleRows.reduce((sum, row) => sum + row.y1Revenue, 0);
  const filteredReferrals = visibleRows.reduce((sum, row) => sum + row.referralOpportunity, 0);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Opportunity scoring" title="County opportunity ranking by launch group">
        Composite scores connect CMS market size, competition, Andwell presence, revenue efficiency, and growth potential. Use this page to compare counties, not as a CMS-reported quality score.
      </SectionHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={freshness.generatedAt} label="CMS/HRSA data" syncType="Bundled source registry" />
      </div>

      <MethodologyCallout title="How is this calculated?">
        <p className={`mb-3 ${dark ? "text-slate-200" : "text-slate-700"}`}>
          Each county receives a composite score from five factor groups. Higher scores indicate stronger modeled opportunity relative to the current county set.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Market size", weight: "25%", desc: "CMS FFS beneficiary volume." },
            { name: "Low competition", weight: "20%", desc: "Inverse of competitive threat." },
            { name: "Andwell presence", weight: "15%", desc: "Current provider footprint and modeled entry advantage." },
            { name: "Revenue efficiency", weight: "20%", desc: "Modeled Y1 revenue dollars per FFS beneficiary within the target-county plan." },
            { name: "Growth potential", weight: "20%", desc: "Y1 to Y3 modeled revenue ramp." },
          ].map((factor) => (
            <div key={factor.name} className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>{factor.name}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${dark ? "bg-blue-900/60 text-blue-200" : "bg-blue-100 text-blue-700"}`}>{factor.weight}</span>
              </div>
              <p className={`mt-1 text-[11px] leading-4 ${dark ? "text-slate-300" : "text-slate-600"}`}>{factor.desc}</p>
            </div>
          ))}
        </div>
      </MethodologyCallout>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Average opportunity score" value={`${avgScore}/100`} detail="Mean score across launch counties." color="emerald" sourceType="derived" />
        <Metric label="Top county" value={topCounty?.county || "-"} detail={`Composite score ${topCounty?.score || 0}/100.`} color="blue" sourceType="derived" />
        <Metric label="Filtered Y1 revenue" value={currency(filteredY1)} detail="Modeled revenue for visible counties." color="indigo" sourceType="modeled" />
        <Metric label="Filtered Y1 referrals" value={number(filteredReferrals)} detail="Gross referrals for visible counties." color="amber" sourceType="modeled" />
      </div>

      <Card title="County opportunity leaderboard" eyebrow="Ranked by composite score">
        <div className="space-y-4">
          <div className={`rounded-lg border p-4 space-y-3 ${dark ? "border-slate-700/60 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-600"}`}>Launch group</span>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_FILTERS.map((group) => (
                  <FilterChip key={group} label={group} active={groupFilter === group} onClick={() => setGroupFilter(group)} dark={dark} />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-semibold uppercase tracking-wide flex-shrink-0 ${dark ? "text-slate-300" : "text-slate-600"}`}>Minimum score</span>
              <input type="range" min={0} max={100} value={minScore} onChange={(event) => setMinScore(Number(event.target.value))} className="h-1.5 min-w-[220px] flex-1 cursor-pointer accent-blue-500" />
              <span className={`text-xs font-semibold tabular-nums ${dark ? "text-slate-200" : "text-slate-700"}`}>{minScore}/100</span>
              {minScore > 0 && <button onClick={() => setMinScore(0)} className="text-xs font-semibold text-blue-600 hover:underline">Clear</button>}
            </div>
            <p className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
              Showing <span className="font-semibold">{visibleRows.length}</span> of <span className="font-semibold">{scoredRows.length}</span> counties.
            </p>
          </div>

          {visibleRows.length === 0 ? (
            <div className={`rounded-xl border p-10 text-center ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-white"}`}>
              <p className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>No counties match the selected filters.</p>
              <button onClick={() => { setGroupFilter("All"); setMinScore(0); }} className="mt-3 text-xs font-semibold text-blue-600 hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">Launch group</th>
                    <th className="px-4 py-3">Primary driver</th>
                    <th className="px-4 py-3 text-right">Score</th>
                    <th className="px-4 py-3 text-right">Revenue</th>
                    <th className="px-4 py-3 text-right">Referrals</th>
                    <th className="px-4 py-3">Provider context</th>
                    <th className="px-4 py-3 text-right">Penetration</th>
                    <th className="px-4 py-3 text-right">Density</th>
                    <th className="px-4 py-3">Source</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
                  {visibleRows.map((county, index) => (
                    <tr key={county.county} className={dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"}>
                      <td className="px-4 py-3 font-bold tabular-nums">{index + 1}</td>
                      <td className={`px-4 py-3 font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>{county.county}</td>
                      <td className="px-4 py-3">{county.launchGroup}</td>
                      <td className="px-4 py-3">{county.primaryDriver}</td>
                      <td className="px-4 py-3 text-right font-bold tabular-nums">{county.score}/100</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{currency(county.y1Revenue)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{number(county.referralOpportunity)}</td>
                      <td className="px-4 py-3">{county.providerContext}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{county.marketPenetration.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right tabular-nums">{county.competitionDensity.toFixed(1)}/10K</td>
                      <td className={`px-4 py-3 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{county.sourceLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
            <Abbr term="FFS">FFS</Abbr> beneficiary volume and provider counts are sourced inputs; revenue, referrals, penetration, and composite scores are calculated planning outputs.
          </p>
        </div>
      </Card>
    </div>
  );
}
