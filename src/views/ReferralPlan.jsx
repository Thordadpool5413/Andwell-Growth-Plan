import React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import CustomTooltip from "../components/CustomTooltip.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { number } from "../utils/formatters.js";
import { exportReferralCSV } from "../utils/csvExport.js";

export default function ReferralPlan({ rows }) {
  const { dark } = useDarkMode();

  const totalY1Referrals = rows.reduce((s, r) => s + r.referrals[0], 0);
  const totalY1Starts = rows.reduce((s, r) => s + r.starts[0], 0);
  const conversionRate = totalY1Referrals > 0 ? (totalY1Starts / totalY1Referrals) * 100 : 0;

  const chartData = rows.map((r) => ({
    county: r.county,
    referrals: r.referrals[0],
    starts: r.starts[0],
  })).sort((a, b) => b.referrals - a.referrals);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Referral plan" title="Required referrals by county and service line">
        Referral requirements are derived from patient start goals using a 75% <Abbr term="Conversion Rate">conversion</Abbr> baseline (industry median: 72–78% per <Abbr term="NAHC">NAHC</Abbr> 2023). For every 100 referrals, ~75 are expected to convert to patient starts. Adjust the Scenario Model to see how different conversion rates affect the referral load.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border-l-4 border-l-blue-500 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Gross referrals needed</p>
          <p className={`mt-2 text-4xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{number(totalY1Referrals)}</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Year 1 gross referral target across all counties</p>
        </div>
        <div className={`rounded-xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Net patient starts</p>
          <p className={`mt-2 text-4xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{number(totalY1Starts)}</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Year 1 net starts after 75% conversion (NAHC median)</p>
        </div>
        <div className={`rounded-xl border-l-4 border-l-slate-400 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Modeled conversion rate</p>
          <p className={`mt-2 text-4xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{conversionRate.toFixed(0)}%</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>NAHC 2023 industry median: 72–78%</p>
        </div>
      </div>

      <Card title="Year 1 referral volume by county" eyebrow="Gross referrals vs. patient starts">
        <ChartContainer height="h-72" caption="Source: patient start goals ÷ 75% conversion rate (NAHC 2023 median)">
          <BarChart data={chartData} margin={{ bottom: 24, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis
              dataKey="county"
              tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#475569" }}
              label={{ value: "County", position: "insideBottom", offset: -16, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
            />
            <YAxis
              tick={{ fill: dark ? "#94a3b8" : "#475569" }}
              label={{ value: "Count", angle: -90, position: "insideLeft", offset: -4, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
            />
            <CustomTooltip />
            <Bar dataKey="referrals" name="Gross referrals" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
            <Bar dataKey="starts" name="Net starts" fill={COLORS.green} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>

      <Card title="Referral requirements by county" eyebrow="Referral plan">
        <div className="mb-4 flex items-center justify-between">
          <p className={`text-xs font-medium ${dark ? "text-slate-500" : "text-slate-400"}`}>Scroll right to see all years →</p>
          <button
            onClick={() => exportReferralCSV(rows)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            Export CSV
          </button>
        </div>
        <div className="relative">
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-lg bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
          <div className={`relative overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
            <table className={`w-full min-w-[1050px] text-left text-sm ${dark ? "border-slate-700/60" : ""}`}>
              <thead className={`sticky top-0 text-xs uppercase tracking-wide ${dark ? "bg-slate-700/80 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className={`px-5 py-4 font-medium border-r ${dark ? "border-slate-600/60" : "border-slate-200"}`}>County</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Service</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>Year 1 goal</th>
                  <th className="px-5 py-4 text-right">Year 1 referrals</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>Year 2 goal</th>
                  <th className="px-5 py-4 text-right">Year 2 referrals</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>Year 3 goal</th>
                  <th className="px-5 py-4 text-right">Year 3 referrals</th>
                  <th className="px-5 py-4 text-right">Y1→Y3 growth</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-slate-100"}`}>
                {rows.map((row, i) => {
                  const growth = row.starts[0] > 0 ? ((row.starts[2] - row.starts[0]) / row.starts[0]) * 100 : 0;
                  const isAlt = i % 2 === 1;
                  return (
                    <tr key={row.county} className={`${dark ? isAlt ? "bg-slate-800/40 hover:bg-slate-700/40" : "hover:bg-slate-700/40" : isAlt ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}`}>
                      <td className={`px-5 py-4 font-semibold border-r ${dark ? "text-slate-100 border-slate-700/60" : "text-slate-800 border-slate-100"}`}>{row.county}</td>
                      <td className="px-5 py-4"><SourceBadge basis={row.basis} /></td>
                      <td className="px-5 py-4"><ServiceBadge service={row.service} /></td>
                      <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "text-slate-300 border-slate-700/60" : "text-slate-600 border-slate-100"}`}>{number(row.starts[0])}</td>
                      <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[0])}</td>
                      <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "text-slate-300 border-slate-700/60" : "text-slate-600 border-slate-100"}`}>{number(row.starts[1])}</td>
                      <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[1])}</td>
                      <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "text-slate-300 border-slate-700/60" : "text-slate-600 border-slate-100"}`}>{number(row.starts[2])}</td>
                      <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[2])}</td>
                      <td className={`px-5 py-4 text-right font-medium tabular-nums ${growth > 0 ? (dark ? "text-emerald-400" : "text-emerald-600") : (dark ? "text-slate-500" : "text-slate-400")}`}>
                        {growth > 0 ? `+${Math.round(growth)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={`font-semibold text-sm border-t-2 ${dark ? "border-slate-600 bg-slate-700/40 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
                  <td colSpan={3} className={`px-5 py-4 border-r ${dark ? "border-slate-600/60" : "border-slate-200"}`}>Totals</td>
                  <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[0], 0))}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{number(rows.reduce((s, r) => s + r.referrals[0], 0))}</td>
                  <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[1], 0))}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{number(rows.reduce((s, r) => s + r.referrals[1], 0))}</td>
                  <td className={`px-5 py-4 text-right tabular-nums border-l ${dark ? "border-slate-600/60" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[2], 0))}</td>
                  <td className="px-5 py-4 text-right tabular-nums">{number(rows.reduce((s, r) => s + r.referrals[2], 0))}</td>
                  <td className={`px-5 py-4 text-right ${dark ? "text-emerald-400" : "text-emerald-600"}`}>—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
