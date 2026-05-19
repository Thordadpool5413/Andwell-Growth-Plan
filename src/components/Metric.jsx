import React from "react";
import Sparkline from "./Sparkline.jsx";

export default function Metric({ label, value, detail, sparkData, sparkColor, confidence = null, className = "" }) {
  const getConfidenceBadge = (level) => {
    if (!level) return null;
    const colors = {
      high: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
      medium: "bg-amber-900/40 border-amber-700/50 text-amber-300",
      low: "bg-red-900/40 border-red-700/50 text-red-300",
    };
    const style = colors[level] || colors.medium;
    return (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${style}`}>
        {level}
      </span>
    );
  };

  return (
    <div className={`
      rounded-lg border border-slate-800/50 bg-slate-900/40 backdrop-blur-sm p-5 
      transition-all duration-200 hover:border-slate-700 hover:bg-slate-800/50
      ${className}
    `}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-semibold text-slate-400">
          {label}
        </p>
        <div className="flex items-center gap-2">
          {confidence && getConfidenceBadge(confidence)}
          {sparkData && <Sparkline data={sparkData} color={sparkColor} />}
        </div>
      </div>
      <p className="text-3xl font-black text-white">
        {value}
      </p>
      <p className="mt-3 text-sm text-slate-400">
        {detail}
      </p>
    </div>
  );
}
