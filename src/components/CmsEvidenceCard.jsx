import React, { useState } from "react";
import VerificationBadge from "./VerificationBadge.jsx";
import { useDarkMode } from "./DarkModeContext.jsx";

export default function CmsEvidenceCard({ competitor, compact = false }) {
  const { dark } = useDarkMode();
  const [expanded, setExpanded] = useState(false);

  if (!competitor) return null;

  const status = competitor.match_status || "Needs Review";
  const hasWebData = competitor.crawl_status === "success";
  const displayStatus = hasWebData && (status === "CMS Verified") ? "CMS and Website Verified" : status;

  const border = displayStatus === "CMS Verified" || displayStatus === "CMS and Website Verified"
    ? dark ? "border-emerald-800/50" : "border-emerald-200"
    : displayStatus === "Needs Review"
      ? dark ? "border-amber-800/50" : "border-amber-200"
      : dark ? "border-slate-700" : "border-slate-200";

  if (compact) {
    return (
      <div className={`flex items-center gap-2 py-1`}>
        <VerificationBadge status={displayStatus} size="xs" />
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
          <p className={`font-black truncate ${dark ? "text-white" : "text-slate-950"}`}>
            {competitor.provider_name_raw || competitor.name}
          </p>
          <p className={`text-xs mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>
            {competitor.provider_type === "hospice" ? "Hospice" : competitor.provider_type === "homehealth" ? "Home Health" : "Hospice + Home Health"}
          </p>
        </div>
        <VerificationBadge status={displayStatus} />
      </div>

      {competitor.cms_certification_number && (
        <div className={`mt-3 rounded-xl px-3 py-2 text-xs ${dark ? "bg-slate-700/50 text-slate-300" : "bg-slate-50 text-slate-700"}`}>
          <span className={`font-black ${dark ? "text-slate-400" : "text-slate-500"}`}>CCN: </span>
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
            className={`text-[10px] font-black uppercase tracking-wide ${dark ? "text-slate-500 hover:text-slate-400" : "text-slate-400 hover:text-slate-600"}`}
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
