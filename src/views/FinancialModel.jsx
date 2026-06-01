import React from "react";
import {
  CartesianGrid, Line, LineChart, Area, AreaChart, Bar, BarChart,
  ReferenceLine, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import CustomTooltip from "../components/CustomTooltip.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import Abbr from "../components/Abbr.jsx";
import Badge from "../components/Badge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { currency, number } from "../utils/formatters.js";
import { exportFinancialCSV } from "../utils/csvExport.js";

const YEAR_BADGES = [
  { label: "Y1", colorClass: dark => dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600" },
  { label: "Y2", colorClass: dark => dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600" },
  { label: "Y3", colorClass: dark => dark ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600" },
];

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

  const services = [...new Set(rows.map((r) => r.service))];
  const serviceColors = {
    "Home Healthcare": COLORS.blue,
    "Mobile Wound":   COLORS.red,
    "Therapy Care":   COLORS.green,
    "GUIDE":          COLORS.purple,
    "Hospice":        "#9333ea",
  };
  const serviceStackData = [0, 1, 2].map((index) => {
    const entry = { year: `Year ${index + 1}` };
    services.forEach((svc) => {
      entry[svc] = rows.filter((r) => r.service === svc).reduce((s, r) => s + r.revenue[index], 0);
    });
    return entry;
  });

  const badgeClass = dark
    ? "bg-slate-700/60 text-slate-300"
    : "bg-slate-100 text-slate-600";

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
          sourceType="modeled"
        />
        <Metric
          label="3-year contribution"
          value={currency(totalContribution)}
          detail="Total margin contribution across all service lines and years."
          sparkData={yearRows.map((y) => y.contribution)}
          sparkColor={COLORS.green}
          color="emerald"
          sourceType="modeled"
        />
        <Metric
          label="Y1→Y3 revenue growth"
          value={`+${Math.round(revenueGrowth)}%`}
          detail={`From ${currency(yearRows[0].revenue)} to ${currency(yearRows[2].revenue)}.`}
          color="emerald"
          sourceType="derived"
        />
        <Metric
          label="Avg contribution margin"
          value={totalRevenue > 0 ? `${((totalContribution / totalRevenue) * 100).toFixed(1)}%` : "—"}
          detail="Blended margin across all service lines and years."
          color="indigo"
          sourceType="modeled"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => exportFinancialCSV(rows)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
        >
          Export CSV
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="3-year revenue growth trajectory" eyebrow="Revenue · Contribution · Growth trend">
          <ChartContainer
            height="h-96"
            title="Revenue with growth area fill"
            caption="Launch year (Y1) reference line marks the start of operations"
          >
            <AreaChart data={yearRows} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="contributionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.green} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={COLORS.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000000)}M`}
                tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                label={{ value: "Revenue / Contribution ($)", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
              />
              <ReferenceLine
                x="Year 1"
                stroke={dark ? "#60a5fa" : "#3b82f6"}
                strokeDasharray="4 4"
                label={{ value: "Launch year", position: "insideTopRight", fontSize: 10, fill: dark ? "#60a5fa" : "#3b82f6" }}
              />
              <CustomTooltip formatter={(value) => currency(value)} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={2} fill="url(#revenueGradient)" dot={{ r: 4 }} />
              <Area type="monotone" dataKey="contribution" name="Contribution" stroke={COLORS.green} strokeWidth={2} strokeDasharray="5 5" fill="url(#contributionGradient)" dot={{ r: 4 }} />
            </AreaChart>
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
              <CustomTooltip formatter={(value) => currency(value)} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="contribution" name="Contribution" fill={COLORS.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card title="Revenue by service line" eyebrow="3-year stacked area breakdown">
        <ChartContainer height="h-72" caption="Revenue contribution by service line across Years 1–3 — stacked area view">
          <AreaChart data={serviceStackData} margin={{ left: 10, right: 10 }}>
            <defs>
              {services.map((svc) => (
                <linearGradient key={svc} id={`grad-${svc.replace(/\s+/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={serviceColors[svc] || COLORS.blue} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={serviceColors[svc] || COLORS.blue} stopOpacity={0.04} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000000)}M`} tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
            <CustomTooltip formatter={(value) => currency(value)} />
            <Legend />
            {services.map((svc) => (
              <Area
                key={svc}
                type="monotone"
                dataKey={svc}
                stackId="1"
                stroke={serviceColors[svc] || COLORS.blue}
                fill={`url(#grad-${svc.replace(/\s+/g, "")})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </Card>

      <Card title="Annual financial detail" eyebrow="Detailed breakdown by year">
        {(() => {
          const cmsBacked = rows.filter((r) => r.basis && r.basis.toLowerCase().includes("cms")).length;
          const estBacked = rows.filter((r) => !r.basis || !r.basis.toLowerCase().includes("cms")).length;
          return (
            <div className={`mb-3 flex flex-wrap items-center gap-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="font-semibold">Revenue basis:</span>
              <span className="flex items-center gap-1.5"><SourceBadge basis="CMS direct HH market" /> {cmsBacked} county-service line{cmsBacked !== 1 ? "s" : ""} derived from CMS provider file volumes</span>
              {estBacked > 0 && <span className="flex items-center gap-1.5"><SourceBadge basis="Planning proxy" /> {estBacked} derived from internal capture rate proxies</span>}
            </div>
          );
        })()}
        <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/40 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-5 py-4">Year</th>
                <th className="px-5 py-4 text-right">Starts</th>
                <th className="px-5 py-4 text-right">Referrals</th>
                <th className="px-5 py-4 text-right">Revenue</th>
                <th className="px-5 py-4 text-right">Contribution</th>
                <th className="px-5 py-4 text-right">YoY growth</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-slate-100"}`}>
              {yearRows.map((year, i) => {
                const prevRevenue = i > 0 ? yearRows[i - 1].revenue : 0;
                const yoyGrowth = prevRevenue > 0 ? ((year.revenue - prevRevenue) / prevRevenue * 100) : 0;
                return (
                  <tr key={year.year} className={dark ? i % 2 === 1 ? "bg-slate-800/40 hover:bg-slate-700/40" : "hover:bg-slate-700/40" : i % 2 === 1 ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${badgeClass}`}>Y{i + 1}</span>
                        {year.year}
                      </div>
                    </td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{number(year.starts)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{number(year.referrals)}</td>
                    <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(year.revenue)}</td>
                    <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(year.contribution)}</td>
                    <td className={`px-5 py-4 text-right font-medium tabular-nums ${i === 0 ? (dark ? "text-slate-500" : "text-slate-400") : (dark ? "text-emerald-400" : "text-emerald-600")}`}>
                      {i === 0 ? "—" : `+${Math.round(yoyGrowth)}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={`font-semibold text-sm border-t-2 ${dark ? "border-slate-600 bg-slate-700/40 text-slate-100" : "border-slate-200 bg-slate-50 text-slate-800"}`}>
                <td className="px-5 py-4">3-Year Total</td>
                <td className="px-5 py-4 text-right tabular-nums">{number(yearRows.reduce((s, y) => s + y.starts, 0))}</td>
                <td className="px-5 py-4 text-right tabular-nums">{number(yearRows.reduce((s, y) => s + y.referrals, 0))}</td>
                <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(totalRevenue)}</td>
                <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(totalContribution)}</td>
                <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>+{Math.round(revenueGrowth)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      <Card title="County & service line detail" eyebrow="Revenue basis by row">
        <p className={`mb-3 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Each row shows the data provenance for its revenue projection. <SourceBadge basis="CMS direct HH market" /> = derived from CMS provider file beneficiary volumes. <SourceBadge basis="Planning proxy" /> = internal capture rate proxy.
        </p>
        <div className="relative">
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-lg bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
          <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/40 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
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
              <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-slate-100"}`}>
                {rows.map((row, i) => (
                  <tr key={`${row.county}-${row.service}`} className={dark ? i % 2 === 1 ? "bg-slate-800/40 hover:bg-slate-700/40" : "hover:bg-slate-700/40" : i % 2 === 1 ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-3 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{row.county}</td>
                    <td className={`px-5 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>{row.service}</td>
                    <td className="px-5 py-3"><SourceBadge basis={row.basis} /></td>
                    <td className={`px-5 py-3 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(row.revenue[0])}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{currency(row.revenue[1])}</td>
                    <td className={`px-5 py-3 text-right font-semibold tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(row.revenue[2])}</td>
                    <td className={`px-5 py-3 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{number(row.starts[0])}</td>
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
