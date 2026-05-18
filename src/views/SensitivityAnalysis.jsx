import React, { useMemo } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { getSensitivityAnalysis } from "../utils/calculations.js";
import { currency, percent } from "../utils/formatters.js";

function TornadoBar({ variable, maxRange, dark }) {
  const barWidth = 400;
  const center = barWidth / 2;
  const scale = maxRange > 0 ? (barWidth * 0.45) / maxRange : 0;
  const lowWidth = Math.abs(variable.lowDelta) * scale;
  const highWidth = Math.abs(variable.highDelta) * scale;
  const lowX = variable.lowDelta < 0 ? center - lowWidth : center;
  const highX = variable.highDelta > 0 ? center : center - highWidth;

  const formatVal = variable.format === "percent"
    ? (v) => `${(v * 100).toFixed(0)}%`
    : (v) => `$${Math.round(v).toLocaleString()}`;

  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`font-black text-sm ${dark ? "text-white" : "text-slate-950"}`}>{variable.label}</p>
        <p className={`text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Range: {currency(variable.range)}
        </p>
      </div>
      <svg viewBox={`0 0 ${barWidth} 36`} className="w-full h-9">
        <line x1={center} y1="0" x2={center} y2="36" stroke={dark ? "#475569" : "#94a3b8"} strokeWidth="1" strokeDasharray="3 3" />
        {variable.lowDelta < 0 && (
          <rect x={lowX} y="4" width={lowWidth} height="12" rx="4" fill="#ef4444" opacity="0.8" />
        )}
        {variable.lowDelta > 0 && (
          <rect x={lowX} y="4" width={lowWidth} height="12" rx="4" fill="#22c55e" opacity="0.8" />
        )}
        {variable.highDelta > 0 && (
          <rect x={highX} y="4" width={highWidth} height="12" rx="4" fill="#22c55e" opacity="0.8" />
        )}
        {variable.highDelta < 0 && (
          <rect x={highX} y="4" width={highWidth} height="12" rx="4" fill="#ef4444" opacity="0.8" />
        )}
        <text x={Math.max(lowX - 4, 4)} y="28" textAnchor="end" fontSize="9" fill={dark ? "#94a3b8" : "#64748b"}>
          {formatVal(variable.low)} → {currency(variable.lowDelta)}
        </text>
        <text x={Math.min(center + highWidth + 4, barWidth - 4)} y="28" textAnchor="start" fontSize="9" fill={dark ? "#94a3b8" : "#64748b"}>
          {formatVal(variable.high)} → +{currency(variable.highDelta)}
        </text>
      </svg>
    </div>
  );
}

export default function SensitivityAnalysis({ rows }) {
  const { dark } = useDarkMode();
  const analysis = useMemo(() => getSensitivityAnalysis(rows), [rows]);
  const maxRange = analysis.length > 0 ? analysis[0].range : 1;
  const baseRevenue = analysis.length > 0 ? analysis[0].baseRevenue : 0;
  const topLever = analysis[0];
  const worstCase = analysis.reduce((s, v) => s + v.lowDelta, 0);
  const bestCase = analysis.reduce((s, v) => s + v.highDelta, 0);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Sensitivity analysis" title="What-if revenue impact by variable">
        Each bar shows how Y1 revenue changes when a single variable moves from its low to high bound while all others stay at baseline. Variables are ranked by total revenue impact range.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Baseline Y1 revenue" value={currency(baseRevenue)} detail="Revenue at default scenario assumptions." />
        <Metric label="Most sensitive lever" value={topLever?.label || "—"} detail={`Revenue range: ${currency(topLever?.range || 0)}`} />
        <Metric label="Worst-case total" value={currency(baseRevenue + worstCase)} detail={`All variables at low: ${currency(worstCase)}`} />
        <Metric label="Best-case total" value={currency(baseRevenue + bestCase)} detail={`All variables at high: +${currency(bestCase)}`} />
      </div>

      <Card title="Revenue sensitivity tornado" eyebrow="Ranked by impact range">
        <div className="space-y-3">
          {analysis.map((variable) => (
            <TornadoBar key={variable.key} variable={variable} maxRange={maxRange} dark={dark} />
          ))}
        </div>
      </Card>

      <Card title="Waterfall: baseline to best case" eyebrow="Cumulative revenue build">
        <div className="space-y-2">
          <div className={`flex items-center gap-3 rounded-xl p-3 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
            <div className={`w-40 text-sm font-black ${dark ? "text-white" : "text-slate-950"}`}>Baseline</div>
            <div className="flex-1 relative h-6">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-blue-600" style={{ width: "50%" }} />
            </div>
            <div className={`w-28 text-right text-sm font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(baseRevenue)}</div>
          </div>
          {analysis.map((variable) => {
            const pct = baseRevenue > 0 ? Math.max(Math.abs(variable.highDelta) / baseRevenue * 100, 2) : 0;
            return (
              <div key={variable.key} className={`flex items-center gap-3 rounded-xl p-3 ${dark ? "bg-slate-700/30" : "bg-white"}`}>
                <div className={`w-40 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{variable.label}</div>
                <div className="flex-1 relative h-6">
                  <div className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500/70" style={{ width: `${Math.min(pct, 50)}%` }} />
                </div>
                <div className={`w-28 text-right text-sm font-black text-emerald-600`}>+{currency(variable.highDelta)}</div>
              </div>
            );
          })}
          <div className={`flex items-center gap-3 rounded-xl p-3 ${dark ? "bg-emerald-950/50 border border-emerald-800" : "bg-emerald-50 border border-emerald-200"}`}>
            <div className={`w-40 text-sm font-black ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Best case</div>
            <div className="flex-1 relative h-6">
              <div className="absolute inset-y-0 left-0 rounded-lg bg-emerald-600" style={{ width: "80%" }} />
            </div>
            <div className={`w-28 text-right text-sm font-black ${dark ? "text-emerald-400" : "text-emerald-700"}`}>{currency(baseRevenue + bestCase)}</div>
          </div>
        </div>
      </Card>

      <Card title="Variable detail" eyebrow="Full sensitivity breakdown">
        <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <table className="w-full text-left text-sm">
            <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
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
            <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
              {analysis.map((v) => {
                const fmt = v.format === "percent" ? (x) => `${(x * 100).toFixed(0)}%` : (x) => currency(x);
                return (
                  <tr key={v.key} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{v.label}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-red-400" : "text-red-600"}`}>{fmt(v.low)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{fmt(v.base)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{fmt(v.high)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-red-400" : "text-red-600"}`}>{currency(v.lowRevenue)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(v.baseRevenue)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{currency(v.highRevenue)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(v.range)}</td>
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
