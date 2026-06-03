import React, { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Line, Tooltip, XAxis, YAxis, Legend, ReferenceLine } from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import Badge from "../components/Badge.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { number, currency } from "../utils/formatters.js";
import { exportCmsCSV } from "../utils/csvExport.js";
import dashboardData from "../data/dashboardData.js";

const ANDWELL_CCN = "207019";

function generatedDate() {
  return dashboardData.generatedAt || dashboardData.cmsMeta.fetchedAt;
}

function StarRating({ value, dark }) {
  if (value == null) return <span className={dark ? "text-slate-500" : "text-slate-400"}>-</span>;
  const numeric = Number(value);
  const full = Math.floor(numeric);
  const half = numeric - full >= 0.25 && numeric - full < 0.75;
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "*" : i === full && half ? "1/2" : "o")).join(" ");
  return <span className={`font-semibold text-sm ${numeric >= 4 ? "text-amber-500" : numeric >= 3 ? "text-yellow-500" : dark ? "text-slate-400" : "text-slate-500"}`}>{stars} <span className="text-xs font-normal">({numeric.toFixed(1)})</span></span>;
}

function SourceStrip({ dark, label, syncType, count }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-xs ${dark ? "border-slate-700 bg-slate-800/60 text-slate-300" : "border-slate-200 bg-white text-slate-600"}`}>
      <FreshnessChip lastSynced={generatedDate()} label={label} syncType={syncType} />
      <Badge tone="green">Data loaded</Badge>
      <span>{number(count)} Maine records</span>
      <span className={dark ? "text-slate-500" : "text-slate-400"}>Normal users do not need to run sync.</span>
    </div>
  );
}

function EmptyDataState({ dark, dataset }) {
  return (
    <div className={`rounded-xl border p-6 text-sm ${dark ? "border-amber-800 bg-amber-950/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
      <p className="font-semibold">Dataset unavailable</p>
      <p className="mt-1">Expected source: {dataset}. Check the bundled seed file and the npm run refresh:cms-data admin command.</p>
    </div>
  );
}

