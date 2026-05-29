import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Sparkline from "./Sparkline.jsx";

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

export default function Metric({ label, value, detail, sparkData, sparkColor }) {
  const { dark } = useDarkMode();
  return (
    <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800 shadow-slate-900/30" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{value}</p>
        <TrendArrow sparkData={sparkData} dark={dark} />
      </div>
      <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>{detail}</p>
    </div>
  );
}
