import React from "react";
import {
  CartesianGrid, Line, LineChart, Bar, BarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
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
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="3-year total revenue"
          value={currency(totalRevenue)}
          detail="Combined modeled gross revenue across all years."
          sparkData={yearRows.map((y) => y.revenue)}
          sparkColor={COLORS.blue}
        />
        <Metric
          label="3-year contribution"
          value={currency(totalContribution)}
          detail="Total margin contribution across all service lines."
          sparkData={yearRows.map((y) => y.contribution)}
          sparkColor={COLORS.green}
        />
        <Metric
          label="Y1→Y3 revenue growth"
          value={`+${Math.round(revenueGrowth)}%`}
          detail={`From ${currency(yearRows[0].revenue)} to ${currency(yearRows[2].revenue)}.`}
        />
        <Metric
          label="Avg contribution margin"
          value={totalRevenue > 0 ? `${((totalContribution / totalRevenue) * 100).toFixed(1)}%` : "—"}
          detail="Blended margin across all service lines and years."
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
        <Card title="Three year financial and referral outlook" eyebrow="Financial impact">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={yearRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis yAxisId="left" tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <Tooltip formatter={(value, name) => name === "Revenue" || name === "Contribution" ? currency(value) : number(value)} contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={3} />
                <Line yAxisId="left" type="monotone" dataKey="contribution" name="Contribution" stroke={COLORS.green} strokeWidth={3} strokeDasharray="5 5" />
                <Line yAxisId="right" type="monotone" dataKey="referrals" name="Referrals" stroke={COLORS.amber} strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="starts" name="Starts" stroke={COLORS.purple} strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Year over year breakdown" eyebrow="Revenue and contribution">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearRows}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <Tooltip formatter={(value) => currency(value)} contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                <Bar dataKey="contribution" name="Contribution" fill={COLORS.green} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Annual financial detail" eyebrow="Detailed breakdown">
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
    </div>
  );
}
