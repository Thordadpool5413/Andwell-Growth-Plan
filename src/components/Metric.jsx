import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

const ACCENT_MAP = {
  emerald: {
    border: "border-t-[2px] border-t-emerald-500",
    glow: { light: "shadow-emerald-100/70", dark: "shadow-emerald-950/30" },
    tint: { light: "from-emerald-50/40 to-white", dark: "from-emerald-950/20 to-slate-900/90" },
  },
  amber: {
    border: "border-t-[2px] border-t-amber-500",
    glow: { light: "shadow-amber-100/70", dark: "shadow-amber-950/30" },
    tint: { light: "from-amber-50/40 to-white", dark: "from-amber-950/20 to-slate-900/90" },
  },
  blue: {
    border: "border-t-[2px] border-t-blue-500",
    glow: { light: "shadow-blue-100/70", dark: "shadow-blue-950/30" },
    tint: { light: "from-blue-50/40 to-white", dark: "from-blue-950/20 to-slate-900/90" },
  },
  indigo: {
    border: "border-t-[2px] border-t-blue-500",
    glow: { light: "shadow-blue-100/70", dark: "shadow-blue-950/30" },
    tint: { light: "from-blue-50/40 to-white", dark: "from-blue-950/20 to-slate-900/90" },
  },
  red: {
    border: "border-t-[2px] border-t-red-500",
    glow: { light: "shadow-red-100/70", dark: "shadow-red-950/30" },
    tint: { light: "from-red-50/40 to-white", dark: "from-red-950/20 to-slate-900/90" },
  },
  violet: {
    border: "border-t-[2px] border-t-violet-500",
    glow: { light: "shadow-violet-100/70", dark: "shadow-violet-950/30" },
    tint: { light: "from-violet-50/40 to-white", dark: "from-violet-950/20 to-slate-900/90" },
  },
};

const DEFAULT_TINT = { light: "from-white to-slate-50/60", dark: "from-slate-900/90 to-slate-800/70" };

const SOURCE_CONFIG = {
  cms: {
    dot: "bg-blue-500",
    label: "Source: CMS Provider Files 2023",
  },
  modeled: {
    dot: "bg-amber-400",
    label: "Modeled — internal assumptions",
  },
  derived: {
    dot: "bg-violet-400",
    label: "Derived — NAHC/industry benchmarks",
  },
};

function TrendArrow({ sparkData }) {
  if (!sparkData || sparkData.length < 2) return null;
  const first = sparkData[0];
  const last = sparkData[sparkData.length - 1];
  const diff = last - first;
  const pct = first !== 0 ? Math.abs(Math.round((diff / first) * 100)) : 0;

  if (diff > 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" title={`+${pct}% over period`}>
      ↑{pct}%
    </span>
  );
  if (diff < 0) return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[11px] font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400" title={`−${pct}% over period`}>
      ↓{pct}%
    </span>
  );
  return <span className="text-xs text-slate-500">—</span>;
}

export default function Metric({ label, value, detail, sparkData, sparkColor, color, sourceType }) {
  const { dark } = useDarkMode();
  const accent = color ? ACCENT_MAP[color] : null;
  const tint = accent ? (dark ? accent.tint.dark : accent.tint.light) : (dark ? DEFAULT_TINT.dark : DEFAULT_TINT.light);
  const borderClass = accent ? accent.border : "";
  const glowClass = accent ? (dark ? accent.glow.dark : accent.glow.light) : "";
  const src = sourceType ? SOURCE_CONFIG[sourceType] : null;

  return (
    <div
      className={`rounded-[18px] border p-4 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-br ${tint} ${borderClass} ${
        dark
          ? `border-slate-700/50 shadow-sm ${glowClass} hover:border-slate-600/60 hover:shadow-md`
          : `border-slate-200/80 shadow-sm ${glowClass} hover:border-slate-300/60 hover:shadow-md`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-[0.16em] leading-tight ${dark ? "text-slate-500" : "text-slate-500"}`}>
          {label}
        </p>
      </div>
      <div className="mt-2.5 flex items-baseline gap-2 flex-wrap">
        <p className={`text-[1.6rem] font-bold tabular-nums leading-none ${dark ? "text-slate-100" : "text-slate-900"}`}>
          {value}
        </p>
        <TrendArrow sparkData={sparkData} />
      </div>
      {detail && (
        <p className={`mt-2 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-600"}`}>{detail}</p>
      )}
      {src && (
        <p className={`mt-2.5 flex items-center gap-1.5 text-[10px] font-medium ${dark ? "text-slate-600" : "text-slate-500"}`}>
          <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${src.dot}`} />
          {src.label}
        </p>
      )}
    </div>
  );
}
