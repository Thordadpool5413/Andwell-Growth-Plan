import React, { useState, useEffect } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import CustomTooltip from "../components/CustomTooltip.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import EstBadge from "../components/EstBadge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { namedProviderRows } from "../data/providers.js";
import { rollupByService, getCompetitiveThreatScore } from "../utils/calculations.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { currency, number, percent } from "../utils/formatters.js";

const CMS_LAST_SYNCED = "2026-05-01";

function AtAGlanceIndicator({ label, status, dark }) {
  const colorMap = {
    green: { dot: "bg-emerald-500", text: dark ? "text-emerald-400" : "text-emerald-700", bg: dark ? "bg-emerald-950/40 border-emerald-800/40" : "bg-emerald-50 border-emerald-200" },
    amber: { dot: "bg-amber-500", text: dark ? "text-amber-400" : "text-amber-700", bg: dark ? "bg-amber-950/40 border-amber-800/40" : "bg-amber-50 border-amber-200" },
    red: { dot: "bg-red-500", text: dark ? "text-red-400" : "text-red-700", bg: dark ? "bg-red-950/40 border-red-800/40" : "bg-red-50 border-red-200" },
  };
  const c = colorMap[status] || colorMap.amber;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${c.bg}`}>
      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.dot}`} />
      <span className={`text-xs font-black ${c.text}`}>{label}</span>
    </div>
  );
}

async function getCmsToken() {
  try {
    const r = await fetch("/api/ai/token");
    if (!r.ok) return "";
    const { token } = await r.json();
    return token;
  } catch { return ""; }
}

function QualityKPI({ label, value, sub, dark, color = "emerald" }) {
  const colorMap = {
    emerald: { bg: dark ? "bg-emerald-950/40 border-emerald-800/40" : "bg-emerald-50 border-emerald-200", label: dark ? "text-emerald-400" : "text-emerald-700", value: dark ? "text-white" : "text-slate-950" },
    blue: { bg: dark ? "bg-blue-950/40 border-blue-800/40" : "bg-blue-50 border-blue-200", label: dark ? "text-blue-400" : "text-blue-700", value: dark ? "text-white" : "text-slate-950" },
    amber: { bg: dark ? "bg-amber-950/40 border-amber-800/40" : "bg-amber-50 border-amber-200", label: dark ? "text-amber-400" : "text-amber-700", value: dark ? "text-white" : "text-slate-950" },
    violet: { bg: dark ? "bg-violet-950/40 border-violet-800/40" : "bg-violet-50 border-violet-200", label: dark ? "text-violet-400" : "text-violet-700", value: dark ? "text-white" : "text-slate-950" },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className={`rounded-2xl border p-4 ${c.bg}`}>
      <p className={`text-xs font-black uppercase tracking-wide ${c.label}`}>{label}</p>
      <p className={`mt-1 text-2xl font-black ${c.value}`}>{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{sub}</p>}
    </div>
  );
}

