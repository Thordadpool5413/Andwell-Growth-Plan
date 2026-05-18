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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Active growth counties"
          value={rows.length}
          detail="County and service line recommendations in the active model."
        />
        <Metric
          label="Year 1 referrals"
          value={number(totals.y1Referrals)}
          detail="Gross referrals needed at a 75 percent conversion baseline."
          sparkData={[totals.y1Referrals, totals.y2Referrals, totals.y3Referrals]}
          sparkColor={COLORS.blue}
        />
        <Metric
          label="Year 1 revenue"
          value={currency(totals.y1Revenue)}
          detail="Modeled Year 1 gross revenue from active lines."
          sparkData={[totals.y1Revenue, totals.y2Revenue, totals.y3Revenue]}
          sparkColor={COLORS.green}
        />
        <Metric
          label="Named competitors"
          value={namedProviderRows.length}
          detail="Home Healthcare and Hospice provider rows loaded into the competitive view."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
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
