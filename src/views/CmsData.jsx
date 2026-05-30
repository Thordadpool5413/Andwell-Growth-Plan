import React, { useState, useEffect } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line,
  Tooltip, XAxis, YAxis, Legend, BarChart, Cell, ReferenceLine,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { number, currency } from "../utils/formatters.js";
import { exportCmsCSV } from "../utils/csvExport.js";
import CmsDataPanel from "../components/CmsDataPanel.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";

const CMS_LAST_SYNCED = "2026-05-01";
const ANDWELL_CCN = "207019";

async function getCmsToken() {
  try {
    const r = await fetch("/api/ai/token");
    if (!r.ok) return "";
    const { token } = await r.json();
    return token;
  } catch { return ""; }
}

function StarRating({ value, dark }) {
  if (value == null) return <span className={dark ? "text-slate-500" : "text-slate-400"}>—</span>;
  const full = Math.floor(value);
  const half = value - full >= 0.25 && value - full < 0.75;
  const stars = [];
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push("★");
    else if (i === full && half) stars.push("½");
    else stars.push("☆");
  }
  const colorCls = value >= 4 ? (dark ? "text-amber-300" : "text-amber-500")
    : value >= 3 ? (dark ? "text-yellow-400" : "text-yellow-500")
    : (dark ? "text-slate-400" : "text-slate-400");
  return (
    <span className={`font-black text-sm ${colorCls}`}>
      {stars.join("")} <span className="text-xs font-normal">({value})</span>
    </span>
  );
}

