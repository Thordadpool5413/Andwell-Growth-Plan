import React, { useState, useEffect } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import VerificationBadge from "../components/VerificationBadge.jsx";
import CmsEvidenceCard from "../components/CmsEvidenceCard.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

const ANDWELL_STRENGTHS = {
  hospice: {
    quality: "High",
    family_experience: "High",
    care_at_home_rate: "High",
    national_chain: false,
    service_breadth: ["Hospice", "Home Health", "Palliative Care"],
    maine_focus: true,
  },
  homehealth: {
    quality: "High",
    family_experience: "High",
    care_at_home_rate: "High",
    national_chain: false,
    service_breadth: ["Home Healthcare", "Wound Care", "Therapy"],
    maine_focus: true,
  },
};

const DIMENSION_LABELS = [
  { key: "national_chain", label: "National chain", andwellGood: false, tooltip: "Lower = better for local focus" },
  { key: "maine_focus", label: "Maine-only focus", andwellGood: true },
  { key: "cms_verified", label: "CMS certified", andwellGood: true },
  { key: "quality_claims", label: "Quality claims", andwellGood: true },
  { key: "web_counties", label: "Counties (web)", andwellGood: true },
  { key: "service_breadth", label: "Service lines", andwellGood: true },
];

function AndwellColumn({ dark, providerType }) {
  const s = ANDWELL_STRENGTHS[providerType] || ANDWELL_STRENGTHS.hospice;
  return (
    <div className={`rounded-2xl border-2 p-4 ${dark ? "border-blue-700 bg-blue-950/30" : "border-blue-400 bg-blue-50"}`}>
      <div className="mb-3">
        <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>Andwell</p>
        <p className={`text-sm font-black mt-0.5 ${dark ? "text-white" : "text-slate-950"}`}>Andwell Health Partners</p>
        <p className={`text-xs mt-0.5 ${dark ? "text-blue-400" : "text-blue-600"}`}>Maine-born, Maine-focused</p>
      </div>
      <div className="space-y-2 text-xs">
        <Row label="National chain" value="No" isAndwell highlight="green" dark={dark} />
        <Row label="Maine-only focus" value="Yes" isAndwell highlight="green" dark={dark} />
        <Row label="CMS certified" value="Yes" isAndwell highlight="green" dark={dark} />
        <Row label="Quality claims" value="High" isAndwell highlight="green" dark={dark} />
        <Row label="Counties served" value="Multi-county" isAndwell highlight="green" dark={dark} />
        <Row label="Service lines" value={s.service_breadth.length} isAndwell highlight="green" dark={dark} />
      </div>
    </div>
  );
}

function Row({ label, value, isAndwell, highlight, dark }) {
  const bg = isAndwell
    ? dark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"
    : highlight === "green"
      ? dark ? "bg-emerald-900/20 text-emerald-300" : "bg-emerald-50 text-emerald-700"
      : dark ? "bg-slate-700/30 text-slate-300" : "bg-slate-50 text-slate-600";
  return (
    <div className="flex items-center justify-between gap-2">
      <span className={`${dark ? "text-slate-400" : "text-slate-500"} truncate`}>{label}</span>
      <span className={`rounded-full px-2 py-0.5 font-semibold shrink-0 ${bg}`}>{String(value)}</span>
    </div>
  );
}

