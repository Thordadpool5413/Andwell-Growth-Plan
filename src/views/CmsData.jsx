import React, { useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, Tooltip, XAxis, YAxis } from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Badge from "../components/Badge.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import dashboardData, { getProviderProfileByCcn, hhvbpDisplayScore } from "../data/dashboardData.js";
import { ANDWELL_CCN } from "../data/andwell.js";
import { number } from "../utils/formatters.js";

function generatedDate() {
  return dashboardData.generatedAt || dashboardData.cmsMeta.fetchedAt;
}

function SourceStrip({ dark, label, source, count }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 text-xs ${dark ? "border-slate-700 bg-slate-800/70 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
      <FreshnessChip lastSynced={generatedDate()} label={label} syncType={source} />
      <Badge tone="green">Data loaded</Badge>
      <span>{number(count)} Maine records</span>
    </div>
  );
}

function EmptyDataState({ dark, dataset }) {
  return (
    <div className={`rounded-xl border p-6 text-sm ${dark ? "border-amber-800 bg-amber-950/30 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
      <p className="font-semibold">Dataset unavailable</p>
      <p className="mt-1">Expected source: {dataset}. The generated bundle does not currently include records for this section.</p>
    </div>
  );
}

function ProviderNameCell({ row, dark }) {
  const profile = getProviderProfileByCcn(row.ccn);
  return (
    <div>
      <p className={`font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>{row.provider_name || profile?.provider_name || "Unknown provider"}</p>
      <p className={`mt-0.5 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>
        {profile?.classification || "Unknown"} · {profile?.classification_confidence || "low"} confidence
      </p>
      {row.ccn === ANDWELL_CCN && <span className="mt-1 inline-flex"><Badge tone="blue">Andwell</Badge></span>}
    </div>
  );
}

function HomeHealthQualityTab({ dark }) {
  const data = dashboardData.homeHealthQuality;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS Home Health Care Agencies (6jpm-sxkc)" />;
  const stateAvg = dashboardData.benchmarks.home_health?.avg_quality_star_rating;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="Home health quality" source="CMS 6jpm-sxkc" count={data.length} />
      <Card title="Home health provider quality" eyebrow="Provider-level CMS quality records">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3">County</th><th className="px-4 py-3">Address</th><th className="px-4 py-3 text-right">Star</th><th className="px-4 py-3 text-right">Timely care</th><th className="px-4 py-3 text-right">Walking improved</th><th className="px-4 py-3">Source</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
              {[...data].sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0)).map((row) => (
                <tr key={row.ccn} className={row.ccn === ANDWELL_CCN ? dark ? "bg-blue-950/30" : "bg-blue-50" : dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3"><ProviderNameCell row={row} dark={dark} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{row.ccn}</td>
                  <td className="px-4 py-3">{row.county || "No county assignment"}</td>
                  <td className="px-4 py-3">{[row.address, row.city, row.zip_code].filter(Boolean).join(", ") || "-"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.star_rating != null ? `${Number(row.star_rating).toFixed(1)} / 5` : "-"}</td>
                  <td className="px-4 py-3 text-right">{row.timely_care_pct != null ? `${row.timely_care_pct.toFixed(1)}%` : "-"}</td>
                  <td className="px-4 py-3 text-right">{row.walking_improve_pct != null ? `${row.walking_improve_pct.toFixed(1)}%` : "-"}</td>
                  <td className="px-4 py-3 text-xs">CMS 6jpm-sxkc · state avg {stateAvg != null ? stateAvg.toFixed(2) : "unavailable"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HhcahpsTab({ dark }) {
  const data = dashboardData.hhcahps;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS HHCAHPS provider data (ccn4-8vby)" />;
  const stateStar = dashboardData.benchmarks.home_health?.avg_hhcahps_summary_star;
  const stateRecommend = dashboardData.benchmarks.home_health?.avg_hhcahps_recommend_pct;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="HHCAHPS survey data" source="CMS ccn4-8vby" count={data.length} />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="HHCAHPS providers" value={data.length} detail="Maine providers with HHCAHPS records." color="blue" sourceType="cms" />
        <Metric label="State avg summary star" value={stateStar != null ? `${stateStar.toFixed(2)} / 5` : "-"} detail="Calculated from bundled Maine HHCAHPS records." color="emerald" sourceType="cms" />
        <Metric label="State avg recommend" value={stateRecommend != null ? `${stateRecommend.toFixed(1)}%` : "-"} detail="Percent who would definitely recommend." color="indigo" sourceType="cms" />
      </div>
      <Card title="HHCAHPS provider survey measures" eyebrow="Patient experience by home health agency">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <tr><th className="px-4 py-3">Provider</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3">County</th><th className="px-4 py-3 text-right">Summary star</th><th className="px-4 py-3 text-right">Professional care</th><th className="px-4 py-3 text-right">Communication</th><th className="px-4 py-3 text-right">Overall care</th><th className="px-4 py-3 text-right">Recommend</th><th className="px-4 py-3">Source</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
              {[...data].sort((a, b) => (b.summary_star_rating || 0) - (a.summary_star_rating || 0)).map((row) => (
                <tr key={row.ccn} className={dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"}>
                  <td className="px-4 py-3"><ProviderNameCell row={row} dark={dark} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{row.ccn}</td>
                  <td className="px-4 py-3">{row.county || "No county assignment"}</td>
                  <td className="px-4 py-3 text-right font-semibold">{row.summary_star_rating ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{row.professional_care_star_rating ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{row.communication_star_rating ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{row.overall_care_star_rating ?? "-"}</td>
                  <td className="px-4 py-3 text-right">{row.recommend_pct != null ? `${row.recommend_pct}%` : "-"}</td>
                  <td className="px-4 py-3 text-xs">CMS ccn4-8vby · high CCN match confidence</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HHVBPTab({ dark }) {
  const data = dashboardData.hhvbp.map((row) => ({ ...row, display_score: hhvbpDisplayScore(row) }));
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS HHVBP agency data (56d7-4994)" />;
  const chartData = data.filter((row) => row.display_score != null).sort((a, b) => b.display_score - a.display_score);
  const stateAvg = chartData.length ? chartData.reduce((sum, row) => sum + row.display_score, 0) / chartData.length : null;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="HHVBP data" source="CMS 56d7-4994" count={data.length} />
      <Card title="HHVBP performance - Maine HHAs" eyebrow="Expanded Home Health Value-Based Purchasing Model">
        <ChartContainer height="h-96" caption="Source: CMS HHVBP agency data 56d7-4994. Composite shown when TPS is suppressed or unavailable.">
          <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 50, bottom: 16, top: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
            <XAxis type="number" tick={{ fill: dark ? "#cbd5e1" : "#475569", fontSize: 11 }} />
            <YAxis type="category" dataKey={(row) => (row.provider_name || row.ccn).slice(0, 30)} width={210} tick={{ fontSize: 10, fill: dark ? "#cbd5e1" : "#475569" }} />
            <Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} formatter={(value) => Number(value).toFixed(1)} />
            {stateAvg != null && <ReferenceLine x={stateAvg} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: `ME avg ${stateAvg.toFixed(1)}`, fontSize: 10, fill: dark ? "#fbbf24" : "#92400e" }} />}
            <Bar dataKey="display_score" name="Available HHVBP score" fill={COLORS.blue} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ChartContainer>
      </Card>
      <Card title="HHVBP provider detail" eyebrow="Provider-level value-based purchasing evidence">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
              <tr><th className="px-4 py-3">Agency</th><th className="px-4 py-3">CCN</th><th className="px-4 py-3">County</th><th className="px-4 py-3 text-right">Score</th><th className="px-4 py-3">Measure basis</th><th className="px-4 py-3">Reporting period</th><th className="px-4 py-3">Source</th></tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
              {data.map((row) => {
                const profile = getProviderProfileByCcn(row.ccn);
                return (
                  <tr key={row.ccn} className={dark ? "hover:bg-slate-800/70" : "hover:bg-slate-50"}>
                    <td className="px-4 py-3"><ProviderNameCell row={row} dark={dark} /></td>
                    <td className="px-4 py-3 font-mono text-xs">{row.ccn}</td>
                    <td className="px-4 py-3">{profile?.county || row.county || "No county assignment"}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{row.display_score != null ? row.display_score.toFixed(1) : "-"}</td>
                    <td className="px-4 py-3">{row.total_performance_score != null ? "Total performance score" : "Composite of available domain measures"}</td>
                    <td className="px-4 py-3">{row.reporting_period || row.payment_year || "-"}</td>
                    <td className="px-4 py-3 text-xs">CMS 56d7-4994 · {row.total_performance_score != null ? "high" : "medium"} confidence</td>
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

function HospiceCahpsTab({ dark }) {
  const data = dashboardData.hospiceCahps;
  if (!data.length) return <EmptyDataState dark={dark} dataset="CMS Hospice CAHPS provider data (gxki-hrr8)" />;
  return (
    <div className="space-y-4">
      <SourceStrip dark={dark} label="Hospice CAHPS" source="CMS gxki-hrr8" count={data.length} />
      <Card title="Hospice CAHPS provider detail" eyebrow="Expandable provider-level measure detail">
        <div className="space-y-3">
          {data.map((row) => {
            const profile = getProviderProfileByCcn(row.ccn);
            const measures = profile?.hospiceCahpsMeasures || Object.entries(row.measures || {}).map(([measure_code, measure]) => ({ measure_code, ...measure }));
            return (
              <details key={row.ccn} className={`rounded-xl border p-4 ${dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white"}`}>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={`font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>{row.provider_name}</p>
                      <p className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>CCN {row.ccn} · {row.county || profile?.county || "No county assignment"} · {profile?.address || "Address unavailable"}</p>
                      <p className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{profile?.classification || "Unknown classification"} · {profile?.classification_confidence || "low"} confidence</p>
                    </div>
                    <Badge tone="green">{measures.length} measures</Badge>
                  </div>
                </summary>
                <div className={`mt-4 overflow-x-auto rounded-lg border ${dark ? "border-slate-700" : "border-slate-200"}`}>
                  <table className="w-full min-w-[900px] text-left text-sm">
                    <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-900 text-slate-300" : "bg-slate-100 text-slate-700"}`}>
                      <tr><th className="px-4 py-3">Measure</th><th className="px-4 py-3">Code</th><th className="px-4 py-3 text-right">Score</th><th className="px-4 py-3">Reporting period</th><th className="px-4 py-3">Source</th></tr>
                    </thead>
                    <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
                      {measures.map((measure) => (
                        <tr key={measure.measure_code}>
                          <td className="px-4 py-3">{measure.measure_name || "Measure name unavailable"}</td>
                          <td className="px-4 py-3 font-mono text-xs">{measure.measure_code}</td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums">{measure.score != null ? measure.score : "-"}</td>
                          <td className="px-4 py-3">{measure.reporting_period || "-"}</td>
                          <td className="px-4 py-3 text-xs">{measure.source_dataset_id || "gxki-hrr8"} · high CCN match confidence</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            );
          })}
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
        <Metric label="HRSA facilities" value={dashboardData.hrsaHospiceFacilities.length} detail="County-assigned HRSA facility records." color="amber" />
      </div>
      <Card title="Data source status" eyebrow="CMS and HRSA registry">
        <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"}`}><tr><th className="px-4 py-3">Dataset</th><th className="px-4 py-3">Program</th><th className="px-4 py-3">Identifier</th><th className="px-4 py-3 text-right">Maine records</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Purpose</th></tr></thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-200"}`}>
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
  const [activeTab, setActiveTab] = useState("quality");
  const tabs = [
    { id: "quality", label: "Home Health Quality" },
    { id: "hhcahps", label: "HHCAHPS" },
    { id: "hhvbp", label: "HHVBP" },
    { id: "hospice", label: "Hospice CAHPS" },
    { id: "catalog", label: "Data Sources" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="CMS data" title="Provider-level CMS, CAHPS, HHVBP, and HRSA evidence">
        Provider, quality, HHCAHPS, HHVBP, Hospice CAHPS, HRSA facility, and benchmark records are bundled into the dashboard experience and load when the page opens.
      </SectionHeader>
      <div className="flex items-center gap-2 flex-wrap"><FreshnessChip lastSynced={generatedDate()} label="CMS/HRSA data" syncType="Generated source registry" /><Badge tone="green">Loaded on page open</Badge></div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"}`}>{tab.label}</button>)}
      </div>
      {activeTab === "quality" && <HomeHealthQualityTab dark={dark} />}
      {activeTab === "hhcahps" && <HhcahpsTab dark={dark} />}
      {activeTab === "hhvbp" && <HHVBPTab dark={dark} />}
      {activeTab === "hospice" && <HospiceCahpsTab dark={dark} />}
      {activeTab === "catalog" && <CatalogTab dark={dark} />}
    </div>
  );
}