function QualityRatingsTab({ dark }) {
  const [data, setData] = useState([]);
  const [synced, setSynced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/hh-quality", { headers: { "x-ai-token": token } });
      if (r.ok) {
        const d = await r.json();
        setData(d.rows || []);
        if (d.rows?.[0]?.synced_at) setSynced(d.rows[0].synced_at);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/sync-quality", {
        method: "POST",
        headers: { "x-ai-token": token },
      });
      const d = await r.json();
      setSyncMsg(d.hh_quality?.error ? `Error: ${d.hh_quality.error}` : `Synced ${d.hh_quality?.upserted ?? 0} agencies`);
      await load();
    } catch (err) {
      setSyncMsg(`Error: ${err.message}`);
    }
    setSyncing(false);
  };

  if (loading) return <div className={`rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>Loading quality data…</div>;

  if (!data.length) {
    return (
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${dark ? "border-amber-800/40 bg-amber-950/20" : "border-amber-200 bg-amber-50"}`}>
        <p className={`font-black ${dark ? "text-amber-300" : "text-amber-900"}`}>No quality data yet</p>
        <p className={`text-sm ${dark ? "text-amber-400" : "text-amber-700"}`}>Run a quality sync to pull live CMS star ratings for all 19 Maine home health agencies.</p>
        <button onClick={runSync} disabled={syncing}
          className="rounded-full px-6 py-2.5 text-sm font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {syncing ? "Syncing…" : "Sync CMS Quality Data"}
        </button>
        {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}
      </div>
    );
  }

  const andwellRow = data.find((r) => r.ccn === ANDWELL_CCN);
  const stateAvg = data.filter((r) => r.star_rating != null).reduce((s, r, _, a) => s + parseFloat(r.star_rating) / a.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {synced && <FreshnessChip lastSynced={synced} label="Quality data" syncType="CMS 6jpm-sxkc" />}
        </div>
        <button onClick={runSync} disabled={syncing}
          className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-50 ${dark ? "bg-slate-700 text-blue-300 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"}`}>
          {syncing ? "Syncing…" : "↻ Refresh"}
        </button>
      </div>
      {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}

      {andwellRow && (
        <div className={`rounded-2xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${dark ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 text-white"}`}>Your agency</span>
            <p className={`font-black text-lg ${dark ? "text-white" : "text-slate-950"}`}>{andwellRow.provider_name}</p>
            <StarRating value={andwellRow.star_rating != null ? parseFloat(andwellRow.star_rating) : null} dark={dark} />
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Timely care</p><p className="font-black">{andwellRow.timely_care_pct != null ? `${parseFloat(andwellRow.timely_care_pct).toFixed(1)}%` : "—"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Medicare cost index</p><p className="font-black">{andwellRow.medicare_spend_ratio != null ? parseFloat(andwellRow.medicare_spend_ratio).toFixed(2) : "—"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>PPR rate</p><p className="font-black">{andwellRow.ppr_rate != null ? `${parseFloat(andwellRow.ppr_rate).toFixed(2)}%` : "—"}</p></div>
            <div><p className={dark ? "text-slate-400" : "text-slate-500"}>State avg star</p><p className="font-black">{stateAvg.toFixed(2)}</p></div>
          </div>
        </div>
      )}

      <Card title="Maine Home Health Agency Rankings" eyebrow={`CMS Quality Star Ratings — dataset 6jpm-sxkc · ${data.length} agencies`}>
        <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">CCN</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Star Rating</th>
                <th className="px-4 py-3 text-right">Timely Care %</th>
                <th className="px-4 py-3 text-right">Walking Improve %</th>
                <th className="px-4 py-3 text-right">Medicare Cost Index</th>
                <th className="px-4 py-3 text-right">PPR Rate</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {data.map((row, i) => {
                const isAndwell = row.ccn === ANDWELL_CCN;
                return (
                  <tr key={row.ccn} className={isAndwell
                    ? dark ? "bg-blue-950/40 border-l-4 border-l-emerald-500" : "bg-emerald-50 border-l-4 border-l-emerald-500"
                    : dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"}>
                    <td className={`px-4 py-3 font-black ${dark ? "text-slate-400" : "text-slate-500"}`}>{i + 1}</td>
                    <td className={`px-4 py-3 ${dark ? "text-white" : "text-slate-950"}`}>
                      <span className="font-black">{row.provider_name || row.ccn}</span>
                      {isAndwell && (
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 text-white"}`}>Your agency</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 font-mono text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{row.ccn}</td>
                    <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>{row.city || "—"}</td>
                    <td className="px-4 py-3"><StarRating value={row.star_rating != null ? parseFloat(row.star_rating) : null} dark={dark} /></td>
                    <td className={`px-4 py-3 text-right ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.timely_care_pct != null ? `${parseFloat(row.timely_care_pct).toFixed(1)}%` : "—"}</td>
                    <td className={`px-4 py-3 text-right ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.walking_improve_pct != null ? `${parseFloat(row.walking_improve_pct).toFixed(1)}%` : "—"}</td>
                    <td className={`px-4 py-3 text-right font-black ${row.medicare_spend_ratio != null && parseFloat(row.medicare_spend_ratio) < 1.0 ? dark ? "text-emerald-400" : "text-emerald-600" : dark ? "text-slate-300" : "text-slate-700"}`}>
                      {row.medicare_spend_ratio != null ? parseFloat(row.medicare_spend_ratio).toFixed(2) : "—"}
                    </td>
                    <td className={`px-4 py-3 text-right ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.ppr_rate != null ? `${parseFloat(row.ppr_rate).toFixed(2)}%` : "—"}</td>
                  </tr>
                );
              })}
              <tr className={`font-semibold ${dark ? "bg-slate-700/30 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                <td className="px-4 py-3" colSpan={4}>State average</td>
                <td className="px-4 py-3"><span className={`font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{stateAvg.toFixed(2)} ★</span></td>
                <td className="px-4 py-3 text-right">—</td>
                <td className="px-4 py-3 text-right">—</td>
                <td className="px-4 py-3 text-right">—</td>
                <td className="px-4 py-3 text-right">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Source: CMS Home Health Care Agencies dataset (6jpm-sxkc) · data.cms.gov/provider-data · Updated 2026-03-05</p>
      </Card>
    </div>
  );
}

function HHVBPTooltip({ active, payload, dark }) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const fmt = (v) => (v != null ? parseFloat(v).toFixed(2) : null);
  const containerCls = dark
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";
  return (
    <div className={`rounded-xl border p-3 text-xs shadow-lg max-w-[220px] space-y-1.5 ${containerCls}`}>
      <p className="font-black text-sm leading-tight">{d.name}</p>
      <p>TPS: <strong>{d.tps.toFixed(1)}</strong>{d.payAdj ? <span className="ml-2 text-emerald-500 font-bold">{d.payAdj}</span> : null}</p>
      <div className={`border-t pt-1 ${dark ? "border-slate-700" : "border-slate-100"}`}>
        <p className={`font-bold mb-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Clinical Outcomes</p>
        {fmt(d.dtc) && <p>Discharge to community: <strong>{fmt(d.dtc)}</strong></p>}
        {fmt(d.ach) && <p>Avoid hospitalizations: <strong>{fmt(d.ach)}</strong></p>}
        {fmt(d.ed) && <p>ED use: <strong>{fmt(d.ed)}</strong></p>}
      </div>
      <div className={`border-t pt-1 ${dark ? "border-slate-700" : "border-slate-100"}`}>
        <p className={`font-bold mb-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>Patient Experience</p>
        {fmt(d.careQuality) && <p>Care of patients: <strong>{fmt(d.careQuality)}</strong></p>}
        {fmt(d.communication) && <p>Communication: <strong>{fmt(d.communication)}</strong></p>}
        {fmt(d.overallRating) && <p>Overall rating: <strong>{fmt(d.overallRating)}</strong></p>}
        {fmt(d.willingness) && <p>Willingness to recommend: <strong>{fmt(d.willingness)}</strong></p>}
      </div>
    </div>
  );
}

function HHVBPTab({ dark }) {
  const [data, setData] = useState([]);
  const [stateAvgTps, setStateAvgTps] = useState(null);
  const [nationalAvgTps, setNationalAvgTps] = useState(null);
  const [synced, setSynced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/hhvbp", { headers: { "x-ai-token": token } });
      if (r.ok) {
        const d = await r.json();
        setData(d.rows || []);
        setStateAvgTps(d.state_avg_tps ?? null);
        setNationalAvgTps(d.national_avg_tps ?? null);
        if (d.rows?.[0]?.synced_at) setSynced(d.rows[0].synced_at);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/sync-quality", {
        method: "POST",
        headers: { "x-ai-token": token },
      });
      const d = await r.json();
      setSyncMsg(d.hhvbp?.error ? `Error: ${d.hhvbp.error}` : `Synced ${d.hhvbp?.upserted ?? 0} agencies`);
      await load();
    } catch (err) {
      setSyncMsg(`Error: ${err.message}`);
    }
    setSyncing(false);
  };

  if (loading) return <div className={`rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>Loading HHVBP data…</div>;

  const andwellRow = data.find((r) => r.ccn === ANDWELL_CCN || r.is_andwell);
  const chartData = data.filter((r) => r.total_performance_score != null).map((r) => ({
    name: (r.provider_name || r.ccn || "").replace("Home Care", "HC").replace("Health", "Hlth").replace("Hospice", "Hosp").slice(0, 24),
    tps: parseFloat(r.total_performance_score),
    isAndwell: r.ccn === ANDWELL_CCN || r.is_andwell,
    payAdj: r.payment_adjustment_pct,
    dtc: r.dtc_achievement_pts,
    ach: r.ach_achievement_pts,
    ed: r.ed_use_achievement_pts,
    careQuality: r.care_quality_achievement_pts,
    communication: r.communication_achievement_pts,
    overallRating: r.overall_rating_achievement_pts,
    willingness: r.willingness_recommend_achievement_pts,
  }));

  if (!data.length) {
    return (
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${dark ? "border-amber-800/40 bg-amber-950/20" : "border-amber-200 bg-amber-50"}`}>
        <p className={`font-black ${dark ? "text-amber-300" : "text-amber-900"}`}>No HHVBP data yet</p>
        <p className={`text-sm ${dark ? "text-amber-400" : "text-amber-700"}`}>Run a quality sync to pull Value-Based Purchasing scores.</p>
        <button onClick={runSync} disabled={syncing}
          className="rounded-full px-6 py-2.5 text-sm font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {syncing ? "Syncing…" : "Sync HHVBP Data"}
        </button>
        {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}
      </div>
    );
  }

  const MEASURE_LABELS = [
    { key: "dtc_achievement_pts", label: "Discharged to Community" },
    { key: "ach_achievement_pts", label: "Avoidable Hospitalizations" },
    { key: "ed_use_achievement_pts", label: "ED Use" },
    { key: "care_quality_achievement_pts", label: "Care of Patients (CAHPS)" },
    { key: "communication_achievement_pts", label: "Communication (CAHPS)" },
    { key: "overall_rating_achievement_pts", label: "Overall Rating (CAHPS)" },
    { key: "willingness_recommend_achievement_pts", label: "Willingness to Recommend" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {synced && <FreshnessChip lastSynced={synced} label="HHVBP data" syncType="CMS 56d7-4994" />}
        </div>
        <button onClick={runSync} disabled={syncing}
          className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-50 ${dark ? "bg-slate-700 text-blue-300 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"}`}>
          {syncing ? "Syncing…" : "↻ Refresh"}
        </button>
      </div>
      {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}

      {andwellRow && (
        <div className={`rounded-2xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${dark ? "bg-emerald-800 text-emerald-300" : "bg-emerald-600 text-white"}`}>Andwell HHVBP</span>
            <p className={`font-black text-lg ${dark ? "text-white" : "text-slate-950"}`}>{andwellRow.provider_name}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className={dark ? "text-slate-400" : "text-slate-500"}>Total Performance Score</p>
              <p className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{andwellRow.total_performance_score != null ? parseFloat(andwellRow.total_performance_score).toFixed(1) : "—"}</p>
            </div>
            <div>
              <p className={dark ? "text-slate-400" : "text-slate-500"}>2026 Payment Adjustment</p>
              <p className={`text-2xl font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{andwellRow.payment_adjustment_pct || "—"}</p>
            </div>
            <div>
              <p className={dark ? "text-slate-400" : "text-slate-500"}>Payment Year</p>
              <p className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{andwellRow.payment_year || "—"}</p>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <Card title="Total Performance Score — All Maine HHAs" eyebrow="HHVBP dataset 56d7-4994 · hover a bar for domain breakdown">
          <ChartContainer height="h-96">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 60, bottom: 16, top: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis
                type="number"
                tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 11 }}
                label={{ value: "Total Performance Score (TPS)", position: "insideBottom", offset: -10, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
              />
              <YAxis type="category" dataKey="name" width={190} tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#475569" }} />
              <Tooltip content={<HHVBPTooltip dark={dark} />} />
              {nationalAvgTps != null && (
                <ReferenceLine
                  x={nationalAvgTps}
                  stroke={dark ? "#f59e0b" : "#d97706"}
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: `US Avg ${nationalAvgTps.toFixed(1)}`, position: "top", fontSize: 10, fill: dark ? "#f59e0b" : "#d97706", fontWeight: 700 }}
                />
              )}
              {stateAvgTps != null && nationalAvgTps !== stateAvgTps && (
                <ReferenceLine
                  x={stateAvgTps}
                  stroke={dark ? "#94a3b8" : "#64748b"}
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{ value: `ME ${stateAvgTps.toFixed(1)}`, position: "insideTopRight", fontSize: 9, fill: dark ? "#94a3b8" : "#64748b" }}
                />
              )}
              <Bar dataKey="tps" name="Total Performance Score" radius={[0, 6, 6, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.isAndwell ? COLORS.blue : COLORS.slate} fillOpacity={entry.isAndwell ? 1 : 0.65} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.blue }} /> Andwell</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.slate, opacity: 0.65 }} /> Competitor</span>
            {nationalAvgTps != null && <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: "#d97706" }} /> US national average</span>}
            {stateAvgTps != null && <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: "#64748b" }} /> ME state average</span>}
          </div>
        </Card>
      )}

      {andwellRow && (
        <Card title="Andwell Achievement Points by Measure" eyebrow="HHVBP measure breakdown">
          <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
            <table className="w-full text-sm">
              <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className="px-4 py-3 text-left">Measure domain</th>
                  <th className="px-4 py-3 text-right">Achievement pts</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {MEASURE_LABELS.map(({ key, label }) => (
                  <tr key={key} className={dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"}>
                    <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</td>
                    <td className={`px-4 py-3 text-right font-black ${andwellRow[key] != null ? dark ? "text-emerald-400" : "text-emerald-700" : dark ? "text-slate-500" : "text-slate-400"}`}>
                      {andwellRow[key] != null ? parseFloat(andwellRow[key]).toFixed(2) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className={`mt-3 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Source: CMS HHVBP Model — Agency Data (56d7-4994) · Updated 2025-12-23</p>
        </Card>
      )}
    </div>
  );
}

function HospiceQualityTab({ dark }) {
  const [data, setData] = useState([]);
  const [synced, setSynced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/hospice-quality", { headers: { "x-ai-token": token } });
      if (r.ok) {
        const d = await r.json();
        setData(d.rows || []);
        if (d.rows?.[0]?.synced_at) setSynced(d.rows[0].synced_at);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const token = await getCmsToken();
      const r = await fetch("/api/cms/sync-quality", {
        method: "POST",
        headers: { "x-ai-token": token },
      });
      const d = await r.json();
      setSyncMsg(d.hospice_quality?.error ? `Error: ${d.hospice_quality.error}` : `Synced ${d.hospice_quality?.upserted ?? 0} records`);
      await load();
    } catch (err) {
      setSyncMsg(`Error: ${err.message}`);
    }
    setSyncing(false);
  };

  if (loading) return <div className={`rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>Loading hospice quality data…</div>;

  if (!data.length) {
    return (
      <div className={`rounded-2xl border p-8 text-center space-y-4 ${dark ? "border-amber-800/40 bg-amber-950/20" : "border-amber-200 bg-amber-50"}`}>
        <p className={`font-black ${dark ? "text-amber-300" : "text-amber-900"}`}>No hospice quality data yet</p>
        <p className={`text-sm ${dark ? "text-amber-400" : "text-amber-700"}`}>Run a quality sync to pull Maine hospice CAHPS survey scores.</p>
        <button onClick={runSync} disabled={syncing}
          className="rounded-full px-6 py-2.5 text-sm font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition">
          {syncing ? "Syncing…" : "Sync Hospice Quality Data"}
        </button>
        {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}
      </div>
    );
  }

  const MEASURE_KEYS = ["RATING_BBV", "RATING_MBV", "EMO_REL_BBV", "EMO_REL_MBV", "EMO_REL_TBV"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          {synced && <FreshnessChip lastSynced={synced} label="Hospice quality" syncType="CMS gxki-hrr8" />}
        </div>
        <button onClick={runSync} disabled={syncing}
          className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-50 ${dark ? "bg-slate-700 text-blue-300 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"}`}>
          {syncing ? "Syncing…" : "↻ Refresh"}
        </button>
      </div>
      {syncMsg && <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{syncMsg}</p>}

      <Card title="Maine Hospice CAHPS Quality Scores" eyebrow={`CMS Hospice CAHPS dataset gxki-hrr8 · ${data.length} providers`}>
        <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">CCN</th>
                <th className="px-4 py-3 text-right">Overall Rating</th>
                <th className="px-4 py-3 text-right">Emotional Support</th>
                <th className="px-4 py-3">Star Rating</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {data.map((row) => {
                const measures = row.measures || {};
                const overallScore = measures["RATING_BBV"]?.score ?? measures["RATING_MBV"]?.score ?? null;
                const emoScore = measures["EMO_REL_BBV"]?.score ?? measures["EMO_REL_MBV"]?.score ?? null;
                const starRating = measures["RATING_BBV"]?.star_rating ?? measures["RATING_MBV"]?.star_rating ?? null;
                return (
                  <tr key={row.ccn} className={dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50"}>
                    <td className={`px-4 py-3 font-black ${dark ? "text-white" : "text-slate-950"}`}>{row.provider_name || row.ccn}</td>
                    <td className={`px-4 py-3 font-mono text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{row.ccn}</td>
                    <td className={`px-4 py-3 text-right font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{overallScore != null ? `${parseFloat(overallScore).toFixed(1)}%` : "—"}</td>
                    <td className={`px-4 py-3 text-right font-black ${dark ? "text-slate-300" : "text-slate-700"}`}>{emoScore != null ? `${parseFloat(emoScore).toFixed(1)}%` : "—"}</td>
                    <td className="px-4 py-3">{starRating ? <StarRating value={parseFloat(starRating)} dark={dark} /> : <span className={dark ? "text-slate-500" : "text-slate-400"}>N/A</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className={`mt-3 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Source: CMS Hospice CAHPS Survey dataset (gxki-hrr8) · data.cms.gov/provider-data · Updated 2026-04-13</p>
      </Card>
    </div>
  );
}

export default function CmsData() {
  const { dark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("market");
  const rows = Object.entries(cmsCountyMarket)
    .map(([county, market]) => ({
      county,
      ...market,
      providerDensity: Math.round((market.hh.prov / (market.ffs / 10000)) * 10) / 10,
      revenuePerUser: Math.round(market.hh.pay / market.hh.users),
    }))
    .sort((a, b) => b.ffs - a.ffs);

  const totalHHPay = rows.reduce((sum, row) => sum + row.hh.pay, 0);

  const tabs = [
    { id: "market", label: "CMS 2022 PUF Market Data" },
    { id: "quality", label: "Quality Ratings" },
    { id: "hhvbp", label: "Value-Based Purchasing" },
    { id: "hospice", label: "Hospice Quality" },
    { id: "catalog", label: "CMS Data Connection" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="CMS data" title="County-level Medicare market data + live quality benchmarks">
        Market data from the CMS 2022 Home Health and Hospice <Abbr term="PUF">Public Use File (PUF)</Abbr>. Quality tabs show live CMS star ratings, HHVBP scores, and hospice CAHPS data pulled directly from the CMS Provider Data Catalog.
      </SectionHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={CMS_LAST_SYNCED} label="CMS data" syncType="PUF 2022" />
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${activeTab === t.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "market" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="CMS counties loaded" value={rows.length} detail="County market rows from CMS 2022 PUF included in this model." color="blue" />
            <Metric label="HH users" value={number(rows.reduce((sum, row) => sum + row.hh.users, 0))} detail="Medicare home health users across all loaded counties." color="emerald" />
            <Metric label="Hospice users" value={number(rows.reduce((sum, row) => sum + row.hos.users, 0))} detail="Medicare hospice users across all loaded counties." color="violet" />
            <Metric label="Total HH payments" value={currency(totalHHPay)} detail="Aggregate Medicare home health payments across all counties." color="indigo" />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => exportCmsCSV(cmsCountyMarket)}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
            >
              Export CSV
            </button>
          </div>

          <Card title="HH users vs. Hospice users by county" eyebrow="CMS 2022 PUF — beneficiary volumes">
            <ChartContainer height="h-96">
                <ComposedChart data={rows} margin={{ left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis
                    dataKey="county"
                    tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }}
                    label={{ value: "County", position: "insideBottom", offset: -12, fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }}
                  />
                  <YAxis
                    tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                    label={{ value: "Beneficiary users", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                  />
                  <Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                  <Legend />
                  <Bar dataKey="hh.users" name="HH users" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="hos.users" name="Hospice users" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
            </ChartContainer>
          </Card>

          <Card title="Provider density and revenue efficiency" eyebrow="Market intelligence">
            <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  <tr>
                    <th className="px-5 py-4">County</th>
                    <th className="px-5 py-4 text-right"><Abbr term="FFS">FFS</Abbr> beneficiaries</th>
                    <th className="px-5 py-4 text-right"><Abbr term="HH">HH</Abbr> providers</th>
                    <th className="px-5 py-4 text-right">Provider density</th>
                    <th className="px-5 py-4 text-right"><Abbr term="HH">HH</Abbr> utilization</th>
                    <th className="px-5 py-4 text-right">Revenue per user</th>
                    <th className="px-5 py-4 text-right">Total <Abbr term="HH">HH</Abbr> payment</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                  {rows.map((row) => (
                    <tr key={row.county} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                      <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{row.county}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.ffs)}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{row.hh.prov}</td>
                      <td className={`px-5 py-4 text-right font-black ${row.providerDensity > 3 ? "text-amber-600" : dark ? "text-emerald-400" : "text-emerald-600"}`}>{row.providerDensity}/10K</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{(row.hh.rate * 100).toFixed(1)}%</td>
                      <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(row.revenuePerUser)}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.hh.pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "quality" && <QualityRatingsTab dark={dark} />}
      {activeTab === "hhvbp" && <HHVBPTab dark={dark} />}
      {activeTab === "hospice" && <HospiceQualityTab dark={dark} />}
      {activeTab === "catalog" && <CmsDataPanel />}
    </div>
  );
}
