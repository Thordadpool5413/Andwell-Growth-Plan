import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Sparkline from "./Sparkline.jsx";

export default function Metric({ label, value, detail, sparkData, sparkColor }) {
  const { dark } = useDarkMode();
  return (
    <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-300 ${dark ? "border-slate-700 bg-slate-800 shadow-slate-900/30" : "border-slate-200 bg-white"}`}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
        {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
      </div>
      <p className={`mt-2 text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{value}</p>
      <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>{detail}</p>
    </div>
  );
}