export default function ExecutiveView({ rows, totals }) {
  const { dark } = useDarkMode();
  const [qualitySummary, setQualitySummary] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const r = await fetch("/api/cms/quality-summary", { headers: { "x-ai-token": token } });
        if (r.ok) setQualitySummary(await r.json());
      } catch (_) {}
    })();
  }, []);

  const totalMarket = Object.values(cmsCountyMarket).reduce((s, m) => s + m.hh.users + m.hos.users, 0);
  const y1Penetration = totalMarket > 0 ? totals.y1Starts / totalMarket : 0;

  const avgThreat = Object.keys(cmsCountyMarket)
    .map((c) => getCompetitiveThreatScore(c))
    .filter(Boolean)
    .reduce((s, t, _, a) => s + t.score / a.length, 0);

  const totalFFS = Object.values(cmsCountyMarket).reduce((s, m) => s + m.ffs, 0);
  const revPerBeneficiary = totalFFS > 0 ? Math.round(totals.y1Revenue / totalFFS) : 0;

  const serviceMix = rollupByService(rows);

  const marketStatus = y1Penetration >= 0.05 ? "green" : y1Penetration >= 0.02 ? "amber" : "red";
  const competitionStatus = avgThreat < 40 ? "green" : avgThreat < 60 ? "amber" : "red";
  const financialStatus = totals.y1Revenue > 5000000 ? "green" : totals.y1Revenue > 2000000 ? "amber" : "red";

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Executive view" icon="📊" title="Market opportunity and growth thesis">
        A high-level summary connecting Andwell's market opportunity across 12 Maine counties. Revenue figures are modeled projections based on CMS 2022 beneficiary volumes, internal capture rate assumptions, and NAHC-benchmarked conversion rates. Adjust the Scenario Model to see how changes in these assumptions affect all figures.
      </SectionHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={CMS_LAST_SYNCED} label="CMS data" />
      </div>

      <div className={`flex flex-wrap items-center gap-3 rounded-2xl border px-5 py-3 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-100 bg-slate-50"}`}>
        <p className={`text-xs font-black uppercase tracking-wide mr-1 ${dark ? "text-slate-400" : "text-slate-500"}`}>At a glance</p>
        <AtAGlanceIndicator label="Market Opportunity" status={marketStatus} dark={dark} />
        <AtAGlanceIndicator label="Competitive Position" status={competitionStatus} dark={dark} />
        <AtAGlanceIndicator label="Financial Readiness" status={financialStatus} dark={dark} />
      </div>

      <div className={`rounded-2xl px-6 py-5 ${dark ? "bg-gradient-to-r from-slate-800 to-slate-800/60" : "bg-gradient-to-r from-slate-50 to-white"}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Active growth counties"
            value={rows.length}
            detail="County and service line combinations in the active model."
            color="emerald"
            sourceType="cms"
          />
          <Metric
            label="Year 1 referrals"
            value={number(totals.y1Referrals)}
            detail={<span>Gross referrals at a <EstBadge reason="75% referral-to-start conversion rate — NAHC 2023 median for home health and hospice providers.">Est.</EstBadge> 75% conversion baseline (NAHC median).</span>}
            sparkData={[totals.y1Referrals, totals.y2Referrals, totals.y3Referrals]}
            sparkColor={COLORS.blue}
            color="blue"
            sourceType="modeled"
          />
          <Metric
            label="Year 1 revenue"
            value={currency(totals.y1Revenue)}
            detail="Modeled Year 1 gross revenue from all active service lines."
            sparkData={[totals.y1Revenue, totals.y2Revenue, totals.y3Revenue]}
            sparkColor={COLORS.green}
            color="indigo"
            sourceType="modeled"
          />
          <Metric
            label="Named competitors"
            value={namedProviderRows.length}
            detail="Home Healthcare and Hospice provider rows loaded into the competitive layer."
            color="amber"
            sourceType="cms"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-3xl border-l-4 border-l-emerald-500 border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📈</span>
            <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Market penetration (Y1)</p>
          </div>
          <p className={`mt-2 text-4xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{percent(y1Penetration)}</p>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            <EstBadge reason="Modeled Y1 starts divided by total CMS addressable beneficiary volume — a planning proxy, not observed market share.">Est.</EstBadge>{" "}
            Y1 starts vs total CMS addressable market ({number(totalMarket)} beneficiary users).
          </p>
        </div>
        <div className={`rounded-3xl border-l-4 border-l-amber-500 border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">⚔️</span>
            <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-amber-400" : "text-amber-700"}`}>Avg competitive threat</p>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <p className={`text-4xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{Math.round(avgThreat)}<span className="text-xl">/100</span></p>
            <Badge tone={avgThreat >= 70 ? "red" : avgThreat >= 50 ? "amber" : avgThreat >= 30 ? "blue" : "green"}>
              {avgThreat >= 70 ? "Fortress" : avgThreat >= 50 ? "High" : avgThreat >= 30 ? "Moderate" : "Low"}
            </Badge>
          </div>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Composite weighted score across all 12 target counties.</p>
        </div>
        <div className={`rounded-3xl border-l-4 border-l-indigo-500 border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">💰</span>
            <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-indigo-400" : "text-indigo-700"}`}>Revenue per <Abbr term="FFS">FFS</Abbr> beneficiary</p>
          </div>
          <p className={`mt-2 text-4xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{currency(revPerBeneficiary)}</p>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            <EstBadge reason="Derived: Y1 modeled revenue divided by total CMS Fee-For-Service beneficiary count — not a verified billing figure.">Est.</EstBadge>{" "}
            Y1 revenue efficiency across {number(totalFFS)} <Abbr term="FFS">Fee-For-Service</Abbr> beneficiaries.
          </p>
        </div>
      </div>

      {qualitySummary?.has_data && (
        <div className={`rounded-2xl border p-5 ${dark ? "border-emerald-800/40 bg-slate-800" : "border-emerald-200 bg-white"}`}>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-base">⭐</span>
            <p className={`text-sm font-black uppercase tracking-wide ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Andwell quality position</p>
            <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"}`}>CMS-verified</span>
            {qualitySummary.andwell?.synced_at && (
              <FreshnessChip lastSynced={qualitySummary.andwell.synced_at} label="Quality" syncType="CMS 6jpm-sxkc" />
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <QualityKPI
              label="Quality Star Rating"
              value={qualitySummary.andwell?.star_rating != null ? `${parseFloat(qualitySummary.andwell.star_rating)} ★` : "—"}
              sub="CMS Home Health Care Quality"
              dark={dark}
              color="emerald"
            />
            <QualityKPI
              label="Maine Ranking"
              value={qualitySummary.andwell_rank != null ? `#${qualitySummary.andwell_rank} in Maine` : "—"}
              sub={`of ${qualitySummary.total_maine_agencies} agencies`}
              dark={dark}
              color="blue"
            />
            <QualityKPI
              label="Medicare Cost Index"
              value={qualitySummary.andwell?.medicare_spend_ratio != null ? parseFloat(qualitySummary.andwell.medicare_spend_ratio).toFixed(2) : "—"}
              sub={qualitySummary.andwell?.medicare_spend_ratio != null && parseFloat(qualitySummary.andwell.medicare_spend_ratio) < 1.0 ? "Below national avg (favorable)" : "vs. national avg = 1.0"}
              dark={dark}
              color="amber"
            />
            <QualityKPI
              label="Preventable Readmissions"
              value={qualitySummary.andwell?.ppr_rate != null ? `${parseFloat(qualitySummary.andwell.ppr_rate).toFixed(2)}%` : "—"}
              sub="PPR risk-standardized rate"
              dark={dark}
              color="violet"
            />
          </div>
        </div>
      )}

      <div className={`flex items-start gap-3 rounded-2xl border px-5 py-4 ${dark ? "border-amber-800/50 bg-amber-950/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p className="text-sm leading-6">
          <strong>Provider file share ≠ market share.</strong> The share figures in this dashboard reflect each provider's share of CMS provider file beneficiary volume — <em>not</em> county-attributed claims. True county market share requires county-level claims data not available in the CMS Public Use File. Use share figures for competitive benchmarking only, not revenue attribution.
        </p>
      </div>

      <Card title="Strategic rationale" eyebrow="Executive summary" accent="blue">
        <p className={`text-lg leading-8 ${dark ? "text-slate-300" : "text-slate-700"}`}>
          This dashboard connects Andwell service gaps, CMS market volume, referral math, financial upside, and named provider competition across 12 target Maine counties. The competitive layer reflects actual named Home Healthcare and Hospice providers from the CMS provider file — including Andwell's provider file rank and share. Note: <strong>provider file share is not county market share</strong>; county-attributed claims data would be required to calculate true market share.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Year 1 service mix" eyebrow="Revenue mix — modeled projections">
          <ChartContainer
            height="h-80"
            title="Service revenue distribution"
            caption="Source: modeled projections — CMS beneficiary volumes × capture rates × reimbursement rates"
          >
            <PieChart>
              <Pie
                data={serviceMix}
                dataKey="revenue"
                nameKey="service"
                innerRadius={70}
                outerRadius={115}
                paddingAngle={3}
                label={false}
              >
                {serviceMix.map((row) => <Cell key={row.service} fill={row.color} />)}
              </Pie>
              <CustomTooltip formatter={(value) => currency(value)} />
              <Legend
                formatter={(value) => (
                  <span className={dark ? "text-slate-300" : "text-slate-700"}>{value}</span>
                )}
              />
            </PieChart>
          </ChartContainer>
        </Card>
        <Card title="Year 1 referral ramp by county" eyebrow="Execution math — gross referrals needed">
          <ChartContainer
            height="h-80"
            title="Top 8 counties by referral volume"
            caption="Source: modeled — patient start goals ÷ 75% conversion rate (NAHC 2023 median)"
          >
            <BarChart data={rows.slice(0, 8)} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis
                dataKey="county"
                tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }}
                label={{ value: "County", position: "insideBottom", offset: -12, fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }}
              />
              <YAxis
                tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                label={{ value: "Referrals", angle: -90, position: "insideLeft", fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }}
              />
              <CustomTooltip />
              <Bar dataKey={(row) => row.referrals[0]} name="Year 1 referrals" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card title="3-Year Revenue Trajectory" eyebrow="Growth forecast — modeled projections">
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {[
            { label: "Year 1", value: totals.y1Revenue, color: dark ? "text-blue-400" : "text-blue-700", accent: "border-l-4 border-l-blue-500" },
            { label: "Year 2", value: totals.y2Revenue, color: dark ? "text-purple-400" : "text-purple-700", accent: "border-l-4 border-l-purple-500" },
            { label: "Year 3", value: totals.y3Revenue, color: dark ? "text-emerald-400" : "text-emerald-600", accent: "border-l-4 border-l-emerald-500" },
          ].map((yr) => (
            <div key={yr.label} className={`rounded-2xl border p-4 ${yr.accent} ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
              <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{yr.label}</p>
              <p className={`mt-1 text-2xl font-black ${yr.color}`}>{currency(yr.value)}</p>
              {yr.label !== "Year 1" && totals.y1Revenue > 0 && (
                <p className="mt-0.5 text-xs font-semibold text-emerald-600">
                  +{((yr.value - totals.y1Revenue) / totals.y1Revenue * 100).toFixed(0)}% vs Y1
                </p>
              )}
            </div>
          ))}
        </div>
        <ChartContainer height="h-64" caption="Source: modeled — CMS beneficiary volumes × capture rates × reimbursement rates">
          <AreaChart
            data={[
              { year: "Year 1", revenue: totals.y1Revenue },
              { year: "Year 2", revenue: totals.y2Revenue },
              { year: "Year 3", revenue: totals.y3Revenue },
            ]}
            margin={{ left: 10, right: 10, top: 5 }}
          >
            <defs>
              <linearGradient id="execRevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000000)}M`} tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 11 }} />
            <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={3} fill="url(#execRevGradient)" dot={{ r: 6, fill: "#2563eb", strokeWidth: 2, stroke: dark ? "#1e293b" : "#fff" }} />
          </AreaChart>
        </ChartContainer>
        <div className={`mt-4 flex items-center gap-3 rounded-xl px-4 py-3 ${dark ? "bg-emerald-900/20 border border-emerald-800/30" : "bg-emerald-50 border border-emerald-200"}`}>
          <span className={`text-lg font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>↑</span>
          <span className={`text-sm font-black ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
            {totals.y1Revenue > 0 ? ((totals.y3Revenue - totals.y1Revenue) / totals.y1Revenue * 100).toFixed(0) : 0}% 3-year cumulative growth
          </span>
          <span className={`text-xs ${dark ? "text-emerald-500" : "text-emerald-600"}`}>
            {currency(totals.y1Revenue)} → {currency(totals.y3Revenue)}
          </span>
        </div>
      </Card>
    </div>
  );
}

