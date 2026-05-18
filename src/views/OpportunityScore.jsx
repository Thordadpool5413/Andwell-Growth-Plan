import React, { useMemo } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { getOpportunityScore } from "../utils/calculations.js";
import { currency, number } from "../utils/formatters.js";

const tierTone = (tier) => tier === "Prime" ? "green" : tier === "Strong" ? "blue" : tier === "Developing" ? "amber" : "slate";

export default function OpportunityScore({ rows }) {
  const { dark } = useDarkMode();
  const counties = [...new Set(rows.map((r) => r.county))];
  const scores = useMemo(
    () => counties.map((c) => getOpportunityScore(c, rows)).filter(Boolean).sort((a, b) => b.score - a.score),
    [rows],
  );

  const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length) : 0;
  const primeCount = scores.filter((s) => s.tier === "Prime").length;
  const topCounty = scores[0];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Opportunity scoring" title="County opportunity ranking with factor analysis">
        Composite score (0–100) combining market size (25%), low competition (20%), Andwell presence (15%), revenue efficiency (20%), and growth potential (20%). Higher is better.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Average opportunity score" value={`${avgScore}/100`} detail="Mean score across all launch counties." />
        <Metric label="Prime counties" value={primeCount} detail="Counties scoring 80+ (top tier)." />
        <Metric label="Top county" value={topCounty?.county || "—"} detail={`Score: ${topCounty?.score || 0}/100 (${topCounty?.tier || "—"})`} />
        <Metric label="Total Y1 opportunity" value={currency(scores.reduce((s, c) => s + c.y1Revenue, 0))} detail="Combined Y1 revenue across all scored counties." />
      </div>

      <Card title="County opportunity leaderboard" eyebrow="Ranked by composite score">
        <div className="space-y-3">
          {scores.map((county, index) => (
            <div key={county.county} className={`rounded-2xl border p-5 transition ${dark ? "border-slate-700 bg-slate-800 hover:border-slate-600" : "border-slate-200 bg-white hover:border-slate-300"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-lg ${
                    index === 0 ? "bg-amber-100 text-amber-700" : index === 1 ? "bg-slate-100 text-slate-600" : index === 2 ? "bg-orange-100 text-orange-700" : dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{county.county}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={tierTone(county.tier)}>{county.tier}</Badge>
                      <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
                        {number(county.marketUsers)} users | Threat: {county.threatScore}/100
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black ${county.score >= 60 ? dark ? "text-emerald-400" : "text-emerald-600" : dark ? "text-amber-400" : "text-amber-600"}`}>
                    {county.score}
                  </p>
                  <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>/100</p>
                </div>
              </div>

              <div className="mt-4">
                <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
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
                <div><span className={dark ? "text-slate-400" : "text-slate-500"}>Growth: </span><span className={`font-black text-emerald-600`}>+{county.y1Revenue > 0 ? Math.round((county.y3Revenue - county.y1Revenue) / county.y1Revenue * 100) : 0}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
