import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function CustomTooltip({ active, payload, label, formatter }) {
  const { dark } = useDarkMode();
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={`rounded-2xl border px-3.5 py-3 shadow-xl backdrop-blur-md text-sm ${
      dark
        ? "border-slate-600/70 bg-slate-800/95 text-slate-100 shadow-slate-950/50"
        : "border-slate-200/80 bg-white/95 text-slate-900 shadow-slate-200/60"
    }`}>
      {label !== undefined && (
        <p className={`mb-2 text-[10px] font-bold uppercase tracking-[0.18em] ${dark ? "text-slate-400" : "text-slate-400"}`}>
          {label}
        </p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, i) => {
          const val = formatter ? formatter(entry.value, entry.name, entry) : entry.value;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
              <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{entry.name}:</span>
              <span className={`text-xs font-semibold tabular-nums ${dark ? "text-slate-100" : "text-slate-800"}`}>
                {Array.isArray(val) ? val[0] : val}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
