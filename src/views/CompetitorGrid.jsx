import React, { useState, useEffect, useMemo } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import VerificationBadge from "../components/VerificationBadge.jsx";
import CmsEvidenceCard from "../components/CmsEvidenceCard.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { getProviderIntelligenceRows, getProviderProfileByCcn } from "../data/dashboardData.js";
import { ANDWELL_CCN, classifyProvider } from "../data/andwell.js";

async function getCmsToken() {
  try {
    const r = await fetch("/api/ai/token");
    if (!r.ok) return "";
    const { token } = await r.json();
    return token;
  } catch { return ""; }
}

function useTrendMap() {
  const [trendMap, setTrendMap] = useState({});
  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const r = await fetch("/api/cms/hh-quality", { headers: { "x-ai-token": token } });
        if (r.ok) {
          const d = await r.json();
          const map = {};
          for (const row of d.rows || []) {
            if (row.ccn) map[row.ccn] = { direction: row.trend_direction || "flat", prev: row.prev_star_rating, current: row.star_rating };
          }
          setTrendMap(map);
        }
      } catch (_) {}
    })();
  }, []);
  return trendMap;
}

function QualityTrendIcon({ ccn, trendMap, dark }) {
  const trend = trendMap[ccn];
  if (!trend || !trend.direction || trend.direction === "flat") {
    return <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`} title="No trend data yet">→</span>;
  }
  if (trend.direction === "up") {
    return <span className={`text-[10px] font-semibold ${dark ? "text-emerald-400" : "text-emerald-600"}`} title="Improving">↑</span>;
  }
  if (trend.direction === "down") {
    return <span className={`text-[10px] font-semibold ${dark ? "text-red-400" : "text-red-600"}`} title="Declining">↓</span>;
  }
  return null;
}

function buildSeededCompetitors(providerType) {
  return getProviderIntelligenceRows({ service: providerType, includeAndwell: false }).map((row, index) => ({
    id: row.id || `provider-file-${index}`,
    name: row.provider_name,
    provider_type: row.provider_type === "Hospice" ? "hospice" : "homehealth",
    known_counties: row.county ? [row.county] : [],
    counties_raw: row.county ? [row.county] : [],
    match_status: row.ccn ? "CMS matched in bundled source data" : "Bundled provider-file presence",
    match_confidence: row.confidence === "high" ? 0.95 : 0.75,
    cms_certification_number: row.ccn,
    certification_date: row.certification_date,
    address: row.address,
    city: row.city,
    zip_code: row.zip_code,
    classification: row.classification,
    classification_confidence: row.classification_confidence,
    quality_snapshot_score: row.hhcahpsEvidence?.recommend_pct != null ? row.hhcahpsEvidence.recommend_pct / 100 : row.quality_star_rating != null ? row.quality_star_rating / 5 : null,
    quality_star_rating: row.quality_star_rating,
    quality_measure_name: row.hhcahpsEvidence?.measure_name || row.hhvbpEvidence?.measure_name || row.hospiceCahpsMeasures?.[0]?.measure_name,
    quality_measure_value: row.hhcahpsEvidence?.measure_value ?? row.hhvbpEvidence?.measure_value ?? row.hospiceCahpsMeasures?.[0]?.score,
    quality_state_benchmark: row.hhcahpsEvidence?.state_benchmark ?? row.hhvbpEvidence?.state_benchmark,
    estimated_beneficiaries: row.beneficiaries || null,
    source_type: row.source_labels.join(" · "),
    high_quality: row.high_quality,
    high_quality_evidence: row.high_quality_evidence,
    missing_reasons: row.missing_reasons,
    services_raw: [row.provider_type],
  }));
}

function isNationalChain(comp) {
  return (comp.classification || classifyProvider({ provider_name: comp.name, parent_company: comp.parent_company }).classification) === "National chain";
}

function resolveCounties(c) {
  if (c.counties_raw?.length) return c.counties_raw;
  if (c.known_counties?.length) return c.known_counties;
  if (c.county) return [c.county];
  return [];
}

function mergeBundledEvidence(competitors, providerType) {
  const bundled = buildSeededCompetitors(providerType);
  return competitors.map((competitor) => {
    const normalized = (competitor.name || "").toLowerCase().slice(0, 14);
    const match = bundled.find((row) => row.name.toLowerCase().includes(normalized) || normalized.includes(row.name.toLowerCase().slice(0, 14)));
    return match ? { ...match, ...competitor, source_type: competitor.source_type || match.source_type } : competitor;
  });
}

const SORT_KEYS = [
  { key: "name", label: "Name" },
  { key: "match_status", label: "CMS Status" },
  { key: "match_confidence", label: "Match conf." },
  { key: "national", label: "National chain" },
  { key: "hospice_cert", label: "Hospice cert" },
  { key: "hh_cert", label: "HH cert" },
  { key: "health_system", label: "Health system" },
  { key: "est_beneficiaries", label: "Est. beneficiaries" },
  { key: "quality_star", label: "Quality star" },
  { key: "counties", label: "Counties" },
  { key: "services", label: "Service lines" },
];

const DIMENSIONS = [
  { key: "ccn", label: "CMS CCN", andwellValue: "CMS Certified", tooltip: "Medicare certification number" },
  { key: "certification_date", label: "Cert. date", andwellValue: "Active", tooltip: "CMS certification date" },
  { key: "hospice_cert", label: "Hospice certified", andwellValue: "Yes", tooltip: "Has an active hospice Medicare certification" },
  { key: "hh_cert", label: "Home health cert", andwellValue: "Yes", tooltip: "Has an active home health Medicare certification" },
  { key: "national_chain", label: "National chain", andwellValue: "No", tooltip: "Lower = better for local focus" },
  { key: "maine_focus", label: "Maine-only focus", andwellValue: "Yes", tooltip: "Local market alignment" },
  { key: "health_system", label: "Health system affil.", andwellValue: "None", tooltip: "Hospital or health-system ownership" },
  { key: "cms_status", label: "CMS verified", andwellValue: "Verified", tooltip: "CMS Provider Data Catalog match" },
  { key: "match_conf", label: "Match confidence", andwellValue: "N/A", tooltip: "CMS name-match confidence" },
  { key: "est_beneficiaries", label: "Est. beneficiaries", andwellValue: "—", tooltip: "Estimated annual Medicare beneficiaries served" },
  { key: "quality_star", label: "Quality star", andwellValue: "5★", tooltip: "CMS quality star rating (1–5)" },
  { key: "counties", label: "Counties served", andwellValue: "Multi-county", tooltip: "Known service counties" },
  { key: "services", label: "Service lines", andwellValue: "3+", tooltip: "Service breadth" },
  { key: "affiliations", label: "Parent affiliation", andwellValue: "None", tooltip: "National chain affiliation" },
];

const COMPETITOR_LEADS = {
  national_chain: (v) => v === "Yes",
  maine_focus: (v) => v === "Yes",
  health_system: (v) => v !== "None" && v !== "—",
  cms_status: (v) => v === "Verified",
  hospice_cert: (v) => v === "Yes",
  hh_cert: (v) => v === "Yes",
  quality_star: (v) => v !== "—",
  est_beneficiaries: (v) => v !== "—",
  counties: (v) => v !== "Unknown" && v !== "—",
  services: (v) => v !== "Unknown" && v !== "—",
  affiliations: (v) => v !== "None" && v !== "—",
};
const ANDWELL_LEADS = {
  national_chain: (v) => v === "No",
  maine_focus: (v) => v === "No",
  health_system: (v) => false,
  affiliations: (v) => v === "None" || v === "—",
};

function getAdvantage(dimKey, compValue) {
  if (COMPETITOR_LEADS[dimKey]?.(compValue)) return "competitor";
  if (ANDWELL_LEADS[dimKey]?.(compValue)) return "andwell";
  return "neutral";
}

function DimCell({ value, dark, isAndwell, dimKey }) {
  const cls = isAndwell
    ? dark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
    : (() => {
      const adv = dimKey ? getAdvantage(dimKey, value) : "neutral";
      if (adv === "competitor") return dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700";
      if (adv === "andwell") return dark ? "bg-emerald-900/30 text-emerald-300" : "bg-emerald-50 text-emerald-700";
      return dark ? "bg-slate-700/40 text-slate-300" : "bg-slate-50 text-slate-600";
    })();
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {value}
    </span>
  );
}

function pickBestMeasure(measures) {
  if (!measures || !measures.length) return null;
  const ORDER = ["hhcahps_patient_satisfaction", "patient_satisfaction", "overall_quality", "overall_confidence"];
  const ranked = [...measures].sort((a, b) => {
    const ai = ORDER.indexOf(a.measure_name ?? "");
    const bi = ORDER.indexOf(b.measure_name ?? "");
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
  return ranked[0];
}

function QualityBadge({ score, starRating, dark }) {
  const star = starRating != null ? parseFloat(starRating) : null;
  if (star != null) {
    if (star >= 4) return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>High quality</span>;
    if (star >= 3) return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-amber-900/50 text-amber-300" : "bg-amber-50 text-amber-700"}`}>Avg</span>;
    return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-red-900/50 text-red-300" : "bg-red-50 text-red-700"}`}>Below avg</span>;
  }
  if (score == null) return null;
  const pct = Math.round(Math.min(Math.max(score, 0), 1) * 100);
  if (pct >= 80) return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-emerald-900/50 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>High quality</span>;
  if (pct >= 60) return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-amber-900/50 text-amber-300" : "bg-amber-50 text-amber-700"}`}>Avg</span>;
  return <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${dark ? "bg-red-900/50 text-red-300" : "bg-red-50 text-red-700"}`}>Below avg</span>;
}

function QualityScoreBar({ score, starRating, measureName, measureValue, nationalBenchmark, dark, isAndwell, compact = false }) {
  const star = starRating != null ? parseFloat(starRating) : null;
  const pct = star != null
    ? Math.round((star / 5) * 100)
    : score != null ? Math.round(Math.min(Math.max(score, 0), 1) * 100) : null;
  const isStarBased = star != null;
  const national = nationalBenchmark != null ? Math.round(Math.min(Math.max(parseFloat(nationalBenchmark) || 0, 0), 1) * 100) : null;

  const barColor = isAndwell
    ? (pct == null ? (dark ? "bg-slate-600" : "bg-slate-300") : "bg-blue-500")
    : pct == null
      ? dark ? "bg-slate-600" : "bg-slate-300"
      : pct >= 80 ? "bg-emerald-500"
      : pct >= 60 ? "bg-amber-500"
      : "bg-red-500";

  const labelColor = isAndwell
    ? (pct == null
        ? (dark ? "text-slate-500" : "text-slate-400")
        : (dark ? "text-blue-300" : "text-blue-700"))
    : pct == null
      ? (dark ? "text-slate-500" : "text-slate-400")
      : pct >= 80 ? (dark ? "text-emerald-400" : "text-emerald-700")
      : pct >= 60 ? (dark ? "text-amber-400" : "text-amber-700")
      : (dark ? "text-red-400" : "text-red-700");

  const displayLabel = isStarBased
    ? "CMS quality stars"
    : measureName === "hhcahps_patient_satisfaction" || measureName === "patient_satisfaction"
      ? "HHCAHPS satisfaction"
      : measureName === "overall_quality"
        ? "Overall quality"
        : measureName === "overall_confidence"
          ? "CMS match quality"
          : "Quality score";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <div className={`h-1.5 w-16 rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-200"}`}>
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct ?? 0}%` }}
          />
        </div>
        <span className={`text-[10px] font-medium tabular-nums ${labelColor}`}>
          {pct != null ? `${pct}%` : "—"}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] font-medium uppercase tracking-wide truncate ${dark ? "text-slate-400" : "text-slate-500"}`}>
          {displayLabel}
        </span>
        <span className={`text-[10px] font-medium tabular-nums shrink-0 ${labelColor}`}>
          {pct != null ? `${pct}%` : "—"}
        </span>
      </div>
      <div className={`h-2 w-full rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-slate-200"}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      {national != null && pct != null && (
        <div className="flex items-center justify-between">
          <span className={`text-[9px] ${dark ? "text-slate-600" : "text-slate-400"}`}>
            Natl. avg: {national}%
          </span>
          {pct > national && (
            <span className={`text-[9px] font-semibold ${dark ? "text-emerald-500" : "text-emerald-600"}`}>↑ above avg</span>
          )}
          {pct < national && (
            <span className={`text-[9px] font-semibold ${dark ? "text-amber-500" : "text-amber-600"}`}>↓ below avg</span>
          )}
        </div>
      )}
      {pct == null && (
        <p className={`text-[9px] ${dark ? "text-slate-600" : "text-slate-400"}`}>Bundled seed unavailable</p>
      )}
    </div>
  );
}

function SortableMatrix({ competitors, dark, providerType }) {
  const [sortKey, setSortKey] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [countiesOpenId, setCountiesOpenId] = useState(null);
  const trendMap = useTrendMap();

  const hasHospiceCert = (c) => c.provider_type === "hospice" || c.provider_type === "both" || (c.cms_certification_number && (c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified") && (c.provider_type !== "homehealth"));
  const hasHHCert = (c) => c.provider_type === "homehealth" || c.provider_type === "both";
  const getHealthSystem = (c) => {
    const HEALTH_SYSTEMS = ["northern light", "mainhealth", "mainehealth", "emhs", "eastern maine", "mercy", "st. mary", "central maine", "mount desert"];
    const hay = `${c.name || ""} ${c.parent_company || ""}`.toLowerCase();
    return HEALTH_SYSTEMS.find((h) => hay.includes(h)) || null;
  };

  const sorted = useMemo(() => {
    return [...competitors].sort((a, b) => {
      let va, vb;
      if (sortKey === "national") { va = isNationalChain(a) ? 1 : 0; vb = isNationalChain(b) ? 1 : 0; }
      else if (sortKey === "counties") { va = resolveCounties(a).length; vb = resolveCounties(b).length; }
      else if (sortKey === "services") { va = a.services_raw?.length || 0; vb = b.services_raw?.length || 0; }
      else if (sortKey === "match_confidence") { va = a.match_confidence || 0; vb = b.match_confidence || 0; }
      else if (sortKey === "hospice_cert") { va = hasHospiceCert(a) ? 1 : 0; vb = hasHospiceCert(b) ? 1 : 0; }
      else if (sortKey === "hh_cert") { va = hasHHCert(a) ? 1 : 0; vb = hasHHCert(b) ? 1 : 0; }
      else if (sortKey === "health_system") { va = getHealthSystem(a) ? 1 : 0; vb = getHealthSystem(b) ? 1 : 0; }
      else if (sortKey === "est_beneficiaries") { va = a.estimated_beneficiaries || 0; vb = b.estimated_beneficiaries || 0; }
      else if (sortKey === "quality_star") {
        va = (a.quality_star_rating || 0) * 100 + (a.quality_snapshot_score != null ? a.quality_snapshot_score * 20 : 0);
        vb = (b.quality_star_rating || 0) * 100 + (b.quality_snapshot_score != null ? b.quality_snapshot_score * 20 : 0);
      }
      else { va = (a[sortKey] || "").toString().toLowerCase(); vb = (b[sortKey] || "").toString().toLowerCase(); }
      const cmp = typeof va === "number" ? va - vb : va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [competitors, sortKey, sortAsc]);

  const toggle = (key) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const thCls = `px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`;
  const arrow = (key) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  const cmsStatus = (c) => {
    if (c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified") return "Verified";
    if (c.match_status === "Not Verified by CMS") return "Not verified";
    return "Source pending";
  };

  return (
    <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
      <table className="w-full text-sm min-w-[900px]">
        <thead className={dark ? "bg-slate-800" : "bg-slate-50"}>
          <tr>
            {SORT_KEYS.map((sk) => (
              <th key={sk.key} className={thCls} onClick={() => toggle(sk.key)}>
                {sk.label}{arrow(sk.key)}
              </th>
            ))}
            <th className={`px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Evidence</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
          {sorted.map((comp) => {
            const national = isNationalChain(comp);
            const status = cmsStatus(comp);
            const expanded = expandedId === (comp.id || comp.name);
            return (
              <React.Fragment key={comp.id || comp.name}>
                <tr className={dark ? "hover:bg-slate-800/50" : "hover:bg-slate-50"}>
                  <td className={`px-4 py-3 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>
                    {comp.name}
                    {comp.parent_company && (
                      <p className={`text-[10px] font-normal ${dark ? "text-slate-400" : "text-slate-500"}`}>{comp.parent_company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={comp.match_status || "Source pending"} size="xs" />
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    {comp.match_confidence != null ? `${Math.round(comp.match_confidence * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {national
                      ? <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-red-900/40 text-red-300" : "bg-red-50 text-red-700"}`}>National</span>
                      : <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Regional</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {hasHospiceCert(comp)
                      ? <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Yes</span>
                      : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {hasHHCert(comp)
                      ? <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Yes</span>
                      : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>—</span>}
                  </td>
                  <td className={`px-4 py-3 text-[11px] ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {getHealthSystem(comp) ? <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700"}`}>{getHealthSystem(comp)}</span> : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>None</span>}
                  </td>
                  <td className={`px-4 py-3 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {comp.estimated_beneficiaries ? comp.estimated_beneficiaries.toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 min-w-[120px]">
                      <div className="flex items-center gap-1.5">
                        {comp.quality_star_rating ? (
                          <span className={`text-[11px] font-semibold ${dark ? "text-amber-300" : "text-amber-600"}`}>{parseFloat(comp.quality_star_rating).toFixed(1)} ★</span>
                        ) : null}
                        {comp.cms_certification_number && (
                          <QualityTrendIcon ccn={comp.cms_certification_number} trendMap={trendMap} dark={dark} />
                        )}
                      </div>
                      <QualityScoreBar
                        score={comp.quality_snapshot_score}
                        starRating={comp.quality_star_rating}
                        measureName={comp.quality_measure_name}
                        measureValue={comp.quality_measure_value}
                        nationalBenchmark={comp.quality_national_benchmark}
                        dark={dark}
                        isAndwell={false}
                        compact
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const counties = resolveCounties(comp);
                      const cid = comp.id || comp.name;
                      const open = countiesOpenId === cid;
                      if (!counties.length) return <span className={`text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>—</span>;
                      return (
                        <div>
                          <button
                            onClick={() => setCountiesOpenId(open ? null : cid)}
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${dark ? "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                            title="Click to view county list"
                          >
                            {counties.length} {counties.length === 1 ? "county" : "counties"} {open ? "▲" : "▼"}
                          </button>
                          {open && (
                            <div className={`mt-1.5 rounded-xl p-2 text-[10px] leading-relaxed ${dark ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                              {counties.join(", ")}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {comp.services_raw?.length ? `${comp.services_raw.length} lines` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedId(expanded ? null : (comp.id || comp.name))}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                    >
                      {expanded ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>
                {expanded && (
                  <tr className={dark ? "bg-slate-800/30" : "bg-slate-50/80"}>
                    <td colSpan={12} className="px-4 py-3">
                      <CmsEvidenceCard competitor={comp} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const CARD_SORT_OPTIONS = [
  { key: "default",            label: "Default order" },
  { key: "quality_desc",       label: "Quality score: high → low" },
  { key: "beneficiaries_desc", label: "Beneficiaries: high → low" },
  { key: "name_asc",           label: "Name: A → Z" },
];

function ComparisonColumns({ competitors, dark, providerType, page, PAGE_SIZE, andwellQuality }) {
  const [expandedId, setExpandedId] = useState(null);
  const [cardSort, setCardSort] = useState("default");
  const [countiesOpenId, setCountiesOpenId] = useState(null);
  const trendMap = useTrendMap();

  const sorted = useMemo(() => {
    if (cardSort === "default") return competitors;
    return [...competitors].sort((a, b) => {
      if (cardSort === "quality_desc") {
        const qa = a.quality_snapshot_score ?? -1;
        const qb = b.quality_snapshot_score ?? -1;
        return qb - qa;
      }
      if (cardSort === "beneficiaries_desc") {
        return (b.estimated_beneficiaries || 0) - (a.estimated_beneficiaries || 0);
      }
      if (cardSort === "name_asc") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [competitors, cardSort]);

  const paged = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const hasHospiceCertC = (c) => c.provider_type === "hospice" || c.provider_type === "both" || (c.cms_certification_number && (c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified") && c.provider_type !== "homehealth");
  const hasHHCertC = (c) => c.provider_type === "homehealth" || c.provider_type === "both";
  const getHealthSystemC = (c) => {
    const HEALTH_SYSTEMS = ["northern light", "mainhealth", "mainehealth", "emhs", "eastern maine", "mercy", "st. mary", "central maine", "mount desert"];
    const hay = `${c.name || ""} ${c.parent_company || ""}`.toLowerCase();
    return HEALTH_SYSTEMS.find((h) => hay.includes(h)) || null;
  };

  const getCompValue = (comp, dim) => {
    const national = isNationalChain(comp);
    const status = comp.match_status || "Source pending";
    const countiesList = resolveCounties(comp);
    const counties = countiesList.length;
    const services = comp.services_raw?.length || 0;
    switch (dim.key) {
      case "ccn": return comp.cms_certification_number || "—";
      case "certification_date": return comp.certification_date || "Unavailable: certification date not present in matched bundled profile";
      case "hospice_cert": return hasHospiceCertC(comp) ? "Yes" : "—";
      case "hh_cert": return hasHHCertC(comp) ? "Yes" : "—";
      case "national_chain": return national ? "Yes" : "No";
      case "maine_focus": return national ? "No" : "Likely";
      case "health_system": return getHealthSystemC(comp) || "None";
      case "cms_status": return status === "CMS Verified" || status === "CMS and Website Verified" ? "Verified" : "Unconfirmed";
      case "match_conf": return comp.match_confidence != null ? `${Math.round(comp.match_confidence * 100)}%` : "—";
      case "est_beneficiaries": return comp.estimated_beneficiaries ? comp.estimated_beneficiaries.toLocaleString() : "—";
      case "quality_star": return comp.quality_star_rating ? `${comp.quality_star_rating}★` : "N/A";
      case "counties": return counties > 0 ? `${counties} ${counties === 1 ? "county" : "counties"}` : "Unknown";
      case "services": return services > 0 ? `${services} lines` : "Unknown";
      case "affiliations": return comp.parent_company || (national ? "National chain" : "None");
      default: return "—";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <label className={`text-[11px] font-medium uppercase tracking-wide shrink-0 ${dark ? "text-slate-400" : "text-slate-500"}`}>
          Sort by
        </label>
        <select
          value={cardSort}
          onChange={(e) => setCardSort(e.target.value)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${dark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}
        >
          {CARD_SORT_OPTIONS.map((opt) => (
            <option key={opt.key} value={opt.key}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: `${(paged.length + 1) * 200}px` }}>
        <div className="w-48 shrink-0">
          <div className={`rounded-xl border-2 p-4 ${dark ? "border-blue-700 bg-blue-950/30" : "border-blue-400 bg-blue-50"}`}>
            <div className="mb-3">
              <p className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>Andwell</p>
              <p className={`text-sm font-semibold mt-0.5 leading-5 ${dark ? "text-slate-100" : "text-slate-800"}`}>Andwell Health Partners</p>
              <p className={`text-[10px] mt-0.5 ${dark ? "text-blue-400" : "text-blue-600"}`}>Maine-born, Maine-focused</p>
            </div>
            <div className="space-y-2">
              {DIMENSIONS.map((dim) => (
                <div key={dim.key} className="flex items-center justify-between gap-1 text-[11px]">
                  <span className={`${dark ? "text-slate-400" : "text-slate-500"} truncate`} title={dim.tooltip}>{dim.label}</span>
                  <DimCell value={dim.andwellValue} isAndwell dark={dark} />
                </div>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t ${dark ? "border-slate-700" : "border-blue-200"}`}>
              <QualityScoreBar
                score={andwellQuality?.measure_score ?? null}
                measureName={andwellQuality?.measure_name ?? "hhcahps_patient_satisfaction"}
                measureValue={andwellQuality?.measure_value ?? null}
                nationalBenchmark={andwellQuality?.benchmark_national_value ?? null}
                dark={dark}
                isAndwell
              />
            </div>
          </div>
        </div>

        {paged.map((comp) => {
          const national = isNationalChain(comp);
          const expanded = expandedId === (comp.id || comp.name);
          const status = comp.match_status || "Source pending";
          const borderCls = status === "CMS Verified" || status === "CMS and Website Verified"
            ? dark ? "border-emerald-800/40" : "border-emerald-200"
            : dark ? "border-slate-700" : "border-slate-200";
          return (
            <div key={comp.id || comp.name} className={`w-48 shrink-0 rounded-xl border p-4 ${borderCls} ${dark ? "bg-slate-800/50" : "bg-white"}`}>
              <div className="mb-3">
                <div className="flex flex-wrap gap-1 mb-1">
                  {national && (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${dark ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"}`}>National</span>
                  )}
                  {comp.cms_only && (
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium uppercase ${dark ? "bg-blue-900/40 text-blue-400" : "bg-blue-50 text-blue-600"}`}>CMS discovered</span>
                  )}
                  <QualityBadge score={comp.quality_snapshot_score} starRating={comp.quality_star_rating} dark={dark} />
                </div>
                <p className={`text-sm font-semibold leading-5 ${dark ? "text-slate-100" : "text-slate-800"}`}>{comp.name}</p>
                {comp.parent_company && <p className={`text-[10px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{comp.parent_company}</p>}
                <div className="mt-1.5">
                  <VerificationBadge status={status} size="xs" />
                </div>
              </div>
              <div className="space-y-2">
                {DIMENSIONS.map((dim) => {
                  if (dim.key === "counties") {
                    const cid = comp.id || comp.name;
                    const countyList = resolveCounties(comp);
                    const open = countiesOpenId === cid;
                    return (
                      <div key={dim.key} className="text-[11px]">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`${dark ? "text-slate-400" : "text-slate-500"} truncate`} title={dim.tooltip}>{dim.label}</span>
                          {countyList.length > 0 ? (
                            <button
                              onClick={() => setCountiesOpenId(open ? null : cid)}
                              className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${dark ? "bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800/50" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                              title="Click to view county list"
                            >
                              {countyList.length} {countyList.length === 1 ? "county" : "counties"} {open ? "▲" : "▼"}
                            </button>
                          ) : (
                            <DimCell value="Unknown" dark={dark} dimKey={dim.key} />
                          )}
                        </div>
                        {open && (
                          <div className={`mt-1.5 rounded-xl p-2 text-[10px] leading-relaxed ${dark ? "bg-slate-900 text-slate-300 border border-slate-700" : "bg-slate-50 text-slate-600 border border-slate-200"}`}>
                            {countyList.join(", ")}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={dim.key} className="flex items-center justify-between gap-1 text-[11px]">
                      <span className={`${dark ? "text-slate-400" : "text-slate-500"} truncate`} title={dim.tooltip}>{dim.label}</span>
                      <DimCell value={getCompValue(comp, dim)} dark={dark} dimKey={dim.key} />
                    </div>
                  );
                })}
              </div>
              <div className={`mt-3 pt-3 border-t ${dark ? "border-slate-700" : "border-slate-100"}`}>
                {comp.quality_star_rating != null && (
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className={`text-xs font-semibold tabular-nums ${dark ? "text-amber-300" : "text-amber-600"}`}>{parseFloat(comp.quality_star_rating).toFixed(1)} ★</span>
                    {comp.cms_certification_number && (
                      <QualityTrendIcon ccn={comp.cms_certification_number} trendMap={trendMap} dark={dark} />
                    )}
                    <span className={`text-[9px] ${dark ? "text-slate-500" : "text-slate-400"}`}>CMS star rating</span>
                  </div>
                )}
                <QualityScoreBar
                  score={comp.quality_snapshot_score != null ? comp.quality_snapshot_score : null}
                  starRating={comp.quality_star_rating}
                  measureName={comp.quality_measure_name}
                  measureValue={comp.quality_measure_value}
                  nationalBenchmark={comp.quality_national_benchmark}
                  stateBenchmark={comp.quality_state_benchmark}
                  dark={dark}
                  isAndwell={false}
                />
              </div>
              {expanded && <CmsEvidenceCard competitor={comp} />}
              <button
                onClick={() => setExpandedId(expanded ? null : (comp.id || comp.name))}
                className={`mt-3 w-full rounded-lg py-1.5 text-[10px] font-medium uppercase tracking-wide transition ${dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {expanded ? "Hide" : "CMS evidence"}
              </button>
            </div>
          );
        })}

        {paged.length === 0 && (
          <div className={`flex-1 rounded-xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>No competitors match this filter.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default function CompetitorGrid({ providerType = "hospice" }) {
  const { dark } = useDarkMode();
  const [competitors, setCompetitors] = useState(() => buildSeededCompetitors(providerType));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [viewMode, setViewMode] = useState("columns");
  const [andwellQuality] = useState(() => {
    const profile = getProviderProfileByCcn(ANDWELL_CCN);
    return profile?.hhcahpsEvidence || profile?.hhvbpEvidence || null;
  });
  const PAGE_SIZE = 6;

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const tr = await fetch("/api/ai/token");
        const { token } = tr.ok ? await tr.json() : { token: "" };
        const compRes = await fetch("/api/cms/competitors", { headers: { "x-ai-token": token } });
        if (!compRes.ok) throw new Error(compRes.statusText);
        const data = await compRes.json();
        setCompetitors(data.competitors?.length ? mergeBundledEvidence(data.competitors, providerType) : buildSeededCompetitors(providerType));
      } catch (err) {
        setError(err.toString());
      } finally {
        setLoading(false);
      }
    })();
  }, [providerType]);

  const filtered = useMemo(() => {
    return competitors.filter((c) => {
      if (filter === "verified") return c.cms_certification_number || c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified" || c.match_status === "CMS matched in bundled source data";
      if (filter === "national") return isNationalChain(c);
      if (filter === "regional") return !isNationalChain(c);
      if (filter === "high_quality") return c.high_quality || c.quality_star_rating >= 4 || (c.quality_snapshot_score != null && c.quality_snapshot_score >= 0.8);
      const ptFilter = providerType === "hospice" ? ["hospice", "both"] : ["homehealth", "both"];
      if (filter === "type") return ptFilter.includes(c.provider_type);
      return true;
    });
  }, [competitors, filter, providerType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Andwell comparison grid" title="Competitor intelligence matrix">
        Provider-file competitors cross-referenced with bundled CMS, HHCAHPS, HHVBP, Hospice CAHPS, and HRSA evidence where available. Share values are provider-file presence proxies, not county market share.
      </SectionHeader>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All (${competitors.length})` },
          { id: "verified", label: "CMS Verified" },
          { id: "national", label: "National chains" },
          { id: "regional", label: "Regional" },
          { id: "high_quality", label: "High quality" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(0); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${filter === f.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {[{ id: "columns", label: "⬜ Comparison" }, { id: "table", label: "⊞ Sortable table" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${viewMode === m.id ? dark ? "bg-slate-100 text-slate-950" : "bg-slate-950 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={`rounded-xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading competitor intelligence…</p>
        </div>
      )}

      {error && (
        <div className={`rounded-xl border p-6 ${dark ? "border-amber-800 bg-amber-950/50 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="font-semibold">Bundled provider evidence is available</p>
          <p className="mt-1 text-sm">Some live CMS tool evidence could not be loaded, so the grid is using bundled CMS/provider-file records and precise missing-match notes.</p>
        </div>
      )}

      {!loading && !error && viewMode === "columns" && (
        <>
          <ComparisonColumns competitors={filtered} dark={dark} providerType={providerType} page={page} PAGE_SIZE={PAGE_SIZE} andwellQuality={andwellQuality} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                ← Prev
              </button>
              <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className={`rounded-lg px-4 py-2 text-xs font-medium transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && viewMode === "table" && (
        <SortableMatrix competitors={filtered} dark={dark} providerType={providerType} />
      )}

      {!loading && !error && (
        <div className={`rounded-xl border p-4 text-xs ${dark ? "border-slate-700 bg-slate-800/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          <p className="font-semibold mb-1">Data sources and limitations</p>
          <p>CMS verification uses bundled CMS Provider Data source files and exact or normalized provider matching. Missing fields identify the specific missing match, such as no CCN, no HHCAHPS record, no HHVBP record, no Hospice CAHPS record, or no HRSA facility record. Provider-file presence is not county-attributed claims market share.</p>
        </div>
      )}
    </div>
  );
}
