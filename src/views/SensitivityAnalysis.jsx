import React, { useMemo } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { getSensitivityAnalysis } from "../utils/calculations.js";
import { currency, percent } from "../utils/formatters.js";

function TornadoBar({ variable, maxRange, dark }) {
  const barWidth = 400;
  const center   = barWidth / 2;
  const scale    = maxRange > 0 ? (barWidth * 0.45) / maxRange : 0;
  const lowWidth = Math.abs(variable.lowDelta) * scale;
  const highWidth= Math.abs(variable.highDelta) * scale;
  const lowX     = variable.lowDelta < 0 ? center - lowWidth : center;

  const formatVal = variable.format === "percent"
    ? (v) => `${(v * 100).toFixed(0)}%`
    : (v) => `$${Math.round(v).toLocaleString()}`;

  return (
    <div className={`rounded-lg border p-4 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-100 bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-800"}`}>{variable.label}</p>
        <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Range: {currency(variable.range)}
        </p>
      </div>
      <svg viewBox={`0 0 ${barWidth} 52`} className="w-full" style={{ height: "52px" }}>
        <rect
          x={Math.min(center - lowWidth, center)}
          y="4"
          width={lowWidth + highWidth}
          height="22"
          rx="6"
          fill={dark ? "#334155" : "#e2e8f0"}
          opacity="0.5"
        />
        <line x1={center} y1="0" x2={center} y2="36" stroke={dark ? "#475569" : "#94a3b8"} strokeWidth="1.5" strokeDasharray="3 3" />
        {variable.lowDelta < 0 && (
          <rect x={lowX} y="8" width={lowWidth} height="14" rx="4" fill="#ef4444" opacity="0.85" />
        )}
        {variable.lowDelta > 0 && (
          <rect x={lowX} y="8" width={lowWidth} height="14" rx="4" fill="#22c55e" opacity="0.85" />
        )}
        {variable.highDelta > 0 && (
          <rect x={center} y="8" width={highWidth} height="14" rx="4" fill="#22c55e" opacity="0.85" />
        )}
        {variable.highDelta < 0 && (
          <rect x={center - highWidth} y="8" width={highWidth} height="14" rx="4" fill="#ef4444" opacity="0.85" />
        )}
        <line x1={center} y1="4" x2={center} y2="26" stroke={dark ? "#94a3b8" : "#475569"} strokeWidth="1.5" />
        <text x={Math.max(lowX - 4, 2)} y="46" textAnchor="end" fontSize="10" fill={dark ? "#94a3b8" : "#64748b"}>
          {formatVal(variable.low)} → {currency(variable.lowDelta)}
        </text>
        <text x={Math.min(center + highWidth + 4, barWidth - 2)} y="46" textAnchor="start" fontSize="10" fill={dark ? "#94a3b8" : "#64748b"}>
          {formatVal(variable.high)} → +{currency(variable.highDelta)}
        </text>
      </svg>
      <div className="mt-1 flex items-center gap-3 text-[10px]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-red-500 opacity-80" />
          <span className={dark ? "text-slate-500" : "text-slate-400"}>Downside</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-emerald-500 opacity-80" />
          <span className={dark ? "text-slate-500" : "text-slate-400"}>Upside</span>
        </span>
        <span className="flex items-center gap-1">
          <span className={`inline-block h-2 w-3 rounded ${dark ? "bg-slate-600" : "bg-slate-200"}`} />
          <span className={dark ? "text-slate-500" : "text-slate-400"}>Confidence band</span>
        </span>
      </div>
    </div>
  );
}

