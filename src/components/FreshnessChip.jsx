import React from "react";

function relativeDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  if (isNaN(date)) return null;
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1 mo ago";
  return `${diffMonths} mo ago`;
}

export default function FreshnessChip({ lastSynced, label = "CMS data", syncType, className = "" }) {
  if (!lastSynced) {
    return (
      <span
        title="This source is configured, but no generated record timestamp is available."
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-400 ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" />
        {label} · Source configured
      </span>
    );
  }

  const rel = relativeDate(lastSynced);
  const date = new Date(lastSynced);

  const displayDate = date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const typeLabel = syncType ? ` · ${syncType}` : "";

  return (
    <span
      title={`Generated ${date.toLocaleDateString()} (${rel})${syncType ? ` · ${syncType}` : ""}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-400 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      {label} · Generated {displayDate}{typeLabel}
    </span>
  );
}