function QualityRatingsTab({ dark }) {
  const data = dashboardData.homeHealthQuality;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS Home Health Care Agencies (6jpm-sxkc)" />;
  const andwellRow = data.find((row) => row.ccn === ANDWELL_CCN) || data.find((row) => row.normalized_name?.includes("androscoggin"));
  const stateAvg = dashboardData.benchmarks.home_health?.avg_quality_star_rating;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="Quality data" syncType="CMS 6jpm-sxkc" count={data.length} />
      {andwellRow && (
        <div className={`rounded-2xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`rounded px-3 py-1 text-xs font-medium ${dark ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 text-white"}`}>Andwell CMS record</span>
            <p className={`font-semibold text-base ${dark ? "text-slate-100" : "text-slate-800"}`}>{andwellRow.provider_name}</p>
            <StarRating value={andwellRow.star_rating} dark={dark} />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Timely care</p><p className="font-semibold tabular-nums">{andwellRow.timely_care_pct != null ? `${andwellRow.timely_care_pct.toFixed(1)}%` : "-"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Walking improved</p><p className="font-semibold tabular-nums">{andwellRow.walking_improve_pct != null ? `${andwellRow.walking_improve_pct.toFixed(1)}%` : "-"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>State avg star</p><p className="font-semibold tabular-nums">{stateAvg != null ? stateAvg.toFixed(2) : "-"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>County method</p><p className="font-semibold">{andwellRow.county_assignment_method}</p></div>
          </div>
        </div>
      )}
      <Card title="Maine Home Health Agency Rankings" eyebrow={`CMS Quality Star Ratings - dataset 6jpm-sxkc - ${data.length} agencies`}>
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Agency</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3">County</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Star Rating</th><th className="px-4 py-3 text-right">Timely Care</th><th className="px-4 py-3 text-right">Walking Improved</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {[...data].sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0)).map((row, i) => (
                <tr key={row.ccn} className={row.ccn === ANDWELL_CCN ? dark ? "bg-blue-950/40" : "bg-emerald-50" : dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3 font-medium tabular-nums">{i + 1}</td>
                  <td className={`px-4 py-3 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{row.provider_name}{row.ccn === ANDWELL_CCN && <span className="ml-2"><Badge tone="blue">Andwell</Badge></span>}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.ccn}</td>
                  <td className="px-4 py-3">{row.county || "-"}</td>
                  <td className="px-4 py-3">{row.city || "-"}</td>
                  <td className="px-4 py-3"><StarRating value={row.star_rating} dark={dark} /></td>
                  <td className="px-4 py-3 text-right">{row.timely_care_pct != null ? `${row.timely_care_pct.toFixed(1)}%` : "-"}</td>
                  <td className="px-4 py-3 text-right">{row.walking_improve_pct != null ? `${row.walking_improve_pct.toFixed(1)}%` : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function hhvbpDisplayScore(row) {
  if (row.total_performance_score != null) return row.total_performance_score;
  const fields = ["discharged_to_community_score", "avoidable_hospitalizations_score", "ed_use_score", "care_of_patients_score", "communication_score", "overall_rating_score", "willingness_to_recommend_score"];
  const vals = fields.map((field) => row[field]).filter((value) => value != null);
  return vals.length ? vals.reduce((sum, value) => sum + value, 0) / vals.length : null;
}

function HHVBPTab({ dark }) {
  const data = dashboardData.hhvbp;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS HHVBP agency data (56d7-4994)" />;
  const chartData = data.map((row) => ({ ...row, name: (row.provider_name || row.ccn).replace("HOME HEALTH", "HH").replace("HEALTH", "Hlth").slice(0, 28), score: hhvbpDisplayScore(row) })).filter((row) => row.score != null).sort((a, b) => b.score - a.score);
  const stateAvg = chartData.length ? chartData.reduce((sum, row) => sum + row.score, 0) / chartData.length : null;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="HHVBP data" syncType="CMS 56d7-4994" count={data.length} />
      <Card title="HHVBP performance - Maine HHAs" eyebrow="Expanded Home Health Value-Based Purchasing Model">
        <ChartContainer height="h-96" caption="Source: CMS HHVBP agency data 56d7-4994. Composite shown when TPS field is suppressed/unavailable.">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 50, bottom: 16, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis type="number" tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#475569" }} />
            <Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} formatter={(value) => Number(value).toFixed(1)} />
            {stateAvg != null && <ReferenceLine x={stateAvg} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: `ME avg ${stateAvg.toFixed(1)}`, fontSize: 10, fill: dark ? "#fbbf24" : "#d97706" }} />}
            <Bar dataKey="score" name="Performance score" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
      <Card title="HHVBP domain detail" eyebrow="Provider-level measure values">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr><th className="px-4 py-3">Agency</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3 text-right">DTC</th><th className="px-4 py-3 text-right">Hospitalizations</th><th className="px-4 py-3 text-right">ED use</th><th className="px-4 py-3 text-right">Care</th><th className="px-4 py-3 text-right">Communication</th><th className="px-4 py-3 text-right">Recommend</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {data.map((row) => <tr key={row.ccn}><td className="px-4 py-3 font-semibold">{row.provider_name}</td><td className="px-4 py-3 font-mono text-xs">{row.ccn}</td><td className="px-4 py-3 text-right">{row.discharged_to_community_score?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-right">{row.avoidable_hospitalizations_score?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-right">{row.ed_use_score?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-right">{row.care_of_patients_score?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-right">{row.communication_score?.toFixed(1) ?? "-"}</td><td className="px-4 py-3 text-right">{row.willingness_to_recommend_score?.toFixed(1) ?? "-"}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function pickHospiceMeasure(row, contains) {
  const measures = Object.values(row.measures || {});
  return measures.find((measure) => (measure.measure_name || "").toLowerCase().includes(contains)) || measures.find((measure) => measure.score != null);
}

function HospiceQualityTab({ dark }) {
  const data = dashboardData.hospiceCahps.length ? dashboardData.hospiceCahps : dashboardData.hospiceQuality;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS Hospice CAHPS/provider quality (gxki-hrr8, 252m-zfp9)" />;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="Hospice quality" syncType="CMS gxki-hrr8 + 252m-zfp9" count={data.length} />
      <Card title="Maine Hospice CAHPS Quality Scores" eyebrow={`CMS Hospice CAHPS - ${data.length} providers`}>
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3">County</th><th className="px-4 py-3 text-right">Overall / first score</th><th className="px-4 py-3">Measure shown</th><th className="px-4 py-3">Reporting period</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {data.map((row) => {
                const measure = pickHospiceMeasure(row, "overall") || {};
                return <tr key={row.ccn}><td className="px-4 py-3 font-semibold">{row.provider_name}</td><td className="px-4 py-3 font-mono text-xs">{row.ccn}</td><td className="px-4 py-3">{row.county || "-"}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{measure.score != null ? measure.score : "-"}</td><td className="px-4 py-3">{measure.measure_name || "CMS hospice measure"}</td><td className="px-4 py-3">{measure.reporting_period || "-"}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CatalogTab({ dark }) {
  const sources = Object.values(dashboardData.dataSourceStatus.sources || {});
  const hrsa = dashboardData.dataSourceStatus.hrsa?.cmsApprovedHospices;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="CMS datasets configured" value={sources.length} detail="Registry-driven CMS Provider Data endpoints." color="blue" />
        <Metric label="Home health agencies" value={dashboardData.homeHealthAgencies.length} detail="Bundled Maine CMS records." color="emerald" />
        <Metric label="Hospice providers" value={dashboardData.hospiceProviders.length} detail="Bundled Maine CMS records." color="blue" />
        <Metric label="HRSA facilities" value={dashboardData.hrsaHospiceFacilities.length} detail="HRSA facility layer records." color="amber" />
      </div>
      <Card title="Data source status" eyebrow="CMS and HRSA registry">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}><tr><th className="px-4 py-3">Dataset</th><th className="px-4 py-3">Program</th><th className="px-4 py-3">Identifier</th><th className="px-4 py-3 text-right">Maine records</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Purpose</th></tr></thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {[...sources, hrsa].filter(Boolean).map((source) => <tr key={source.identifier || source.name}><td className="px-4 py-3 font-semibold">{source.name}</td><td className="px-4 py-3">{source.program}</td><td className="px-4 py-3 font-mono text-xs">{source.identifier || "HRSA ArcGIS"}</td><td className="px-4 py-3 text-right tabular-nums">{source.maine_records ?? "Configured"}</td><td className="px-4 py-3"><Badge tone={source.status === "loaded" ? "green" : "amber"}>{source.status}</Badge></td><td className="px-4 py-3">{source.purpose}</td></tr>)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function CmsData() {
  const { dark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("market");
  const rows = useMemo(() => Object.entries(cmsCountyMarket).map(([county, market]) => ({ county, ...market, providerDensity: Math.round((market.hh.prov / (market.ffs / 10000)) * 10) / 10, revenuePerUser: Math.round(market.hh.pay / market.hh.users) })).sort((a, b) => b.ffs - a.ffs), []);
  const totalHHPay = rows.reduce((sum, row) => sum + row.hh.pay, 0);
  const tabs = [
    { id: "market", label: "County Market" },
    { id: "quality", label: "Quality Ratings" },
    { id: "hhvbp", label: "HHVBP" },
    { id: "hospice", label: "Hospice Quality" },
    { id: "catalog", label: "Data Sources" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="CMS data" title="County-level Medicare market data + live quality benchmarks">
        CMS, HRSA, provider, quality, HHCAHPS, HHVBP, hospice CAHPS, and benchmark records are bundled into the dashboard experience and load without manual sync.
      </SectionHeader>
      <div className="flex items-center gap-2 flex-wrap"><FreshnessChip lastSynced={generatedDate()} label="CMS/HRSA data" syncType="Generated seed data" /><Badge tone="green">Loaded on page open</Badge></div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{tab.label}</button>)}
      </div>
      {activeTab === "market" && <>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric label="CMS counties loaded" value={rows.length} detail="County market rows from CMS 2022 PUF included in this model." color="blue" />
          <Metric label="HH users" value={number(rows.reduce((sum, row) => sum + row.hh.users, 0))} detail="Medicare home health users across loaded counties." color="emerald" />
          <Metric label="Hospice users" value={number(rows.reduce((sum, row) => sum + row.hos.users, 0))} detail="Medicare hospice users across loaded counties." color="blue" />
          <Metric label="Total HH payments" value={currency(totalHHPay)} detail="Aggregate Medicare home health payments across counties." color="indigo" />
        </div>
        <div className="flex justify-end"><button onClick={() => exportCmsCSV(cmsCountyMarket)} className={`rounded-lg px-4 py-2 text-xs font-medium transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}>Export CSV</button></div>
        <Card title="HH users vs. Hospice users by county" eyebrow="CMS 2022 PUF - beneficiary volumes">
          <ChartContainer height="h-96" caption="Source: CMS Medicare Provider Utilization 2022 PUF - beneficiary counts by county">
            <ComposedChart data={rows} margin={{ left: 10, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} /><XAxis dataKey="county" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }} /><YAxis tick={{ fill: dark ? "#94a3b8" : "#475569" }} /><Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} /><Legend /><Bar dataKey="hh.users" name="HH users" fill={COLORS.blue} radius={[8, 8, 0, 0]} /><Line type="monotone" dataKey="hos.users" name="Hospice users" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} /></ComposedChart>
          </ChartContainer>
        </Card>
        <Card title="Provider density and revenue efficiency" eyebrow="Market intelligence">
          <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-100"}`}><table className="w-full text-left text-sm"><thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}><tr><th className="px-5 py-4">County</th><th className="px-5 py-4 text-right"><Abbr term="FFS">FFS</Abbr></th><th className="px-5 py-4 text-right">HH providers</th><th className="px-5 py-4 text-right">Provider density</th><th className="px-5 py-4 text-right">HH utilization</th><th className="px-5 py-4 text-right">Revenue/user</th><th className="px-5 py-4 text-right">HH payment</th></tr></thead><tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>{rows.map((row) => <tr key={row.county} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}><td className="px-5 py-4 font-semibold">{row.county}</td><td className="px-5 py-4 text-right">{number(row.ffs)}</td><td className="px-5 py-4 text-right">{row.hh.prov}</td><td className="px-5 py-4 text-right font-semibold tabular-nums">{row.providerDensity}/10K</td><td className="px-5 py-4 text-right">{(row.hh.rate * 100).toFixed(1)}%</td><td className="px-5 py-4 text-right font-semibold">{currency(row.revenuePerUser)}</td><td className="px-5 py-4 text-right">{currency(row.hh.pay)}</td></tr>)}</tbody></table></div>
        </Card>
      </>}
      {activeTab === "quality" && <QualityRatingsTab dark={dark} />}
      {activeTab === "hhvbp" && <HHVBPTab dark={dark} />}
      {activeTab === "hospice" && <HospiceQualityTab dark={dark} />}
      {activeTab === "catalog" && <CatalogTab dark={dark} />}
    </div>
  );
}