export default function SensitivityAnalysis({ rows }) {
  const { dark } = useDarkMode();
  const analysis    = useMemo(() => getSensitivityAnalysis(rows), [rows]);
  const maxRange    = analysis.length > 0 ? analysis[0].range : 1;
  const baseRevenue = analysis.length > 0 ? analysis[0].baseRevenue : 0;
  const topLever    = analysis[0];
  const worstCase   = analysis.reduce((s, v) => s + v.lowDelta, 0);
  const bestCase    = analysis.reduce((s, v) => s + v.highDelta, 0);

  const scenarios = [
    {
      label:       "Downside scenario",
      sublabel:    "All variables at low bound",
      value:       currency(baseRevenue + worstCase),
      delta:       currency(worstCase),
      pctVsBase:   baseRevenue > 0 ? ((worstCase / baseRevenue) * 100).toFixed(1) : "0",
      accent:      "border-l-red-500",
      bg:          dark ? "bg-red-950/15" : "bg-red-50/60",
      border:      dark ? "border-slate-700/60" : "border-red-100",
      textColor:   dark ? "text-red-400" : "text-red-600",
      icon:        "↓",
    },
    {
      label:       "Base scenario",
      sublabel:    "Default model assumptions",
      value:       currency(baseRevenue),
      delta:       "Model baseline",
      pctVsBase:   "0",
      accent:      "border-l-blue-500",
      bg:          dark ? "bg-blue-950/15" : "bg-blue-50/60",
      border:      dark ? "border-slate-700/60" : "border-blue-100",
      textColor:   dark ? "text-blue-400" : "text-blue-700",
      icon:        "→",
    },
    {
      label:       "Upside scenario",
      sublabel:    "All variables at high bound",
      value:       currency(baseRevenue + bestCase),
      delta:       `+${currency(bestCase)}`,
      pctVsBase:   baseRevenue > 0 ? ((bestCase / baseRevenue) * 100).toFixed(1) : "0",
      accent:      "border-l-emerald-500",
      bg:          dark ? "bg-emerald-950/15" : "bg-emerald-50/60",
      border:      dark ? "border-slate-700/60" : "border-emerald-100",
      textColor:   dark ? "text-emerald-400" : "text-emerald-600",
      icon:        "↑",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Sensitivity analysis" title="What-if revenue impact by variable">
        Each bar shows how Y1 revenue changes when a single variable moves from its low to high bound while all others stay at baseline. Variables are ranked by total revenue impact range. The shaded band shows the full confidence range.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Baseline Y1 revenue"   value={currency(baseRevenue)}              detail="Revenue at default scenario assumptions."          color="indigo" />
        <Metric label="Most sensitive lever"  value={topLever?.label || "—"}             detail={`Revenue range: ${currency(topLever?.range || 0)}`} color="amber" />
        <Metric label="Worst-case total"      value={currency(baseRevenue + worstCase)}  detail={`All variables at low: ${currency(worstCase)}`}     color="amber" />
        <Metric label="Best-case total"       value={currency(baseRevenue + bestCase)}   detail={`All variables at high: +${currency(bestCase)}`}    color="emerald" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((s) => (
          <div key={s.label} className={`rounded-xl border-l-4 border p-5 ${s.accent} ${s.bg} ${s.border}`}>
            <div className="flex items-start justify-between">
              <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{s.label}</p>
              <span className={`text-base font-semibold ${s.textColor}`}>{s.icon}</span>
            </div>
            <p className={`mt-0.5 text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.sublabel}</p>
            <p className={`mt-3 text-2xl font-bold tabular-nums ${s.textColor}`}>{s.value}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>{s.delta}</p>
              {s.pctVsBase !== "0" && (
                <p className={`text-xs font-medium ${s.textColor}`}>
                  {parseFloat(s.pctVsBase) > 0 ? "+" : ""}{s.pctVsBase}% vs base
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card title="Revenue sensitivity tornado" eyebrow="Ranked by impact range">
        <div className={`mb-3 rounded-lg border px-3 py-2 text-xs ${dark ? "border-slate-700/60 bg-slate-800/40 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
          <span className="font-semibold">Range sources: </span>
          <Abbr term="HH">HH</Abbr> reimbursement $2,500–$4,000 (CMS national <Abbr term="HH">HH</Abbr> reimbursement range) · <Abbr term="Conversion Rate">Conversion rate</Abbr> 60–90% (<Abbr term="NAHC">NAHC</Abbr> 2023 industry median 72–78%) · Capture rate 5–20% (internal Andwell planning assumptions; industry first-year median 8–15%) · Hospice reimbursement mirrors CMS hospice per-diem schedule range.
        </div>
        <div className="space-y-3">
          {analysis.map((variable) => (
            <TornadoBar key={variable.key} variable={variable} maxRange={maxRange} dark={dark} />
          ))}
        </div>
      </Card>

      <Card title="Waterfall: baseline to best case" eyebrow="Cumulative revenue build">
        <div className="space-y-2">
          <div className={`flex items-center gap-3 rounded-lg p-3 ${dark ? "bg-slate-700/40" : "bg-slate-50"}`}>
            <div className={`w-40 text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>Baseline</div>
            <div className="flex-1 relative h-5">
              <div className="absolute inset-y-0 left-0 rounded-md bg-blue-600" style={{ width: "50%" }} />
              <div className="absolute inset-y-0 left-0 rounded-md bg-blue-400/30" style={{ width: "55%" }} />
            </div>
            <div className={`w-28 text-right text-sm font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(baseRevenue)}</div>
          </div>
          {analysis.map((variable) => {
            const pct = baseRevenue > 0 ? Math.max(Math.abs(variable.highDelta) / baseRevenue * 100, 2) : 0;
            const bandPct = baseRevenue > 0 ? Math.max(Math.abs(variable.range) / baseRevenue * 100, 2) : 0;
            return (
              <div key={variable.key} className={`flex items-center gap-3 rounded-lg p-3 ${dark ? "bg-slate-700/20" : "bg-white"}`}>
                <div className={`w-40 text-sm ${dark ? "text-slate-300" : "text-slate-600"}`}>{variable.label}</div>
                <div className="flex-1 relative h-5">
                  <div className="absolute inset-y-1 left-0 rounded-md bg-emerald-200/50 dark:bg-emerald-900/30" style={{ width: `${Math.min(bandPct, 50)}%` }} />
                  <div className="absolute inset-y-0 left-0 rounded-md bg-emerald-500/70" style={{ width: `${Math.min(pct, 50)}%` }} />
                </div>
                <div className={`w-28 text-right text-sm font-semibold tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>+{currency(variable.highDelta)}</div>
              </div>
            );
          })}
          <div className={`flex items-center gap-3 rounded-lg p-3 ${dark ? "bg-emerald-950/40 border border-emerald-800/40" : "bg-emerald-50 border border-emerald-200"}`}>
            <div className={`w-40 text-sm font-semibold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Best case</div>
            <div className="flex-1 relative h-5">
              <div className="absolute inset-y-0 left-0 rounded-md bg-emerald-600" style={{ width: "80%" }} />
            </div>
            <div className={`w-28 text-right text-sm font-semibold tabular-nums ${dark ? "text-emerald-400" : "text-emerald-700"}`}>{currency(baseRevenue + bestCase)}</div>
          </div>
        </div>
      </Card>

      <Card title="Variable detail" eyebrow="Full sensitivity breakdown">
        <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/40 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
              <tr>
                <th className="px-5 py-4">Variable</th>
                <th className="px-5 py-4 text-right">Low value</th>
                <th className="px-5 py-4 text-right">Base value</th>
                <th className="px-5 py-4 text-right">High value</th>
                <th className="px-5 py-4 text-right">Low revenue</th>
                <th className="px-5 py-4 text-right">Base revenue</th>
                <th className="px-5 py-4 text-right">High revenue</th>
                <th className="px-5 py-4 text-right">Impact range</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-slate-100"}`}>
              {analysis.map((v, i) => {
                const fmt = v.format === "percent" ? (x) => `${(x * 100).toFixed(0)}%` : (x) => currency(x);
                return (
                  <tr key={v.key} className={dark ? i % 2 === 1 ? "bg-slate-800/40 hover:bg-slate-700/40" : "hover:bg-slate-700/40" : i % 2 === 1 ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{v.label}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-red-400" : "text-red-600"}`}>{fmt(v.low)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{fmt(v.base)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{fmt(v.high)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-red-400" : "text-red-600"}`}>{currency(v.lowRevenue)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-600"}`}>{currency(v.baseRevenue)}</td>
                    <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(v.highRevenue)}</td>
                    <td className={`px-5 py-4 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(v.range)}</td>
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
