import React, { useState, useEffect, useMemo } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import VerificationBadge from "../components/VerificationBadge.jsx";
import CmsEvidenceCard from "../components/CmsEvidenceCard.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";

const NATIONAL_CHAINS = [
  "Amedisys", "Gentiva", "Kindred", "Compassus", "Constellation",
  "LHC Group", "Centerwell", "Enhabit", "Bayada", "Elara Caring",
];

function isNationalChain(comp) {
  const haystack = `${comp.name || ""} ${comp.parent_company || ""}`;
  return NATIONAL_CHAINS.some((nc) => haystack.toLowerCase().includes(nc.toLowerCase()));
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

function DimCell({ value, andwellGood, dark, isAndwell }) {
  const good = isAndwell
    ? dark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-700"
    : dark ? "bg-slate-700/40 text-slate-300" : "bg-slate-50 text-slate-600";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${good}`}>
      {value}
    </span>
  );
}

function SortableMatrix({ competitors, dark, providerType }) {
  const [sortKey, setSortKey] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

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
      else if (sortKey === "counties") { va = a.known_counties?.length || 0; vb = b.known_counties?.length || 0; }
      else if (sortKey === "services") { va = a.services_raw?.length || 0; vb = b.services_raw?.length || 0; }
      else if (sortKey === "match_confidence") { va = a.match_confidence || 0; vb = b.match_confidence || 0; }
      else if (sortKey === "hospice_cert") { va = hasHospiceCert(a) ? 1 : 0; vb = hasHospiceCert(b) ? 1 : 0; }
      else if (sortKey === "hh_cert") { va = hasHHCert(a) ? 1 : 0; vb = hasHHCert(b) ? 1 : 0; }
      else if (sortKey === "health_system") { va = getHealthSystem(a) ? 1 : 0; vb = getHealthSystem(b) ? 1 : 0; }
      else if (sortKey === "est_beneficiaries") { va = a.estimated_beneficiaries || 0; vb = b.estimated_beneficiaries || 0; }
      else if (sortKey === "quality_star") { va = a.quality_star_rating || 0; vb = b.quality_star_rating || 0; }
      else { va = (a[sortKey] || "").toString().toLowerCase(); vb = (b[sortKey] || "").toString().toLowerCase(); }
      const cmp = typeof va === "number" ? va - vb : va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [competitors, sortKey, sortAsc]);

  const toggle = (key) => {
    if (sortKey === key) setSortAsc((p) => !p);
    else { setSortKey(key); setSortAsc(true); }
  };

  const thCls = `px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide cursor-pointer select-none whitespace-nowrap ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"}`;
  const arrow = (key) => sortKey === key ? (sortAsc ? " ↑" : " ↓") : "";

  const cmsStatus = (c) => {
    if (c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified") return "Verified";
    if (c.match_status === "Not Verified by CMS") return "Not verified";
    return "Needs review";
  };

  return (
    <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-200"}`}>
      <table className="w-full text-sm min-w-[900px]">
        <thead className={dark ? "bg-slate-800" : "bg-slate-50"}>
          <tr>
            {SORT_KEYS.map((sk) => (
              <th key={sk.key} className={thCls} onClick={() => toggle(sk.key)}>
                {sk.label}{arrow(sk.key)}
              </th>
            ))}
            <th className={`px-4 py-3 text-left text-[11px] font-black uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Evidence</th>
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
                  <td className={`px-4 py-3 font-black ${dark ? "text-white" : "text-slate-950"}`}>
                    {comp.name}
                    {comp.parent_company && (
                      <p className={`text-[10px] font-normal ${dark ? "text-slate-400" : "text-slate-500"}`}>{comp.parent_company}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <VerificationBadge status={comp.match_status || "Needs Review"} size="xs" />
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    {comp.match_confidence != null ? `${Math.round(comp.match_confidence * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {national
                      ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-red-900/40 text-red-300" : "bg-red-50 text-red-700"}`}>National</span>
                      : <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Regional</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {hasHospiceCert(comp)
                      ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Yes</span>
                      : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {hasHHCert(comp)
                      ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-emerald-900/30 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>Yes</span>
                      : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>—</span>}
                  </td>
                  <td className={`px-4 py-3 text-[11px] ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {getHealthSystem(comp) ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700"}`}>{getHealthSystem(comp)}</span> : <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>None</span>}
                  </td>
                  <td className={`px-4 py-3 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>
                    {comp.estimated_beneficiaries ? comp.estimated_beneficiaries.toLocaleString() : "—"}
                  </td>
                  <td className={`px-4 py-3 text-[11px] ${dark ? "text-slate-300" : "text-slate-700"}`}>
                    {comp.quality_star_rating ? `${comp.quality_star_rating}★` : "—"}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {comp.known_counties?.length ? comp.known_counties.slice(0, 3).join(", ") + (comp.known_counties.length > 3 ? ` +${comp.known_counties.length - 3}` : "") : "—"}
                  </td>
                  <td className={`px-4 py-3 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                    {comp.services_raw?.length ? `${comp.services_raw.length} lines` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setExpandedId(expanded ? null : (comp.id || comp.name))}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-black transition ${dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
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

function ComparisonColumns({ competitors, dark, providerType, page, PAGE_SIZE }) {
  const [expandedId, setExpandedId] = useState(null);
  const paged = competitors.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const hasHospiceCertC = (c) => c.provider_type === "hospice" || c.provider_type === "both" || (c.cms_certification_number && (c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified") && c.provider_type !== "homehealth");
  const hasHHCertC = (c) => c.provider_type === "homehealth" || c.provider_type === "both";
  const getHealthSystemC = (c) => {
    const HEALTH_SYSTEMS = ["northern light", "mainhealth", "mainehealth", "emhs", "eastern maine", "mercy", "st. mary", "central maine", "mount desert"];
    const hay = `${c.name || ""} ${c.parent_company || ""}`.toLowerCase();
    return HEALTH_SYSTEMS.find((h) => hay.includes(h)) || null;
  };

  const getCompValue = (comp, dim) => {
    const national = isNationalChain(comp);
    const status = comp.match_status || "Needs Review";
    const counties = comp.known_counties?.length || comp.counties_raw?.length || 0;
    const services = comp.services_raw?.length || 0;
    switch (dim.key) {
      case "ccn": return comp.cms_certification_number || "—";
      case "certification_date": return "—";
      case "hospice_cert": return hasHospiceCertC(comp) ? "Yes" : "—";
      case "hh_cert": return hasHHCertC(comp) ? "Yes" : "—";
      case "national_chain": return national ? "Yes" : "No";
      case "maine_focus": return national ? "No" : "Likely";
      case "health_system": return getHealthSystemC(comp) || "None";
      case "cms_status": return status === "CMS Verified" || status === "CMS and Website Verified" ? "Verified" : "Unconfirmed";
      case "match_conf": return comp.match_confidence != null ? `${Math.round(comp.match_confidence * 100)}%` : "—";
      case "est_beneficiaries": return comp.estimated_beneficiaries ? comp.estimated_beneficiaries.toLocaleString() : "—";
      case "quality_star": return comp.quality_star_rating ? `${comp.quality_star_rating}★` : "—";
      case "counties": return counties > 0 ? `${counties} counties` : "Unknown";
      case "services": return services > 0 ? `${services} lines` : "Unknown";
      case "affiliations": return comp.parent_company || (national ? "National chain" : "None");
      default: return "—";
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: `${(paged.length + 1) * 200}px` }}>
        <div className="w-48 shrink-0">
          <div className={`rounded-2xl border-2 p-4 ${dark ? "border-blue-700 bg-blue-950/30" : "border-blue-400 bg-blue-50"}`}>
            <div className="mb-3">
              <p className={`text-[10px] font-black uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>Andwell</p>
              <p className={`text-sm font-black mt-0.5 leading-5 ${dark ? "text-white" : "text-slate-950"}`}>Andwell Health Partners</p>
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
          </div>
        </div>

        {paged.map((comp) => {
          const national = isNationalChain(comp);
          const expanded = expandedId === (comp.id || comp.name);
          const status = comp.match_status || "Needs Review";
          const borderCls = status === "CMS Verified" || status === "CMS and Website Verified"
            ? dark ? "border-emerald-800/40" : "border-emerald-200"
            : dark ? "border-slate-700" : "border-slate-200";
          return (
            <div key={comp.id || comp.name} className={`w-48 shrink-0 rounded-2xl border p-4 ${borderCls} ${dark ? "bg-slate-800/50" : "bg-white"}`}>
              <div className="mb-3">
                {national && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${dark ? "bg-red-900/40 text-red-400" : "bg-red-50 text-red-600"}`}>National</span>
                )}
                <p className={`text-sm font-black mt-1 leading-5 ${dark ? "text-white" : "text-slate-950"}`}>{comp.name}</p>
                {comp.parent_company && <p className={`text-[10px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{comp.parent_company}</p>}
                <div className="mt-1.5">
                  <VerificationBadge status={status} size="xs" />
                </div>
              </div>
              <div className="space-y-2">
                {DIMENSIONS.map((dim) => (
                  <div key={dim.key} className="flex items-center justify-between gap-1 text-[11px]">
                    <span className={`${dark ? "text-slate-400" : "text-slate-500"} truncate`} title={dim.tooltip}>{dim.label}</span>
                    <DimCell value={getCompValue(comp, dim)} dark={dark} />
                  </div>
                ))}
              </div>
              {expanded && <CmsEvidenceCard competitor={comp} />}
              <button
                onClick={() => setExpandedId(expanded ? null : (comp.id || comp.name))}
                className={`mt-3 w-full rounded-xl py-1.5 text-[10px] font-black uppercase tracking-wide transition ${dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {expanded ? "Hide" : "CMS evidence"}
              </button>
            </div>
          );
        })}

        {paged.length === 0 && (
          <div className={`flex-1 rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>No competitors match this filter.</p>
          </div>
        )}
      </div>
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
  const [viewMode, setViewMode] = useState("columns");
  const PAGE_SIZE = 6;

  useEffect(() => {
    setLoading(true);
    fetch("/api/cms/competitors")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) => { setCompetitors(data.competitors || []); setLoading(false); })
      .catch((err) => { setError(err.toString()); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return competitors.filter((c) => {
      if (filter === "verified") return c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified";
      if (filter === "review") return !c.match_status || c.match_status === "Needs Review";
      if (filter === "national") return isNationalChain(c);
      if (filter === "regional") return !isNationalChain(c);
      const ptFilter = providerType === "hospice" ? ["hospice", "both"] : ["homehealth", "both"];
      if (filter === "type") return ptFilter.includes(c.provider_type);
      return true;
    });
  }, [competitors, filter, providerType]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <SectionHeader eyebrow="Andwell comparison grid" title="Competitor intelligence matrix">
        CMS-verified competitor data cross-referenced with website intelligence. Sort by column, filter by status, or switch to column view for a side-by-side Andwell comparison. Run a CMS Sync (CMS Data tab) to populate live certification data.
      </SectionHeader>

      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "all", label: `All (${competitors.length})` },
          { id: "verified", label: "CMS Verified" },
          { id: "review", label: "Needs Review" },
          { id: "national", label: "National chains" },
          { id: "regional", label: "Regional" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => { setFilter(f.id); setPage(0); }}
            className={`rounded-full px-3 py-1.5 text-xs font-black transition ${filter === f.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex gap-1">
          {[{ id: "columns", label: "⬜ Comparison" }, { id: "table", label: "⊞ Sortable table" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${viewMode === m.id ? dark ? "bg-slate-100 text-slate-950" : "bg-slate-950 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className={`rounded-2xl border p-8 text-center ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Loading competitor intelligence…</p>
        </div>
      )}

      {error && (
        <div className={`rounded-2xl border p-6 ${dark ? "border-amber-800 bg-amber-950/50 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
          <p className="font-black">CMS data not yet synced</p>
          <p className="mt-1 text-sm">Run a CMS sync from the CMS Data tab → CMS Data Connection → Sync & Crawl to populate competitor intelligence.</p>
        </div>
      )}

      {!loading && !error && viewMode === "columns" && (
        <>
          <ComparisonColumns competitors={filtered} dark={dark} providerType={providerType} page={page} PAGE_SIZE={PAGE_SIZE} />
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
                className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                ← Prev
              </button>
              <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{page + 1} / {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}
                className={`rounded-full px-4 py-2 text-xs font-black transition disabled:opacity-40 ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
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
        <div className={`rounded-2xl border p-4 text-xs ${dark ? "border-slate-700 bg-slate-800/50 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
          <p className="font-black mb-1">Data sources and limitations</p>
          <p>CMS verification uses the CMS Provider Data Catalog (public, no key required). Website intelligence is extracted via server-side page crawling. Match confidence is based on name normalization and location scoring. "Needs Review" means no matching CMS record was found yet — it does not confirm the provider is not Medicare-certified. Run CMS Sync + Crawl to populate all columns.</p>
        </div>
      )}
    </div>
  );
}