function CompetitorColumn({ competitor, dark, providerType }) {
  const [detail, setDetail] = useState(false);
  const isNational = competitor.parent_company &&
    ["Amedisys", "Gentiva", "Kindred", "Compassus", "Constellation", "LHC Group", "Centerwell", "Enhabit"]
      .some((nc) => (competitor.parent_company || "").includes(nc));
  const countiesCount = competitor.counties_raw?.length || competitor.known_counties?.length || 0;
  const serviceCount = competitor.services_raw?.length || 0;
  const qualityCount = competitor.quality_claims?.length || 0;

  const status = competitor.match_status || "Needs Review";
  const borderCls = status === "CMS Verified" || status === "CMS and Website Verified"
    ? dark ? "border-emerald-800/40" : "border-emerald-200"
    : dark ? "border-slate-700" : "border-slate-200";

  return (
    <div className={`rounded-2xl border p-4 ${borderCls} ${dark ? "bg-slate-800/50" : "bg-white"}`}>
      <div className="mb-3">
        <div className="flex items-start gap-2">
          {isNational && (
            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${dark ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"}`}>
              National
            </span>
          )}
        </div>
        <p className={`text-sm font-black mt-1 leading-5 ${dark ? "text-white" : "text-slate-950"}`}>{competitor.name}</p>
        {competitor.parent_company && (
          <p className={`text-[10px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{competitor.parent_company}</p>
        )}
      </div>
      <VerificationBadge status={status} size="xs" />
      <div className="mt-3 space-y-2 text-xs">
        <Row label="National chain" value={isNational ? "Yes" : "No"} dark={dark} highlight={isNational ? "red" : "neutral"} />
        <Row label="Maine-only focus" value={!isNational ? "Likely" : "No"} dark={dark} />
        <Row label="CMS certified" value={status === "CMS Verified" || status === "CMS and Website Verified" ? "Yes" : "Unconfirmed"} dark={dark} />
        <Row label="Quality claims" value={qualityCount > 0 ? `${qualityCount} found` : "None detected"} dark={dark} />
        <Row label="Counties (web)" value={countiesCount || "Unknown"} dark={dark} />
        <Row label="Service lines" value={serviceCount > 0 ? serviceCount : "Unknown"} dark={dark} />
      </div>
      {detail && <CmsEvidenceCard competitor={competitor} />}
      <button
        onClick={() => setDetail((p) => !p)}
        className={`mt-3 w-full rounded-xl py-1.5 text-[10px] font-black uppercase tracking-wide transition ${dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
      >
        {detail ? "Hide" : "CMS evidence"}
      </button>
    </div>
  );
}

export default function CompetitorGrid({ providerType = "hospice" }) {
  const { dark } = useDarkMode();
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 6;

  useEffect(() => {
    setLoading(true);
    fetch("/api/cms/competitors")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) => { setCompetitors(data.competitors || []); setLoading(false); })
      .catch((err) => { setError(err.toString()); setLoading(false); });
  }, []);

  const filtered = competitors.filter((c) => {
    if (filter === "verified") return c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified";
    if (filter === "review") return c.match_status === "Needs Review";
    if (filter === "unverified") return !c.match_status || c.match_status === "Not Verified by CMS";
    const ptFilter = providerType === "hospice" ? ["hospice", "both"] : ["homehealth", "both"];
    if (filter === "type") return ptFilter.includes(c.provider_type);
    return true;
  });

  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Andwell comparison grid" title="Competitor intelligence matrix">
        CMS-verified competitor data cross-referenced with website intelligence. Each column shows what is known or unknown about each competitor relative to Andwell.
      </SectionHeader>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All competitors" },
          { id: "verified", label: "CMS Verified" },
          { id: "review", label: "Needs Review" },
          { id: "unverified", label: "Not Verified" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(0); }}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${filter === f.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {f.label} {filter === f.id && `(${filtered.length})`}
          </button>
        ))}
      </div>

      {loading && (
        <div className={`rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading competitor intelligence…</p>
        </div>
      )}

      {error && (
        <div className={`rounded-2xl border p-6 ${dark ? "border-amber-800 bg-amber-950/50 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="font-black">CMS data not yet synced</p>
          <p className="mt-1 text-sm">Run a CMS sync from the CMS Data tab to populate competitor intelligence. Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3" style={{ minWidth: `${(paged.length + 1) * 220}px` }}>
              <div className="w-52 shrink-0">
                <AndwellColumn dark={dark} providerType={providerType} />
              </div>
              {paged.map((comp) => (
                <div key={comp.id || comp.name} className="w-52 shrink-0">
                  <CompetitorColumn competitor={comp} dark={dark} providerType={providerType} />
                </div>
              ))}
              {paged.length === 0 && (
                <div className={`flex-1 rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>No competitors match this filter.</p>
                </div>
              )}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
              >
                ← Prev
              </button>
              <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
              >
                Next →
              </button>
            </div>
          )}

          <div className={`rounded-2xl border p-4 text-xs ${dark ? "border-slate-700 bg-slate-800/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
            <p className="font-black mb-1">Data sources and limitations</p>
            <p>CMS verification uses the CMS Provider Data Catalog (public, no key required). Website intelligence is extracted via server-side page crawling. Match confidence is based on name normalization and location scoring. "Not Verified by CMS" means no matching record was found — it does not confirm the provider is not Medicare-certified.</p>
          </div>
        </>
      )}
    </div>
  );
}
