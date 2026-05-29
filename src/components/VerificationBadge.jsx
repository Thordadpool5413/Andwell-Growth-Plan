import React from "react";

const STATUS_CONFIG = {
  "CMS Verified": { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500", icon: "✓" },
  "CMS and Website Verified": { bg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300", dot: "bg-emerald-500", icon: "✓✓" },
  "Website Verified": { bg: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", dot: "bg-blue-400", icon: "W" },
  "Needs Review": { bg: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", dot: "bg-amber-400", icon: "?" },
  "Not Verified by CMS": { bg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", dot: "bg-slate-400", icon: "—" },
  "Duplicate or Alias": { bg: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300", dot: "bg-purple-400", icon: "D" },
  "Archived by User": { bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500", dot: "bg-slate-300", icon: "A" },
  "Not a Direct Competitor": { bg: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500", dot: "bg-slate-300", icon: "N" },
};

export default function VerificationBadge({ status, showLabel = true, size = "sm" }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG["Needs Review"];
  const textSize = size === "xs" ? "text-[10px]" : "text-xs";
  const padding = size === "xs" ? "px-1.5 py-0.5" : "px-2 py-1";
  const dotSize = size === "xs" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-black ${textSize} ${padding} ${config.bg}`}>
      <span className={`${dotSize} rounded-full flex-shrink-0 ${config.dot}`} />
      {showLabel ? status : config.icon}
    </span>
  );
}
