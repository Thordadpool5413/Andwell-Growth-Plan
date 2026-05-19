import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export function SkeletonMetric() {
  const { dark } = useDarkMode();
  return (
    <div className={`
      rounded-2xl border p-5 animate-pulse
      ${dark 
        ? "border-slate-700 bg-slate-800" 
        : "border-slate-200 bg-slate-100"}
    `}>
      <div className={`h-4 w-24 rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-10 w-32 rounded mt-3 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-4 w-full rounded mt-4 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
    </div>
  );
}

export function SkeletonCard() {
  const { dark } = useDarkMode();
  return (
    <div className={`
      rounded-2xl border p-6 animate-pulse
      ${dark 
        ? "border-slate-700 bg-slate-800" 
        : "border-slate-200 bg-slate-100"}
    `}>
      <div className={`h-3 w-20 rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-8 w-48 rounded mt-2 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-32 w-full rounded mt-4 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
    </div>
  );
}

export function SkeletonChart() {
  const { dark } = useDarkMode();
  return (
    <div className={`
      rounded-2xl border p-6 animate-pulse
      ${dark 
        ? "border-slate-700 bg-slate-800" 
        : "border-slate-200 bg-slate-100"}
    `}>
      <div className={`h-6 w-32 rounded mb-4 ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
      <div className={`h-64 w-full rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
    </div>
  );
}

export function SkeletonTable() {
  const { dark } = useDarkMode();
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`
          rounded-lg border p-4 animate-pulse
          ${dark 
            ? "border-slate-700 bg-slate-800" 
            : "border-slate-200 bg-slate-100"}
        `}>
          <div className="flex gap-4">
            <div className={`h-4 w-24 rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
            <div className={`h-4 w-32 rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
            <div className={`h-4 w-20 rounded ${dark ? "bg-slate-700" : "bg-slate-200"}`} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Skeleton({ type = "card", count = 1 }) {
  const components = {
    metric: SkeletonMetric,
    card: SkeletonCard,
    chart: SkeletonChart,
    table: SkeletonTable,
  };

  const Component = components[type] || SkeletonCard;

  if (type === "table") {
    return <Component />;
  }

  return (
    <div className={`grid gap-4 ${count > 1 ? "grid-cols-2" : ""}`}>
      {[...Array(count)].map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}
