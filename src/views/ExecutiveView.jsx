import React from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { namedProviderRows } from "../data/providers.js";
import { rollupByService, getCompetitiveThreatScore } from "../utils/calculations.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { currency, number, percent } from "../utils/formatters.js";

export default function ExecutiveView({ rows, totals }) {
  const { dark } = useDarkMode();

  const totalMarket = Object.values(cmsCountyMarket).reduce((s, m) => s + m.hh.users + m.hos.users, 0);
  const y1Penetration = totalMarket > 0 ? totals.y1Starts / totalMarket : 0;

  const avgThreat = Object.keys(cmsCountyMarket)
    .map((c) => getCompetitiveThreatScore(c))
    .filter(Boolean)
    .reduce((s, t, _, a) => s + t.score / a.length, 0);

  const totalFFS = Object.values(cmsCountyMarket).reduce((s, m) => s + m.ffs, 0);
  const revPerBeneficiary = totalFFS > 0 ? Math.round(totals.y1Revenue / totalFFS) : 0;

  return (
    <div className="space-y-8">
      {/* Executive Summary Metrics */}
      <div className="grid-4">
        <Metric
          label="Active growth counties"
          value={rows.length}
          detail="County and service line recommendations in the active model."
          confidence="high"
        />
        <Metric
          label="Year 1 referrals"
          value={number(totals.y1Referrals)}
          detail="Gross referrals needed at a 75 percent conversion baseline."
          sparkData={[totals.y1Referrals, totals.y2Referrals, totals.y3Referrals]}
          sparkColor={COLORS.blue}
          confidence="high"
        />
        <Metric
          label="Year 1 revenue"
          value={currency(totals.y1Revenue)}
          detail="Modeled Year 1 gross revenue from active lines."
          sparkData={[totals.y1Revenue, totals.y2Revenue, totals.y3Revenue]}
          sparkColor={COLORS.green}
          confidence="high"
        />
        <Metric
          label="Named competitors"
          value={namedProviderRows.length}
          detail="Home Healthcare and Hospice provider rows loaded into the competitive view."
          confidence="medium"
        />
      </div>

      {/* Key Performance Indicators */}
      <div className="grid-3">
        <Card title="Market Penetration" eyebrow="Market Share">
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>Year 1 Penetration</span>
                <span className="text-2xl font-black text-blue-600">{percent(y1Penetration)}</span>
              </div>
              <div className={`w-full h-2 rounded-full ${dark ? "bg-slate-700" : "bg-slate-200"} overflow-hidden`}>
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full" style={{ width: `${Math.min(y1Penetration * 100, 100)}%` }} />
              </div>
            </div>
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {number(totals.y1Starts)} starts vs {number(totalMarket)} total market
            </p>
          </div>
        </Card>

        <Card title="Competitive Threat" eyebrow="Risk Assessment">
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black text-amber-600">{(avgThreat * 100).toFixed(0)}</div>
              <span className={`text-sm mb-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>threat score</span>
            </div>
            <div className={`px-3 py-2 rounded-lg ${dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-100 text-amber-700"} text-xs font-semibold`}>
              {avgThreat > 0.6 ? "High competitive pressure" : avgThreat > 0.3 ? "Moderate competition" : "Low competitive threat"}
            </div>
          </div>
        </Card>

        <Card title="Revenue per Beneficiary" eyebrow="Unit Economics">
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="text-4xl font-black text-green-600">${revPerBeneficiary}</div>
              <span className={`text-sm mb-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>per FFS</span>
            </div>
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Based on {number(totalFFS)} Medicare FFS beneficiaries
            </p>
          </div>
        </Card>
      </div>

      {/* Detailed Charts */}
      <div className="grid-2">
        <Card title="Revenue by Service Line" eyebrow="Financial">
          {rows.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rollupByService(rows)}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="service" stroke={dark ? "#94a3b8" : "#64748b"} style={{ fontSize: "12px" }} />
                <YAxis stroke={dark ? "#94a3b8" : "#64748b"} style={{ fontSize: "12px" }} />
                <Tooltip
                  formatter={(value) => currency(value)}
                  contentStyle={{
                    background: dark ? "#1e293b" : "#fff",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    color: dark ? "#f1f5f9" : "#0f172a",
                  }}
                />
                <Bar dataKey="y1Revenue" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">No data available</div>
          )}
        </Card>

        <Card title="Service Line Mix" eyebrow="Distribution">
          {rows.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Tooltip
                  formatter={(value) => currency(value)}
                  contentStyle={{
                    background: dark ? "#1e293b" : "#fff",
                    border: `1px solid ${dark ? "#334155" : "#e2e8f0"}`,
                    borderRadius: "8px",
                    color: dark ? "#f1f5f9" : "#0f172a",
                  }}
                />
                <Pie
                  data={rollupByService(rows)}
                  dataKey="y1Revenue"
                  nameKey="service"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ service, value }) => `${service}: ${percent(value / totals.y1Revenue)}`}
                >
                  {rollupByService(rows).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.keys(COLORS).length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">No data available</div>
          )}
        </Card>
      </div>

      {/* Revenue Growth Trajectory */}
      <Card title="3-Year Revenue Trajectory" eyebrow="Growth Forecast">
        <div className="space-y-4">
          <div className="grid-3">
            <div>
              <p className={`text-sm mb-2 ${dark ? "text-slate-400" : "text-slate-600"}`}>Year 1</p>
              <p className="text-3xl font-black text-blue-600">{currency(totals.y1Revenue)}</p>
            </div>
            <div>
              <p className={`text-sm mb-2 ${dark ? "text-slate-400" : "text-slate-600"}`}>Year 2</p>
              <p className="text-3xl font-black text-blue-600">{currency(totals.y2Revenue)}</p>
            </div>
            <div>
              <p className={`text-sm mb-2 ${dark ? "text-slate-400" : "text-slate-600"}`}>Year 3</p>
              <p className="text-3xl font-black text-blue-600">{currency(totals.y3Revenue)}</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg ${dark ? "bg-success-900/20 border border-success-700/30" : "bg-success-50 border border-success-200"}`}>
            <span className="text-success-600 font-semibold">↑ Growth</span>
            <span className={`text-sm ${dark ? "text-success-300" : "text-success-700"}`}>
              ${((totals.y3Revenue - totals.y1Revenue) / totals.y1Revenue * 100).toFixed(0)}% 3-year cumulative growth
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

