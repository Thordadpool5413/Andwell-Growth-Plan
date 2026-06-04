import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function SourceBadge({ basis }) {
  const { dark } = useDarkMode();
  if (!basis) return null;
  const isCms = basis.toLowerCase().includes("cms");
  return (
    <span
      title={basis}
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        isCms
          ? dark ? "bg-blue-900/50 text-blue-300 ring-1 ring-blue-700/40" : "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80"
          : dark ? "bg-amber-900/40 text-amber-300 ring-1 ring-amber-700/40" : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isCms ? "bg-blue-500" : "bg-amber-500"}`} />
      {isCms ? "CMS" : "Est."}
    </span>
  );
}
