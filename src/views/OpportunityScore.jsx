import React, { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import Abbr from "../components/Abbr.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import MethodologyCallout from "../components/MethodologyCallout.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { getOpportunityScore } from "../utils/calculations.js";
import { currency, number } from "../utils/formatters.js";

const CMS_LAST_SYNCED = "2026-05-01";

const TIER_STYLES = {
  Prime: {
    bg: "bg-emerald-100 dark:bg-emerald-900/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    border: "border-emerald-300 dark:border-emerald-700",
  },
  Strong: {
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
    border: "border-blue-300 dark:border-blue-700",
  },
  Developing: {
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    border: "border-amber-300 dark:border-amber-700",
  },
  Other: {
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
    border: "border-slate-200 dark:border-slate-700",
  },
};

function TierChip({ tier }) {
  const s = TIER_STYLES[tier] || TIER_STYLES.Other;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-sm font-black ${s.bg} ${s.text} ${s.border}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 ${s.dot}`} />
      {tier}
    </span>
  );
}

const TIER_FILTERS = ["All", "Prime", "Strong", "Developing"];
const GROUP_FILTERS = ["All", "Priority 1", "Priority 2", "Priority 3"];
const SCORE_FILTERS = [
  { label: "Any score", min: 0 },
  { label: "40+", min: 40 },
  { label: "60+", min: 60 },
  { label: "80+", min: 80 },
];

function FilterChip({ label, active, onClick, dark }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3 py-1.5 text-xs font-black transition-all ${
        active
          ? "border-blue-500 bg-blue-600 text-white shadow-sm"
          : dark
          ? "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500 hover:text-slate-200"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
      }`}
    >
      {label}
    </button>
  );
}

