import React, { useState } from "react";
import VerificationBadge from "./VerificationBadge.jsx";
import { useDarkMode } from "./DarkModeContext.jsx";

const TIER_CONFIG = {
  "CMS and Website Verified": {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60",
    dot: "bg-emerald-500",
    label: "CMS + Website Verified",
    tooltip: "Provider identity confirmed in the CMS certification database AND independently corroborated via website intelligence.",
  },
  "CMS Verified": {
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/60",
    dot: "bg-emerald-500",
    label: "CMS Only",
    tooltip: "Provider found and matched in the CMS certification database. Website verification was not available or did not complete.",
  },
  "Needs Review": {
    badge: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/60",
    dot: "bg-amber-400",
    label: "Unverified",
    tooltip: "Provider has not yet been matched against the CMS database. Data reflects the raw provider file only — treat with caution.",
  },
  "Website Verified": {
    badge: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/60",
    dot: "bg-blue-400",
    label: "Website Only",
    tooltip: "Provider identity corroborated via website intelligence, but not yet matched in the CMS certification database.",
  },
};

function TierBadge({ status }) {
  const [open, setOpen] = useState(false);
  const cfg = TIER_CONFIG[status] || TIER_CONFIG["Needs Review"];

  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        role="button"
        aria-label={`Verification tier: ${cfg.label}`}
        className={`inline-flex cursor-help items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${cfg.badge}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
        {cfg.label}
      </span>
      {open && (
        <span className="absolute bottom-full right-0 z-50 mb-1.5 w-60 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-700 shadow-lg dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <span className="mb-0.5 block font-semibold text-slate-900 dark:text-white">Verification tier</span>
          {cfg.tooltip}
        </span>
      )}
    </span>
  );
}

export default function CmsEvidenceCard({ competitor, compact = false }) {
  const { dark } = useDarkMode();
  const [expanded, setExpanded] = useState(false);

  if (!competitor) return null;

  const status = competitor.match_status || "Needs Review";
  const hasWebData = competitor.crawl_status === "success";
  const displayStatus = status;

  const border = displayStatus === "CMS Verified" || displayStatus === "CMS and Website Verified"
    ? dark ? "border-emerald-800/50" : "border-emerald-200"
    : displayStatus === "Needs Review"
      ? dark ? "border-amber-800/50" : "border-amber-200"
      : dark ? "border-slate-700" : "border-slate-200";

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-1`}>
        <VerificationBadge status={displayStatus} size="xs" />
        <TierBadge status={displayStatus} />
        {competitor.match_confidence != null && (
          <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {Math.round(competitor.match_confidence * 100)}% match
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-4 transition-all ${border} ${dark ? "bg-slate-800/50" : "bg-white"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-semibold truncate ${dark ? "text-slate-100" : "text-slate-800"}`}>
            {competitor.provider_name_raw || competitor.name}
          </p>
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {competitor.provider_type === "hospice" ? "Hospice" : competitor.provider_type === "homehealth" ? "Home Health" : "Hospice + Home Health"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <VerificationBadge status={displayStatus} />
          <TierBadge status={displayStatus} />
        </div>
      </div>

      {competitor.cms_certification_number && (
        <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${dark ? "bg-slate-700/50 text-slate-300" : "bg-slate-50 text-slate-700"}`}>
          <span className={`font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>CCN: </span>
          {competitor.cms_certification_number}
        </div>
      )}

      {(competitor.city || competitor.address) && (
        <p className={`mt-2 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          📍 {[competitor.address, competitor.city, "ME", competitor.zip_code].filter(Boolean).join(", ")}
        </p>
      )}

      {competitor.county && (
        <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
          County: {competitor.county}
        </p>
      )}

      {hasWebData && competitor.services_raw?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {competitor.services_raw.map((s) => (
            <span key={s} className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${dark ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
              {s}
            </span>
          ))}
        </div>
      )}

      {competitor.evidence_summary && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-slate-500 hover:text-slate-400" : "text-slate-400 hover:text-slate-600"}`}
          >
            {expanded ? "Hide" : "Show"} CMS evidence
          </button>
          {expanded && (
            <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {competitor.evidence_summary}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        {competitor.last_synced_at && (
          <p className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
            Synced {new Date(competitor.last_synced_at).toLocaleDateString()}
          </p>
        )}
        {competitor.match_confidence != null && (
          <p className={`text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {Math.round(competitor.match_confidence * 100)}% confidence
          </p>
        )}
      </div>
    </div>
  );
}
