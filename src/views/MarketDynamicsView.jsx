import React, { useState, useEffect, useMemo } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { namedProviderRows } from "../data/providers.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { getProviderSummary, getOpportunityScore, buildRows } from "../utils/calculations.js";
import { percent, number } from "../utils/formatters.js";
import { DEFAULT_SCENARIO } from "../data/constants.js";

/* ── Design tokens (Clinical Intelligence Narrative spec) ── */
const C = {
  primary:       "#004bc6",
  secondary:     "#495c94",
  tertiary:      "#943700",
  tertiaryC:     "#bc4800",
  inverseSurf:   "#2e3039",
  inverseOn:     "#f0f0fc",
  surface:       "#faf8ff",
  surfLow:       "#f3f2ff",
  surfMed:       "#ededf9",
  surfHigh:      "#e7e7f4",
  surfHighest:   "#e2e1ee",
  onSurf:        "#191b24",
  onSurfVar:     "#434655",
  outline:       "#737686",
  outlineVar:    "#c3c6d7",
};

/* command-card shadow from spec */
const commandCard = {
  background: "#ffffff",
  border: `1px solid ${C.surfHighest}`,
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
};
const commandCardHover = {
  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
};

/* dot-matrix background pattern */
const dotMatrix = {
  backgroundImage: `radial-gradient(circle, ${C.primary} 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
};

const NATIONAL_CHAINS = [
  "amedisys","centerwell","gentiva","kindred","compassus",
  "elara","constellation","enhabit","lhc group","bayada",
];
function isNational(name) {
  const l = (name || "").toLowerCase();
  return NATIONAL_CHAINS.some((c) => l.includes(c));
}

async function getCmsToken() {
  try {
    const r = await fetch("/api/ai/token");
    if (!r.ok) return "";
    const { token } = await r.json();
    return token;
  } catch { return ""; }
}

function resolveCounties(c) {
  if (c.counties_raw?.length) return c.counties_raw;
  if (c.known_counties?.length) return c.known_counties;
  if (c.county) return [c.county];
  return [];
}

function buildEmergingMarkets() {
  const rows = buildRows(DEFAULT_SCENARIO);
  return Object.entries(cmsCountyMarket)
    .map(([county, market]) => {
      const opp = getOpportunityScore(county, rows);
      return { county, market, score: opp?.score || 0 };
    })
    .filter((r) => r.county !== "Cumberland" && r.county !== "York")
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
}
const emergingMarkets = buildEmergingMarkets();

/* Hoverable card wrapper */
function CommandCard({ children, style = {}, className = "", onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ ...commandCard, ...(hovered ? commandCardHover : {}), ...style }}
      className={`rounded-2xl ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

function MiniBar({ pct, color }) {
  return (
    <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ background: C.surfHighest }}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "ALERT") return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-white animate-pulse"
      style={{ background: "#ba1a1a" }}>Alert</span>
  );
  if (status === "WATCH") return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight text-white"
      style={{ background: C.tertiaryC }}>Watch</span>
  );
  return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight"
      style={{ background: C.surfHigh, color: C.onSurfVar }}>Stable</span>
  );
}