export default function OpportunityScore({ rows }) {
  const { dark } = useDarkMode();
  const [tierFilter, setTierFilter] = useState("All");
  const [groupFilter, setGroupFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);

  const counties = [...new Set(rows.map((r) => r.county))];
  const scores = useMemo(
    () => counties.map((c) => getOpportunityScore(c, rows)).filter(Boolean).sort((a, b) => b.score - a.score),
    [rows],
  );

  const scoredWithGroup = useMemo(
    () => scores.map((s) => {
      const countyRow = rows.find((r) => r.county === s.county);
      return { ...s, launchGroup: countyRow?.launchGroup ?? "—" };
    }),
    [scores, rows],
  );

  const visibleScores = useMemo(() => {
    return scoredWithGroup.filter((c) => {
      const tierOk = tierFilter === "All" || c.tier === tierFilter;
      const groupOk = groupFilter === "All" || c.launchGroup === groupFilter;
      const scoreOk = c.score >= minScore;
      return tierOk && groupOk && scoreOk;
    });
  }, [scoredWithGroup, tierFilter, groupFilter, minScore]);

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length) : 0;
  const primeCount = scores.filter((s) => s.tier === "Prime").length;
  const topCounty = scores[0];

  const filterSummary = useMemo(() => {
    if (visibleScores.length === 0) return null;
    const totalY1 = visibleScores.reduce((s, c) => s + (c.y1Revenue || 0), 0);
    const totalY3 = visibleScores.reduce((s, c) => s + (c.y3Revenue || 0), 0);
    const avgFiltered = Math.round(visibleScores.reduce((s, c) => s + c.score, 0) / visibleScores.length);
    const primeFiltered = visibleScores.filter((c) => c.tier === "Prime").length;
    return { totalY1, totalY3, avgFiltered, primeFiltered, count: visibleScores.length };
  }, [visibleScores]);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Opportunity scoring" icon="🏆" title="County opportunity ranking with factor analysis">
        Composite score (0–100) combining market size (25%), low competition (20%), Andwell presence (15%), revenue efficiency (20%), and growth potential (20%). Higher is better.
      </SectionHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={CMS_LAST_SYNCED} label="CMS data" />
      </div>

      <MethodologyCallout title="How is this calculated?">
        <p className={`mb-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
          Each county receives a composite Opportunity Score (0–100) built from five equally-weighted factor groups:
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { name: "Market size", weight: "25%", desc: "CMS FFS beneficiary volume in the county — larger addressable markets score higher." },
            { name: "Low competition", weight: "20%", desc: "Inverse of the competitive threat score — counties with fewer or weaker competitors score higher." },
            { name: "Andwell presence", weight: "15%", desc: "Whether Andwell already has an active CMS record in the county — existing presence lowers entry cost." },
            { name: "Revenue efficiency", weight: "20%", desc: "Modeled Y1 revenue per FFS beneficiary — higher revenue density relative to market size scores higher." },
            { name: "Growth potential", weight: "20%", desc: "Y1→Y3 revenue ramp rate — counties with steeper projected growth curves score higher." },
          ].map((f) => (
            <div key={f.name} className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-black ${dark ? "text-white" : "text-slate-900"}`}>{f.name}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${dark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>{f.weight}</span>
              </div>
              <p className={`mt-1 text-[11px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{f.desc}</p>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Tiers: Prime ≥ 80 · Strong 60–79 · Developing 40–59 · Below 40. Scores are relative to this dataset and should not be compared across different county sets.
        </p>
      </MethodologyCallout>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Average opportunity score" value={`${avgScore}/100`} detail="Mean score across all launch counties." color="emerald" sourceType="derived" />
        <Metric label="Prime counties" value={primeCount} detail="Counties scoring 80+ (top tier)." color="emerald" sourceType="derived" />
        <Metric label="Top county" value={topCounty?.county || "—"} detail={`Score: ${topCounty?.score || 0}/100 (${topCounty?.tier || "—"})`} color="blue" sourceType="derived" />
        <Metric label="Total Y1 opportunity" value={currency(scores.reduce((s, c) => s + c.y1Revenue, 0))} detail="Combined Y1 revenue across all scored counties." color="indigo" sourceType="modeled" />
      </div>

      <Card title="County opportunity leaderboard" eyebrow="Ranked by composite score">
        <div className="space-y-4">
          <div className={`rounded-2xl border p-4 space-y-3 ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Tier</span>
              <div className="flex flex-wrap gap-1.5">
                {TIER_FILTERS.map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={tierFilter === t}
                    onClick={() => setTierFilter(t)}
                    dark={dark}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Launch group</span>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_FILTERS.map((g) => (
                  <FilterChip
                    key={g}
                    label={g}
                    active={groupFilter === g}
                    onClick={() => setGroupFilter(g)}
                    dark={dark}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className={`text-xs font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Min score</span>
              <div className="flex flex-wrap gap-1.5">
                {SCORE_FILTERS.map((sf) => (
                  <FilterChip
                    key={sf.label}
                    label={sf.label}
                    active={minScore === sf.min}
                    onClick={() => setMinScore(sf.min)}
                    dark={dark}
                  />
                ))}
              </div>
            </div>
            <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Showing <span className={`font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{visibleScores.length}</span> of <span className="font-black">{scoredWithGroup.length}</span> counties
            </p>

            {filterSummary && (
              <div className={`mt-1 rounded-xl border p-3 transition-all ${dark ? "border-blue-800/60 bg-blue-950/30" : "border-blue-100 bg-blue-50"}`}>
                <p className={`mb-2 text-[10px] font-black uppercase tracking-widest ${dark ? "text-blue-400" : "text-blue-600"}`}>
                  Selected group opportunity
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Total Y1 revenue</p>
                    <p className={`text-base font-black ${dark ? "text-blue-300" : "text-blue-700"}`}>{currency(filterSummary.totalY1)}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Total Y3 revenue</p>
                    <p className={`text-base font-black ${dark ? "text-emerald-300" : "text-emerald-700"}`}>{currency(filterSummary.totalY3)}</p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Avg opportunity score</p>
                    <p className={`text-base font-black ${dark ? "text-white" : "text-slate-900"}`}>{filterSummary.avgFiltered}<span className={`text-xs font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>/100</span></p>
                  </div>
                  <div>
                    <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Prime counties</p>
                    <p className={`text-base font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>
                      {filterSummary.primeFiltered}
                      <span className={`text-xs font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}> of {filterSummary.count}</span>
                    </p>
                  </div>
                </div>
                {filterSummary.totalY3 > filterSummary.totalY1 && filterSummary.totalY1 > 0 && (
                  <p className={`mt-2 text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                    Y1→Y3 growth: <span className="font-black text-emerald-500">+{Math.round((filterSummary.totalY3 - filterSummary.totalY1) / filterSummary.totalY1 * 100)}%</span> across this group
                  </p>
                )}
              </div>
            )}
          </div>

          {visibleScores.length === 0 ? (
            <div className={`rounded-2xl border p-10 text-center ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>No counties match the selected filters.</p>
              <button
                onClick={() => { setTierFilter("All"); setGroupFilter("All"); setMinScore(0); }}
                className="mt-3 text-xs text-blue-500 hover:underline font-black"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {scoredWithGroup.map((county, index) => {
                const tierOk = tierFilter === "All" || county.tier === tierFilter;
                const groupOk = groupFilter === "All" || county.launchGroup === groupFilter;
                const scoreOk = county.score >= minScore;
                const visible = tierOk && groupOk && scoreOk;
                return (
                  <div
                    key={county.county}
                    className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                      visible ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0 border-transparent py-0"
                    } ${dark ? "border-slate-700 bg-slate-800 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg flex-shrink-0 ${
                            index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                            : index === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            : index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                            : dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{county.county}</p>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <TierChip tier={county.tier} />
                              <span className={`text-xs rounded-full border px-2 py-0.5 font-semibold ${dark ? "border-slate-600 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                                {county.launchGroup}
                              </span>
                              <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                                {number(county.marketUsers)} users · Threat {county.threatScore}/100
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-4xl font-black ${county.score >= 60 ? dark ? "text-emerald-400" : "text-emerald-600" : dark ? "text-amber-400" : "text-amber-600"}`}>
                            {county.score}
                          </p>
                          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>/100</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <span className={dark ? "text-slate-500" : "text-slate-400"}>Score</span>
                          <span className={`font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{county.score}/100</span>
                        </div>
                        <div className={`h-2.5 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
                          <div
                            className={`h-full rounded-full transition-all ${county.score >= 80 ? "bg-emerald-500" : county.score >= 60 ? "bg-blue-500" : county.score >= 40 ? "bg-amber-500" : "bg-slate-400"}`}
                            style={{ width: `${county.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-5 gap-2">
                        {county.factors.map((factor) => (
                          <div key={factor.name} className={`rounded-xl p-2.5 text-center ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                            <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{factor.name}</p>
                            <p className={`mt-1 text-sm font-black ${factor.direction === "up" ? "text-emerald-600" : dark ? "text-amber-400" : "text-amber-600"}`}>
                              {factor.value}
                            </p>
                            <p className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{Math.round(factor.weight * 100)}% wt</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex gap-6 text-sm">
                        <div><span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 rev: </span><span className={`font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(county.y1Revenue)}</span></div>
                        <div><span className={dark ? "text-slate-400" : "text-slate-500"}>Y3 rev: </span><span className={`font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(county.y3Revenue)}</span></div>
                        <div><span className={dark ? "text-slate-400" : "text-slate-500"}>Growth: </span><span className="font-black text-emerald-600">+{county.y1Revenue > 0 ? Math.round((county.y3Revenue - county.y1Revenue) / county.y1Revenue * 100) : 0}%</span></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
