import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function CustomTooltip({ active, payload, label, formatter }) {
  const { dark } = useDarkMode();
  if (!active || !payload || !payload.length) return null;

  return (
    <div className={`rounded-xl border px-3 py-2.5 shadow-lg text-sm ${dark ? "border-slate-600 bg-slate-800 text-slate-100" : "border-slate-200 bg-white text-slate-900"}`}>
      {label !== undefined && (
        <p className={`mb-1.5 text-xs font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>{label}</p>
      )}
      {payload.map((entry, i) => {
        const val = formatter ? formatter(entry.value, entry.name, entry) : entry.value;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{entry.name}:</span>
            <span className="text-xs font-black">{Array.isArray(val) ? val[0] : val}</span>
          </div>
        );
      })}
    </div>
  );
}
