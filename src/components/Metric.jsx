import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Sparkline from "./Sparkline.jsx";

export default function Metric({ label, value, detail, sparkData, sparkColor, confidence = null, className = "" }) {
  const { dark } = useDarkMode();
  
  const getConfidenceBadge = (level) => {
    if (!level) return null;
    const colors = {
      high: { bg: dark ? "bg-success-900/40 border-success-700/50" : "bg-success-100 border-success-300", text: dark ? "text-success-300" : "text-success-700" },
      medium: { bg: dark ? "bg-warning-900/40 border-warning-700/50" : "bg-warning-100 border-warning-300", text: dark ? "text-warning-300" : "text-warning-700" },
      low: { bg: dark ? "bg-error-900/40 border-error-700/50" : "bg-error-100 border-error-300", text: dark ? "text-error-300" : "text-error-700" },
    };
    const style = colors[level] || colors.medium;
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${style.bg} ${style.text}`}>
        {level}
      </span>
    );
  };

  return (
    <div className={`
      rounded-xl border elevation-1 p-5 transition-smooth
      ${dark 
        ? "border-slate-700/50 bg-gradient-to-br from-slate-800/60 to-slate-800/40 hover:from-slate-800/80 hover:to-slate-800/60" 
        : "border-slate-200/50 bg-gradient-to-br from-white/80 to-slate-50/80 hover:from-white hover:to-slate-100"}
      hover:shadow-md hover:scale-[1.01]
      ${className}
    `}>
      <div className="flex items-start justify-between mb-1">
        <p className={`text-body-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
          {label}
        </p>
        <div className="flex items-center gap-2">
          {confidence && getConfidenceBadge(confidence)}
          {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
        </div>
      </div>
      <p className={`
        text-4xl font-black mt-2 
        ${dark ? "text-white" : "text-slate-950"}
      `}>
        {value}
      </p>
      <p className={`
        mt-3 text-body-sm leading-relaxed 
        ${dark ? "text-slate-400" : "text-slate-600"}
      `}>
        {detail}
      </p>
    </div>
  );
}