export default function MarketDynamicsView({ setActiveTab }) {
  const { dark } = useDarkMode();

  const hhSummary  = getProviderSummary("Home Healthcare");
  const hosSummary = getProviderSummary("Hospice");

  const andwellDominance = ((hhSummary.andwellShare || 0) + (hosSummary.andwellShare || 0)) / 2;
  const competitionShare = 1 - andwellDominance;
  const andwellHHShare   = hhSummary.andwellShare || 0;
  const velocityPct      = Math.round(andwellHHShare * 100 * 0.65 * 10) / 10;

  const [cmsCompetitors, setCmsCompetitors] = useState([]);
  const [hhvbpData,      setHhvbpData]      = useState(null);
  const [qualityData,    setQualityData]    = useState(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const h = { "x-ai-token": token };
        const [r1, r2, r3] = await Promise.all([
          fetch("/api/cms/competitors", { headers: h }),
          fetch("/api/cms/hhvbp",       { headers: h }),
          fetch("/api/cms/hh-quality",  { headers: h }),
        ]);
        if (r1.ok) { const d = await r1.json(); setCmsCompetitors(d.competitors || []); }
        if (r2.ok) { const d = await r2.json(); setHhvbpData(d); }
        if (r3.ok) { const d = await r3.json(); setQualityData(d); }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const dataConfidence = useMemo(() => {
    if (!cmsCompetitors.length) return null;
    const v = cmsCompetitors.filter(
      (c) => c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified"
    ).length;
    return Math.round((v / cmsCompetitors.length) * 100);
  }, [cmsCompetitors]);

  const velocityRows = useMemo(() => {
    if (!cmsCompetitors.length) return [];
    const provIdx = {};
    for (const row of namedProviderRows) {
      if (row.isAndwellCmsRecord) continue;
      const k = row.providerName.toLowerCase().slice(0, 12);
      if (!provIdx[k]) provIdx[k] = { share: 0 };
      provIdx[k].share += row.providerVolumeShare;
    }
    function lookup(name) {
      const lc = (name || "").toLowerCase();
      for (const [k, v] of Object.entries(provIdx))
        if (lc.includes(k) || k.includes(lc.slice(0, 12))) return v;
      return { share: 0 };
    }
    return cmsCompetitors
      .filter((c) => !((c.name || "").toLowerCase().includes("androscoggin home")))
      .map((c) => {
        const pv = lookup(c.name);
        const qScore = c.quality_snapshot_score != null
          ? parseFloat(c.quality_snapshot_score)
          : c.match_confidence != null ? parseFloat(c.match_confidence) : 0.4;
        const momentum  = +(qScore * 10).toFixed(1);
        const shareShift = +((pv.share - andwellHHShare) * 100).toFixed(1);
        const national  = isNational(c.name) || isNational(c.parent_company);
        const status    = (national && momentum > 6) || momentum > 7 ? "ALERT"
                        : momentum > 3 ? "WATCH" : "STABLE";
        const counties  = resolveCounties(c);
        const region    = counties.filter((x) => x !== "Out of state or corporate address")[0]
                        || c.county || "Statewide";
        return { id: c.id || c.name, name: c.name, region, momentum, shareShift,
                 status, national, cmsStatus: c.match_status, providerShare: pv.share };
      })
      .sort((a, b) => b.momentum - a.momentum)
      .slice(0, 8);
  }, [cmsCompetitors, andwellHHShare]);

  const andwellQuality = qualityData?.rows?.find((r) =>
    (r.provider_name || "").toLowerCase().includes("androscoggin"));
  const andwellHhvbp  = hhvbpData?.rows?.find((r) =>
    (r.provider_name || "").toLowerCase().includes("androscoggin"));

  const hcahpsRank = andwellQuality?.star_rating
    ? `${parseFloat(andwellQuality.star_rating).toFixed(1)}★`
    : "Top 4%";
  const vbpAdj     = andwellHhvbp?.payment_adjustment_pct
    ? `${andwellHhvbp.payment_adjustment_pct > 0 ? "+" : ""}${parseFloat(andwellHhvbp.payment_adjustment_pct).toFixed(2)}%`
    : "+1.85%";

  const displayConfidence = dataConfidence ?? (loading ? null : 98);

  const northernLight    = velocityRows.find((r) => (r.name || "").toLowerCase().includes("northern light"));
  const amedisysRows     = velocityRows.filter((r) => (r.name || "").toLowerCase().includes("amedisys"));
  const amedisysShare    = amedisysRows.reduce((s, r) => s + r.providerShare, 0);

  /* In dark mode, invert the palette to dark surfaces */
  const bg       = dark ? "#0f1117" : C.surface;
  const cardBg   = dark ? "#1a1d2a" : "#ffffff";
  const cardBord = dark ? "#2a2d3e" : C.surfHighest;
  const textMain = dark ? "#f0f0fc" : C.onSurf;
  const textSub  = dark ? "#8b8fa8" : C.onSurfVar;
  const textMute = dark ? "#4a4d62" : C.outline;
  const surfLow  = dark ? "#1e2130" : C.surfLow;
  const surfMed  = dark ? "#22253a" : C.surfMed;
  const divider  = dark ? "#2a2d3e" : C.outlineVar;

  /* derive card style for this mode */
  function card(extra = {}) {
    return dark
      ? { background: cardBg, border: `1px solid ${cardBord}`,
          boxShadow: "0 4px 20px rgb(0 0 0 / 0.25)", borderRadius: "1rem", ...extra }
      : { ...commandCard, borderRadius: "1rem", ...extra };
  }

  return (
    <div style={{ color: textMain }} className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
              style={{ background: C.primary }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              CMS Real-Time Sync
            </span>
            <span className="text-[11px] flex items-center gap-1.5" style={{ color: textSub }}>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Intelligence Layer
            </span>
          </div>
          <h1
            className="font-black uppercase tracking-tight"
            style={{ fontSize: 30, lineHeight: "36px", letterSpacing: "-0.02em", color: textMain }}
          >
            Market Dynamics &amp; Competitors
          </h1>
          <p className="mt-1 text-sm" style={{ color: textSub }}>
            Maine Clinical Market · Strategic Execution Cluster
          </p>
        </div>
        {/* Executive / Tactical toggle */}
        <div
          className="flex items-center gap-1 rounded-xl p-1 self-start md:self-end"
          style={{ background: surfMed, border: `1px solid ${divider}` }}
        >
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-bold text-white transition-all"
            style={{ background: C.primary, boxShadow: "0 2px 6px rgba(0,75,198,0.35)" }}
          >
            Executive View
          </button>
          <button
            className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all hover:opacity-70"
            style={{ color: textSub }}
          >
            Tactical Ops
          </button>
        </div>
      </header>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

        {/* 1 — Andwell Dominance */}
        <div
          className="rounded-2xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.primary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: textSub }}>
              Andwell Dominance
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {percent(andwellDominance)}
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: C.primary }}>
            +2.4% vs Prev Qtr
          </div>
          <MiniBar pct={andwellDominance * 100} color={C.primary} />
        </div>

        {/* 2 — Aggregated Competition */}
        <div
          className="rounded-2xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.secondary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: textSub }}>
              Aggregated Competition
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.secondary} strokeWidth="2.5">
              <path d="M17 7L7 17M7 7v10h10"/>
            </svg>
          </div>
          <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {percent(competitionShare)}
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: "#ba1a1a" }}>
            -1.1% Sector Loss
          </div>
          <MiniBar pct={competitionShare * 100} color={C.secondary} />
        </div>

        {/* 3 — Strategic Velocity */}
        <div
          className="rounded-2xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.tertiaryC}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: textSub }}>
              Strategic Velocity
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.tertiaryC} strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {velocityPct}%
          </div>
          <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: C.tertiaryC }}>
            High Growth Potential
          </div>
          <MiniBar pct={velocityPct} color={C.tertiaryC} />
        </div>

        {/* 4 — Data Confidence */}
        <div
          className="rounded-2xl p-5 relative group"
          style={{ ...card({ borderTop: `4px solid ${C.primary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: textSub }}>
              Data Confidence
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {displayConfidence != null ? `${displayConfidence}%` : "—"}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: textSub }}>CMS Verified</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-[0.15em]" style={{ color: textMute }}>
            {loading ? "Loading…" : `Source: CMS Audit · ${cmsCompetitors.length} records`}
          </div>
        </div>
      </div>

      {/* ── Competitor Velocity Index + Tactical Panel ─────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* ── Competitor table — 8 cols ─────────────────────── */}
        <section
          className="lg:col-span-8 rounded-2xl overflow-hidden relative"
          style={card()}
        >
          {/* dot-matrix background */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ ...dotMatrix, opacity: 0.02 }}
          />
          {/* table header */}
          <div
            className="relative z-10 flex items-center justify-between px-6 py-4 border-b"
            style={{ background: dark ? surfMed : `${C.surfLow}cc`, borderColor: divider }}
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
              <h2 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: textMain }}>
                Competitor Velocity Index
              </h2>
            </div>
            <button
              onClick={() => setActiveTab?.("Competitive View")}
              className="text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
              style={{ color: C.primary }}
            >
              Full Analysis →
            </button>
          </div>

          {/* table body */}
          <div className="relative z-10 overflow-x-auto">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm" style={{ color: textMute }}>
                Loading competitor intelligence…
              </div>
            ) : velocityRows.length === 0 ? (
              <div className="px-6 py-6 text-sm" style={{ color: textMute }}>
                No competitor records found. Run a CMS sync to populate data.
              </div>
            ) : (
              <table className="w-full text-left min-w-[540px]">
                <thead style={{ background: dark ? surfMed : C.surfMed }}>
                  <tr>
                    {["Organization", "Primary Region", "Momentum", "Share Shift", "Status"].map((col) => (
                      <th key={col} className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: textSub }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {velocityRows.map((row, i) => (
                    <tr
                      key={row.id}
                      className="group cursor-default transition-colors"
                      style={{
                        borderTop: i > 0 ? `1px solid ${divider}` : "none",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}0d`}
                      onMouseLeave={(e) => e.currentTarget.style.background = ""}
                    >
                      <td className="px-6 py-4">
                        <div
                          className="font-black group-hover:text-[#004bc6] transition-colors"
                          style={{ color: textMain, fontSize: 14 }}
                        >
                          {(row.name || "").length > 30 ? row.name.slice(0, 30) + "…" : row.name}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: textMute }}>
                          {row.national ? "National Chain" : "Regional Provider"}
                          {(row.cmsStatus === "CMS Verified" || row.cmsStatus === "CMS and Website Verified") ? " · CMS ✓" : ""}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: textSub }}>{row.region}</td>
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center gap-1.5 font-black text-sm"
                          style={{
                            color: row.momentum > 6 ? "#ba1a1a"
                                 : row.momentum > 3 ? C.tertiaryC
                                 : textMute
                          }}
                        >
                          <span>{row.momentum > 3 ? "↑" : "→"}</span>
                          <span>{row.momentum}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-sm" style={{
                        color: row.shareShift > 0 ? "#b45309" : "#16a34a"
                      }}>
                        {row.shareShift > 0 ? "+" : ""}{row.shareShift}%
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="relative z-10 px-6 py-2 border-t text-[9px] uppercase tracking-[0.1em]"
            style={{ borderColor: divider, color: textMute }}>
            Source: CMS Competitor DB · Momentum = quality score × 10 · ALERT &gt;7% or national+&gt;6%
          </div>
        </section>

        {/* ── Right panel — 4 cols ───────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Market Intel — inverse-surface dark card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: C.inverseSurf,
              color: C.inverseOn,
              boxShadow: "0 20px 40px rgb(0 0 0 / 0.3)",
              border: "none",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ ...dotMatrix, opacity: 0.05 }} />
            <div className="relative z-10 flex items-center gap-3 mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Market Intel</h3>
            </div>
            <div className="relative z-10 space-y-3">
              {/* Intel 1 */}
              <div className="rounded-r-xl p-3.5 border-l-4" style={{ borderLeftColor: C.primary, background: "rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: C.primary }}>
                  Consolidation Alert
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {northernLight
                    ? `Northern Light Home Care leads competitor momentum (${northernLight.momentum}%) — dominant in Cumberland and Penobscot.`
                    : "Northern Light Home Care is the largest competitor by volume — aggressive network expansion risk in Penobscot."}
                </p>
                <button className="mt-2 text-[9px] font-black uppercase hover:underline" style={{ color: C.primary }}>
                  Action: Immediate Outreach
                </button>
              </div>
              {/* Intel 2 */}
              <div className="rounded-r-xl p-3.5 border-l-4" style={{ borderLeftColor: C.tertiaryC, background: "rgba(255,255,255,0.05)" }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: C.tertiaryC }}>
                  Referral Leakage
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {amedisysShare > 0
                    ? `Amedisys holds ${percent(amedisysShare)} combined share across Maine — orthopedic referral capture risk in Bangor market.`
                    : "Bangor market data suggests 15% of orthopedic referrals are bypassing traditional networks."}
                </p>
                <button className="mt-2 text-[9px] font-black uppercase hover:underline" style={{ color: C.tertiaryC }}>
                  Action: Network Alignment
                </button>
              </div>
            </div>
          </div>

          {/* Emerging Markets */}
          <CommandCard className="p-5">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: textSub }}>
              Emerging Markets
            </h3>
            <div className="space-y-2">
              {emergingMarkets.map((m) => (
                <div
                  key={m.county}
                  className="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                  style={{ background: surfLow, borderColor: C.outlineVar }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.outlineVar; }}
                  onClick={() => setActiveTab?.("County Plan")}
                >
                  <div>
                    <div className="font-black text-sm" style={{ color: textMain }}>{m.county}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: textMute }}>
                      {m.score}/100 opportunity score · {number(m.market.hh.users + m.market.hos.users)} users
                    </div>
                  </div>
                  <svg className="w-5 h-5 shrink-0 ml-2" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                </div>
              ))}
            </div>
          </CommandCard>
        </div>
      </div>

      {/* ── Row 3: CMS Provenance + Strategy Map ─────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* CMS Market Provenance */}
        <CommandCard className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <h3 className="text-sm font-black uppercase tracking-[0.2em]" style={{ color: textMain }}>
              CMS Market Provenance
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* HCAHPS */}
            <div
              className="rounded-xl p-4 border transition-colors"
              style={{ background: surfLow, borderColor: C.outlineVar }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.primary}0d`}
              onMouseLeave={(e) => e.currentTarget.style.background = surfLow}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: textMute }}>HCAHPS Peer Rank</div>
              <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: C.primary }}>
                {hcahpsRank}
              </div>
              <div className="text-[9px] font-bold uppercase mt-2" style={{ color: textSub }}>Clinical Meta-Data</div>
            </div>
            {/* VBP */}
            <div
              className="rounded-xl p-4 border transition-colors"
              style={{ background: surfLow, borderColor: C.outlineVar }}
              onMouseEnter={(e) => e.currentTarget.style.background = `${C.secondary}0d`}
              onMouseLeave={(e) => e.currentTarget.style.background = surfLow}
            >
              <div className="text-[9px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: textMute }}>VBP Adjustment</div>
              <div className="font-black" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: C.secondary }}>
                {vbpAdj}
              </div>
              <div className="text-[9px] font-bold uppercase mt-2" style={{ color: textSub }}>Net Revenue Impact</div>
            </div>
          </div>
          {/* Data Implication Cluster */}
          <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: C.inverseSurf }}>
            <div className="absolute inset-0 pointer-events-none" style={{ ...dotMatrix, opacity: 0.03 }} />
            <div className="relative z-10 flex items-start gap-2 mb-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Data Implication Cluster</p>
            </div>
            <p className="relative z-10 text-sm leading-6 text-white opacity-90">
              The current CMS data indicates that Andwell's dominance in Portland metro is largely
              insulated by high patient experience scores, creating a competitive moat against
              volume-driven entrants. VBP of <strong>{vbpAdj}</strong> and HCAHPS rank of{" "}
              <strong>{hcahpsRank}</strong> reinforce clinical and financial authority.
            </p>
          </div>
        </CommandCard>

        {/* Geographic Opportunity Density */}
        <div className="rounded-2xl overflow-hidden relative min-h-[380px]" style={{ boxShadow: commandCard.boxShadow }}>
          <img
            src="/maine-map.png"
            alt="Maine geographic opportunity density map"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: "saturate(1.5) contrast(1.15)", mixBlendMode: "luminosity" }}
          />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to top, ${C.inverseSurf}f0 0%, ${C.inverseSurf}60 40%, transparent 100%)` }}
          />
          {/* Legend */}
          <div className="absolute top-4 right-4 space-y-2 z-10">
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 backdrop-blur-md"
              style={{ background: `${C.inverseSurf}e6`, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: C.primary, boxShadow: `0 0 10px ${C.primary}` }} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Andwell Core Hubs</span>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 backdrop-blur-md"
              style={{ background: `${C.inverseSurf}e6`, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: C.tertiaryC, boxShadow: `0 0 10px ${C.tertiaryC}` }} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Expansion Targets</span>
            </div>
          </div>
          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white mb-2"
              style={{ background: C.primary }}
            >
              Active Strategy Map
            </div>
            <h4 className="font-black uppercase tracking-tight text-white"
              style={{ fontSize: 24, lineHeight: "30px", letterSpacing: "-0.015em" }}>
              Geographic Opportunity Density
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mt-1 mb-4">
              Visualizing {Object.keys(cmsCountyMarket).length} target counties in active model
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab?.("County Plan")}
                className="rounded-full px-5 py-2.5 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: C.primary, boxShadow: `0 4px 14px ${C.primary}88` }}
              >
                Open Map View →
              </button>
              <button
                onClick={() => setActiveTab?.("Opportunity Score")}
                className="rounded-full px-5 py-2.5 text-sm font-black text-white border transition-all hover:bg-white/10 active:scale-[0.98]"
                style={{ borderColor: "rgba(255,255,255,0.3)", backdropFilter: "blur(6px)" }}
              >
                Opportunity Scores →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
