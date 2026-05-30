import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Sparkline from "./Sparkline.jsx";

const ACCENT_CLASSES = {
  emerald: "border-t-brand-green",
  amber: "border-t-brand-amber",
  indigo: "border-t-brand-blue",
  violet: "border-t-brand-purple",
  blue: "border-t-brand-blue",
};

const SOURCE_CONFIG = {
  cms: {
    dot: "bg-brand-green",
    label: "CMS verified",
    labelClass: "text-emerald-700 dark:text-emerald-400",
  },
  modeled: {
    dot: "bg-brand-amber",
    label: "Modeled",
    labelClass: "text-amber-600 dark:text-amber-400",
  },
  derived: {
    dot: "bg-brand-blue",
    label: "Derived",
    labelClass: "text-blue-600 dark:text-blue-400",
  },
};

function TrendArrow({ sparkData, dark }) {
  if (!sparkData || sparkData.length < 2) return null;
  const first = sparkData[0];
  const last = sparkData[sparkData.length - 1];
  const diff = last - first;
  const pct = first !== 0 ? Math.abs(Math.round((diff / first) * 100)) : 0;

  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-black text-emerald-500" title={`+${pct}% over period`}>
        ↑ <span className="text-[10px]">{pct}%</span>
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-black text-red-500" title={`-${pct}% over period`}>
        ↓ <span className="text-[10px]">{pct}%</span>
      </span>
    );
  }
  return (
    <span className={`text-xs font-black ${dark ? "text-slate-500" : "text-slate-400"}`} title="No change">→</span>
  );
}

export default function Metric({ label, value, detail, sparkData, sparkColor, color, sourceType }) {
  const { dark } = useDarkMode();
  const accentClass = color ? ACCENT_CLASSES[color] : null;
  const src = sourceType ? SOURCE_CONFIG[sourceType] : null;

  return (
    <div className={`rounded-3xl border p-5 shadow-sm transition-all duration-200 cursor-default
      hover:-translate-y-1 hover:shadow-lg
      ${dark
        ? `border-slate-700 bg-slate-800 shadow-slate-900/40 ${accentClass ? `border-t-2 ${accentClass}` : ""}`
        : `border-slate-200 bg-white ${accentClass ? `border-t-2 ${accentClass}` : ""}`
      }`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-bold ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</p>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{value}</p>
        <TrendArrow sparkData={sparkData} dark={dark} />
      </div>
      <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>{detail}</p>
      {src && (
        <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium italic ${src.labelClass}`}>
          <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${src.dot}`} />
          {src.label}
        </p>
      )}
    </div>
  );
}
