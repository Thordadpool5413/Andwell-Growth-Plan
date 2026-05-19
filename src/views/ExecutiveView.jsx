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
        <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Market penetration (Y1)</p>
          <p className={`mt-2 text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{percent(y1Penetration)}</p>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Modeled Y1 starts vs total CMS market ({number(totalMarket)} users).</p>
        </div>
        <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Avg competitive threat</p>
          <div className="mt-2 flex items-center gap-3">
            <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{Math.round(avgThreat)}/100</p>
            <Badge tone={avgThreat >= 70 ? "red" : avgThreat >= 50 ? "amber" : avgThreat >= 30 ? "blue" : "green"}>
              {avgThreat >= 70 ? "Fortress" : avgThreat >= 50 ? "High" : avgThreat >= 30 ? "Moderate" : "Low"}
            </Badge>
          </div>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Composite score across all 12 counties.</p>
        </div>
        <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Revenue per FFS beneficiary</p>
          <p className={`mt-2 text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{currency(revPerBeneficiary)}</p>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Y1 revenue efficiency across {number(totalFFS)} FFS beneficiaries.</p>
        </div>
      </div>

      <Card title="Growth thesis" eyebrow="Executive summary">
        <p className={`text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-700"}`}>
          This dashboard connects Andwell service gaps, CMS market volume, referral math, financial upside, and named provider competition. The competitor layer now shows the actual named Home Healthcare and Hospice providers from the uploaded provider file, including Andwell provider file share and rank.
        </p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Year 1 service mix" eyebrow="Revenue mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rollupByService(rows)} dataKey="revenue" nameKey="service" innerRadius={70} outerRadius={115} paddingAngle={3}>
                  {rollupByService(rows).map((row) => <Cell key={row.service} fill={row.color} />)}
                </Pie>
                <Tooltip formatter={(value) => currency(value)} contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Year 1 referral ramp" eyebrow="Execution math">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="county" tick={{ fontSize: 12, fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                <Bar dataKey={(row) => row.referrals[0]} name="Year 1 referrals" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
