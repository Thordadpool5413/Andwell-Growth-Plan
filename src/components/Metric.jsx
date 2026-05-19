import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Sparkline from "./Sparkline.jsx";

export default function Metric({ label, value, detail, sparkData, sparkColor, confidence = null, className = "" }) {
  const { dark } = useDarkMode();
  
  const getConfidenceBadge = (level) => {
    if (!level) return null;
    const colors = {
      high: 'success',
      medium: 'warning',
      low: 'error',
    };
    const bgColor = colors[level] || 'info';
    return (
      <span className={`text-xs font-semibold px-2 py-1 rounded-full 
        ${dark 
          ? `bg-${bgColor}-900 text-${bgColor}-300` 
          : `bg-${bgColor}-100 text-${bgColor}-700`
        }
      `}>
        {level}
      </span>
    );
  };

  return (
    <div className={`
      rounded-2xl border p-5 shadow-md transition-smooth card-hover
      ${dark 
        ? "border-slate-700 bg-slate-800 shadow-slate-900/30 hover:bg-slate-750" 
        : "border-slate-200 bg-white shadow-slate-100/50 hover:shadow-slate-200/70"}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {label}
        </p>
        <div className="flex items-center gap-2">
          {confidence && getConfidenceBadge(confidence)}
          {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
        </div>
      </div>
      <p className={`
        mt-2 text-3xl font-black 
        ${dark ? "text-white" : "text-slate-950"}
      `}>
        {value}
      </p>
      <p className={`
        mt-2 text-sm leading-6 
        ${dark ? "text-slate-400" : "text-slate-600"}
      `}>
        {detail}
      </p>
    </div>
  );
}
