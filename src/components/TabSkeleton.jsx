import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function TabSkeleton() {
  const { dark } = useDarkMode();

  const pulse = dark ? "bg-slate-700/50" : "bg-slate-200";
  const card = dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white";

  return (
    <div className="space-y-6 animate-pulse">
      {/* Header bar */}
      <div className={`h-8 w-48 rounded-lg ${pulse}`} />
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className={`h-3 w-20 rounded ${pulse}`} />
          <div className={`mt-3 h-7 w-24 rounded ${pulse}`} />
        </div>
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className={`h-3 w-20 rounded ${pulse}`} />
          <div className={`mt-3 h-7 w-24 rounded ${pulse}`} />
        </div>
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className={`h-3 w-20 rounded ${pulse}`} />
          <div className={`mt-3 h-7 w-24 rounded ${pulse}`} />
        </div>
        <div className={`rounded-xl border p-4 ${card}`}>
          <div className={`h-3 w-20 rounded ${pulse}`} />
          <div className={`mt-3 h-7 w-24 rounded ${pulse}`} />
        </div>
      </div>
      {/* Main content area */}
      <div className={`rounded-xl border p-6 ${card}`}>
        <div className={`h-5 w-40 rounded ${pulse}`} />
        <div className={`mt-4 h-64 w-full rounded-lg ${pulse}`} />
      </div>
    </div>
  );
}
