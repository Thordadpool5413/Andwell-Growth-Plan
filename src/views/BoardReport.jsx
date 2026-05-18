import React, { useMemo, useRef } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { rollupByService, getOpportunityScore, getCompetitiveThreatScore, getMarketPenetration } from "../utils/calculations.js";
import { currency, number, percent } from "../utils/formatters.js";

const trafficLight = (value, thresholds) => {
  if (value >= thresholds.green) return { color: "bg-emerald-500", label: "On track", tone: "green" };
  if (value >= thresholds.amber) return { color: "bg-amber-500", label: "Watch", tone: "amber" };
  return { color: "bg-red-500", label: "At risk", tone: "red" };
};

export default function BoardReport({ rows, totals }) {
  const { dark } = useDarkMode();
  const reportRef = useRef(null);
  const counties = [...new Set(rows.map((r) => r.county))];
  const serviceMix = useMemo(() => rollupByService(rows), [rows]);

  const countyStatus = useMemo(() => {
    return counties.map((county) => {
      const threat = getCompetitiveThreatScore(county);
      const pen = getMarketPenetration(county, rows);
      const opp = getOpportunityScore(county, rows);
      const countyRows = rows.filter((r) => r.county === county);
      const y1Rev = countyRows.reduce((s, r) => s + r.revenue[0], 0);
      const y3Rev = countyRows.reduce((s, r) => s + r.revenue[2], 0);

      const threatStatus = trafficLight(100 - (threat?.score || 0), { green: 60, amber: 40 });
      const penStatus = trafficLight((pen?.y1Penetration || 0) * 100, { green: 5, amber: 2 });

      return {
        county,
        launchGroup: countyRows[0]?.launchGroup || "—",
        y1Rev,
        y3Rev,
        threatScore: threat?.score || 0,
        threatLevel: threat?.level || "—",
        threatStatus,
        penetration: pen?.y1Penetration || 0,
        penStatus,
        oppScore: opp?.score || 0,
        oppTier: opp?.tier || "—",
      };
    }).sort((a, b) => b.oppScore - a.oppScore);
  }, [rows]);

  const riskCounties = countyStatus.filter((c) => c.threatScore > 60 || c.penetration < 0.02);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>Board report</p>
          <h2 className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>Andwell Growth Plan — Executive Summary</h2>
        </div>
        <button
          onClick={handlePrint}
          className={`rounded-2xl px-5 py-2.5 text-sm font-black transition ${dark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          Print / PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-6 print:space-y-4">
        <div className={`rounded-3xl border p-6 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="grid gap-6 md:grid-cols-4">
            <div>
              <p className={`text-xs font-semibold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>Active counties</p>
              <p className={`mt-1 text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{counties.length}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>Year 1 revenue</p>
              <p className={`mt-1 text-3xl font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(totals.y1Revenue)}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>Year 3 revenue</p>
              <p className={`mt-1 text-3xl font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(totals.y3Revenue)}</p>
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase ${dark ? "text-slate-400" : "text-slate-500"}`}>3-year contribution</p>
              <p className={`mt-1 text-3xl font-black ${dark ? "text-purple-400" : "text-purple-600"}`}>{currency(totals.totalContribution)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card title="County status matrix" eyebrow="Traffic light indicators">
            <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  <tr>
                    <th className="px-4 py-3">County</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3 text-right">Y1 rev</th>
                    <th className="px-4 py-3 text-center">Competition</th>
                    <th className="px-4 py-3 text-center">Penetration</th>
                    <th className="px-4 py-3 text-center">Opp score</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                  {countyStatus.map((c) => (
                    <tr key={c.county} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                      <td className={`px-4 py-3 font-black ${dark ? "text-white" : ""}`}>{c.county}</td>
                      <td className="px-4 py-3">
                        <Badge tone={c.launchGroup.includes("1") ? "green" : c.launchGroup.includes("2") ? "blue" : "amber"}>
                          {c.launchGroup}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(c.y1Rev)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.threatStatus.color}`} />
                          <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{c.threatScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.penStatus.color}`} />
                          <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{percent(c.penetration)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={c.oppTier === "Prime" ? "green" : c.oppTier === "Strong" ? "blue" : c.oppTier === "Developing" ? "amber" : "slate"}>
                          {c.oppScore}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Y1 service mix" eyebrow="Revenue breakdown">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={serviceMix} dataKey="revenue" nameKey="service" cx="50%" cy="50%" outerRadius={80} label={({ service, revenue }) => `${service}: ${currency(revenue)}`}>
                      {serviceMix.map((entry) => (
                        <Cell key={entry.service} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {riskCounties.length > 0 && (
              <Card title="Risk flags" eyebrow="Requires attention">
                <div className="space-y-2">
                  {riskCounties.map((c) => (
                    <div key={c.county} className={`rounded-xl border p-3 ${dark ? "border-red-900 bg-red-950/30" : "border-red-200 bg-red-50"}`}>
                      <p className={`text-sm font-black ${dark ? "text-red-400" : "text-red-700"}`}>{c.county}</p>
                      <p className={`text-xs mt-1 ${dark ? "text-red-400/70" : "text-red-600"}`}>
                        {c.threatScore > 60 ? `Threat score ${c.threatScore}/100 (${c.threatLevel}). ` : ""}
                        {c.penetration < 0.02 ? `Penetration ${percent(c.penetration)} below 2% threshold.` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card title="Financial trajectory" eyebrow="3-year revenue projection">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Year 1", value: totals.y1Revenue, color: dark ? "text-blue-400" : "text-blue-700" },
              { label: "Year 2", value: totals.y2Revenue, color: dark ? "text-purple-400" : "text-purple-600" },
              { label: "Year 3", value: totals.y3Revenue, color: dark ? "text-emerald-400" : "text-emerald-600" },
            ].map((yr) => (
              <div key={yr.label} className={`rounded-2xl border p-5 text-center ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{yr.label}</p>
                <p className={`mt-2 text-3xl font-black ${yr.color}`}>{currency(yr.value)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className={`rounded-2xl border p-4 text-center ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
              <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Y1→Y2 growth</p>
              <p className={`mt-1 text-xl font-black text-emerald-600`}>
                +{totals.y1Revenue > 0 ? Math.round((totals.y2Revenue - totals.y1Revenue) / totals.y1Revenue * 100) : 0}%
              </p>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
              <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Y2→Y3 growth</p>
              <p className={`mt-1 text-xl font-black text-emerald-600`}>
                +{totals.y2Revenue > 0 ? Math.round((totals.y3Revenue - totals.y2Revenue) / totals.y2Revenue * 100) : 0}%
              </p>
            </div>
            <div className={`rounded-2xl border p-4 text-center ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
              <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>3-year total revenue</p>
              <p className={`mt-1 text-xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
                {currency(totals.y1Revenue + totals.y2Revenue + totals.y3Revenue)}
              </p>
            </div>
          </div>
        </Card>

        <div className={`text-center text-xs ${dark ? "text-slate-600" : "text-slate-400"} print:mt-8`}>
          <p>Andwell Maine Innovation and Growth Plan — Board Report</p>
          <p>Generated {today} | Data sources: CMS Provider Files, County Market Data, Modeled Projections</p>
          <p className="mt-1">Key assumptions: 75% conversion rate, Priority 1–3 phased launch, CMS reimbursement rates</p>
        </div>
      </div>
    </div>
  );
}
