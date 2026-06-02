import React from "react";
import Sparkline from "./Sparkline.jsx";
import { useDarkMode } from "./DarkModeContext.jsx";

const ACCENT_MAP = {
  emerald: { light: "border-t-2 border-t-emerald-500", dark: "border-t-2 border-t-emerald-500" },
  amber:   { light: "border-t-2 border-t-amber-500",  dark: "border-t-2 border-t-amber-500" },
  blue:    { light: "border-t-2 border-t-blue-500",   dark: "border-t-2 border-t-blue-500" },
  indigo:  { light: "border-t-2 border-t-blue-500",   dark: "border-t-2 border-t-blue-500" },
  red:     { light: "border-t-2 border-t-red-500",    dark: "border-t-2 border-t-red-500" },
  violet:  { light: "border-t-2 border-t-blue-500",   dark: "border-t-2 border-t-blue-500" },
};

const SOURCE_CONFIG = {
  cms: {
    dot: "bg-emerald-500",
    label: "Source: CMS Provider Files 2022",
    labelClass: { light: "text-slate-400", dark: "text-slate-500" },
  },
  modeled: {
    dot: "bg-amber-400",
    label: "Modeled — internal assumptions",
    labelClass: { light: "text-slate-400", dark: "text-slate-500" },
  },
  derived: {
    dot: "bg-blue-400",
    label: "Derived — NAHC/industry benchmarks",
    labelClass: { light: "text-slate-400", dark: "text-slate-500" },
  },
};

function TrendArrow({ sparkData }) {
  if (!sparkData || sparkData.length < 2) return null;
  const first = sparkData[0];
  const last = sparkData[sparkData.length - 1];
  const diff = last - first;
  const pct = first !== 0 ? Math.abs(Math.round((diff / first) * 100)) : 0;

  if (diff > 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600" title={`+${pct}% over period`}>
      ↑{pct}%
    </span>
  );
  if (diff < 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500" title={`−${pct}% over period`}>
      ↓{pct}%
    </span>
  );
  return <span className="text-xs text-slate-400" title="No change">—</span>;
}

export default function Metric({ label, value, detail, sparkData, sparkColor, color, sourceType }) {
  const { dark } = useDarkMode();
  const accent = color ? ACCENT_MAP[color] : null;
  const src = sourceType ? SOURCE_CONFIG[sourceType] : null;
  const accentClass = accent ? (dark ? accent.dark : accent.light) : "";

  return (
    <div
      className={`rounded-[22px] border p-5 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${accentClass} ${
        dark
          ? "border-slate-700/60 bg-gradient-to-br from-slate-900/85 to-slate-800/65 shadow-sm shadow-slate-950/20"
          : "border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm shadow-slate-200/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[11px] font-semibold leading-snug uppercase tracking-[0.12em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{value}</p>
        <TrendArrow sparkData={sparkData} />
      </div>
      {detail && (
        <p className={`mt-1.5 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-500"}`}>{detail}</p>
      )}
      {src && (
        <p className={`mt-2 flex items-center gap-1.5 text-[11px] ${dark ? src.labelClass.dark : src.labelClass.light}`}>
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${src.dot}`} />
          {src.label}
        </p>
      )}
    </div>
  );
}
