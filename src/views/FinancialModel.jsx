import React from "react";
import {
  CartesianGrid, Line, LineChart, Bar, BarChart,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { currency, number } from "../utils/formatters.js";
import { exportFinancialCSV } from "../utils/csvExport.js";

export default function FinancialModel({ rows }) {
  const { dark } = useDarkMode();

  const yearRows = [0, 1, 2].map((index) => ({
    year: `Year ${index + 1}`,
    starts: rows.reduce((sum, row) => sum + row.starts[index], 0),
    referrals: rows.reduce((sum, row) => sum + row.referrals[index], 0),
    revenue: rows.reduce((sum, row) => sum + row.revenue[index], 0),
    contribution: rows.reduce((sum, row) => sum + Math.round(row.revenue[index] * row.meta.margin), 0),
  }));

  const totalRevenue = yearRows.reduce((s, y) => s + y.revenue, 0);
  const totalContribution = yearRows.reduce((s, y) => s + y.contribution, 0);
  const revenueGrowth = yearRows[0].revenue > 0 ? ((yearRows[2].revenue - yearRows[0].revenue) / yearRows[0].revenue * 100) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Financial model" title="3-year revenue and contribution projections">
        Revenue is modeled from CMS beneficiary volumes multiplied by internal capture rate assumptions and Medicare reimbursement rates. Contribution margin reflects the modeled gross margin per service line. Use the Scenario Model sliders to stress-test different capture and <Abbr term="Conversion Rate">conversion rate</Abbr> assumptions.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="3-year total revenue"
          value={currency(totalRevenue)}
          detail="Combined modeled gross revenue across all three years."
          sparkData={yearRows.map((y) => y.revenue)}
          sparkColor={COLORS.blue}
          color="indigo"
        />
        <Metric
          label="3-year contribution"
          value={currency(totalContribution)}
          detail="Total margin contribution across all service lines and years."
          sparkData={yearRows.map((y) => y.contribution)}
          sparkColor={COLORS.green}
          color="emerald"
        />
        <Metric
          label="Y1→Y3 revenue growth"
          value={`+${Math.round(revenueGrowth)}%`}
          detail={`From ${currency(yearRows[0].revenue)} to ${currency(yearRows[2].revenue)}.`}
          color="emerald"
        />
        <Metric
          label="Avg contribution margin"
          value={totalRevenue > 0 ? `${((totalContribution / totalRevenue) * 100).toFixed(1)}%` : "—"}
          detail="Blended margin across all service lines and years."
          color="indigo"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => exportFinancialCSV(rows)}
          className={`rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="3-year financial and referral outlook" eyebrow="Revenue · Contribution · Referrals · Starts">
          <ChartContainer height="h-96">
              <LineChart data={yearRows} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => `$${Math.round(value / 1000000)}M`}
                  tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                  label={{ value: "Revenue / Contribution ($)", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                  label={{ value: "Count (Referrals / Starts)", angle: 90, position: "insideRight", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                />
                <Tooltip
                  formatter={(value, name) => name === "Revenue" || name === "Contribution" ? currency(value) : number(value)}
                  contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="left" type="monotone" dataKey="contribution" name="Contribution" stroke={COLORS.green} strokeWidth={3} strokeDasharray="5 5" dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="referrals" name="Referrals" stroke={COLORS.amber} strokeWidth={3} dot={{ r: 5 }} />
                <Line yAxisId="right" type="monotone" dataKey="starts" name="Starts" stroke={COLORS.purple} strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
          </ChartContainer>
        </Card>
        <Card title="Year over year breakdown" eyebrow="Revenue vs. contribution by year">
          <ChartContainer height="h-96">
              <BarChart data={yearRows} margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis
                  tickFormatter={(value) => `$${Math.round(value / 1000000)}M`}
                  tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                  label={{ value: "Dollars ($)", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                />
                <Tooltip formatter={(value) => currency(value)} contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                <Bar dataKey="contribution" name="Contribution" fill={COLORS.green} radius={[8, 8, 0, 0]} />
              </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card title="Annual financial detail" eyebrow="Detailed breakdown by year">
        {(() => {
          const cmsBacked = rows.filter((r) => r.basis && r.basis.toLowerCase().includes("cms")).length;
          const estBacked = rows.filter((r) => !r.basis || !r.basis.toLowerCase().includes("cms")).length;
          return (
            <div className={`mb-3 flex flex-wrap items-center gap-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="font-black">Revenue basis:</span>
              <span className="flex items-center gap-1.5"><SourceBadge basis="CMS direct HH market" /> {cmsBacked} county-service line{cmsBacked !== 1 ? "s" : ""} derived from CMS provider file volumes</span>
              {estBacked > 0 && <span className="flex items-center gap-1.5"><SourceBadge basis="Planning proxy" /> {estBacked} derived from internal capture rate proxies</span>}
            </div>
          );
        })()}
        <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-5 py-4">Year</th>
                <th className="px-5 py-4 text-right">Starts</th>
                <th className="px-5 py-4 text-right">Referrals</th>
                <th className="px-5 py-4 text-right">Revenue</th>
                <th className="px-5 py-4 text-right">Contribution</th>
                <th className="px-5 py-4 text-right">YoY growth</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {yearRows.map((year, i) => {
                const prevRevenue = i > 0 ? yearRows[i - 1].revenue : 0;
                const yoyGrowth = prevRevenue > 0 ? ((year.revenue - prevRevenue) / prevRevenue * 100) : 0;
                return (
                  <tr key={year.year} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{year.year}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(year.starts)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(year.referrals)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(year.revenue)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(year.contribution)}</td>
                    <td className={`px-5 py-4 text-right font-black ${i === 0 ? (dark ? "text-slate-500" : "text-slate-400") : "text-emerald-600"}`}>
                      {i === 0 ? "—" : `+${Math.round(yoyGrowth)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="County & service line detail" eyebrow="Revenue basis by row">
        <p className={`mb-3 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Each row shows the data provenance for its revenue projection. <SourceBadge basis="CMS direct HH market" /> = derived from CMS provider file beneficiary volumes. <SourceBadge basis="Planning proxy" /> = internal capture rate proxy.
        </p>
        <div className="relative">
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
          <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className="px-5 py-3">County</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3 text-right">Y1 revenue</th>
                  <th className="px-5 py-3 text-right">Y2 revenue</th>
                  <th className="px-5 py-3 text-right">Y3 revenue</th>
                  <th className="px-5 py-3 text-right">Y1 starts</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {rows.map((row) => (
                  <tr key={`${row.county}-${row.service}`} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-3 font-black ${dark ? "text-white" : ""}`}>{row.county}</td>
                    <td className={`px-5 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>{row.service}</td>
                    <td className="px-5 py-3"><SourceBadge basis={row.basis} /></td>
                    <td className={`px-5 py-3 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(row.revenue[0])}</td>
                    <td className={`px-5 py-3 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.revenue[1])}</td>
                    <td className={`px-5 py-3 text-right font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(row.revenue[2])}</td>
                    <td className={`px-5 py-3 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.starts[0])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
