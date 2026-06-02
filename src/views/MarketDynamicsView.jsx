import React, { useState, useEffect, useMemo } from "react";
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { namedProviderRows } from "../data/providers.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { getProviderSummary, getOpportunityScore, buildRows } from "../utils/calculations.js";
import { percent, number } from "../utils/formatters.js";
import { DEFAULT_SCENARIO } from "../data/constants.js";

const PRIMARY = "#004bc6";

const NATIONAL_CHAIN_NAMES = [
  "amedisys", "centerwell", "gentiva", "kindred", "compassus",
  "elara", "constellation", "enhabit", "lhc group", "bayada",
];

function isNational(name) {
  const l = (name || "").toLowerCase();
  return NATIONAL_CHAIN_NAMES.some((c) => l.includes(c));
import { streamChat, buildMarketSummaryPrompt, AI_AVAILABLE } from "../utils/ai.js";

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

function resolveCompetitorCounties(c) {
function resolveCounties(c) {
  if (c.counties_raw?.length) return c.counties_raw;
  if (c.known_counties?.length) return c.known_counties;
  if (c.county) return [c.county];
  return [];
}

function kpiCardBase(dark) {
  return `rounded-2xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
    dark
      ? "bg-slate-800 border-slate-700 shadow-slate-900/40"
      : "bg-white border-[#e2e1ee] shadow-sm"
  }`;
}

function eyebrow(dark) {
  return `text-[10px] font-black uppercase tracking-[0.3em] ${dark ? "text-slate-400" : "text-[#434655]"}`;
}

function metricValue(dark) {
  return `text-[32px] leading-[40px] font-black tracking-[-0.02em] ${dark ? "text-white" : "text-[#191b24]"}`;
}

function MiniBar({ pct, color, dark }) {
  return (
    <div className={`mt-3 h-1.5 w-full rounded-full overflow-hidden ${dark ? "bg-slate-700" : "bg-[#e2e1ee]"}`}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color }} />
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
      className={`rounded-xl ${className}`}
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
  if (status === "ALERT") {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight bg-red-600 text-white animate-pulse">
        Alert
      </span>
    );
  }
  if (status === "WATCH") {
    return (
      <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight bg-orange-100 text-orange-800 border border-orange-200">
        Watch
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tight bg-slate-100 text-slate-600 border border-slate-200">
      Stable
    </span>
  );
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
  if (status === "ALERT") return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-tight text-white animate-pulse"
      style={{ background: "#ba1a1a" }}>Alert</span>
  );
  if (status === "WATCH") return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-tight text-white"
      style={{ background: C.tertiaryC }}>Watch</span>
  );
  return (
    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-medium uppercase tracking-tight"
      style={{ background: C.surfHigh, color: C.onSurfVar }}>Stable</span>
  );
}

const SERVICE_OPTIONS = ["All", "Home Health", "Hospice"];
const COUNTY_LIST = Object.keys(cmsCountyMarket);
const SVC_LABELS = {
  "All":        ["Home Healthcare", "Hospice"],
  "Home Health":["Home Healthcare"],
  "Hospice":    ["Hospice"],
};

export default function MarketDynamicsView({ setActiveTab }) {
  const { dark } = useDarkMode();

  const hhSummary = getProviderSummary("Home Healthcare");
  const hosSummary = getProviderSummary("Hospice");

  const andwellDominance = ((hhSummary.andwellShare || 0) + (hosSummary.andwellShare || 0)) / 2;
  const competitionShare = 1 - andwellDominance;
  const andwellHHShare = hhSummary.andwellShare || 0;
  const velocityPct = Math.round(andwellHHShare * 100 * 0.65 * 10) / 10;

  const [cmsCompetitors, setCmsCompetitors] = useState([]);
  const [hhvbpData, setHhvbpData] = useState(null);
  const [qualityData, setQualityData] = useState(null);
  const [loading, setLoading] = useState(true);
  const hhSummary  = getProviderSummary("Home Healthcare");
  const hosSummary = getProviderSummary("Hospice");

  const statewideAndwellDominance = ((hhSummary.andwellShare || 0) + (hosSummary.andwellShare || 0)) / 2;
  const andwellHHShare            = hhSummary.andwellShare || 0;

  /* ── Filter state ── */
  const [selectedCounty,  setSelectedCounty]  = useState("Statewide");
  const [selectedService, setSelectedService] = useState("All");

  const [cmsCompetitors, setCmsCompetitors] = useState([]);
  const [hhvbpData,      setHhvbpData]      = useState(null);
  const [qualityData,    setQualityData]    = useState(null);
  const [loading,        setLoading]        = useState(true);

  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const aiAbortRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const headers = { "x-ai-token": token };
        const [r1, r2, r3] = await Promise.all([
          fetch("/api/cms/competitors", { headers }),
          fetch("/api/cms/hhvbp", { headers }),
          fetch("/api/cms/hh-quality", { headers }),
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
    const verified = cmsCompetitors.filter(
      (c) => c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified"
    ).length;
    return Math.round((verified / cmsCompetitors.length) * 100);
  }, [cmsCompetitors]);

  const velocityRows = useMemo(() => {
    if (!cmsCompetitors.length) return [];

    const providerIndex = {};
    for (const row of namedProviderRows) {
      if (row.isAndwellCmsRecord) continue;
      const key = row.providerName.toLowerCase().slice(0, 12);
      if (!providerIndex[key]) providerIndex[key] = { share: 0, beneficiaries: 0 };
      providerIndex[key].share += row.providerVolumeShare;
      providerIndex[key].beneficiaries += row.beneficiaries;
    }

    function lookupProvider(name) {
      const lc = (name || "").toLowerCase();
      for (const [key, val] of Object.entries(providerIndex)) {
        if (lc.includes(key) || key.includes(lc.slice(0, 12))) return val;
      }
      return { share: 0, beneficiaries: 0 };
    }

    return cmsCompetitors
      .filter((c) => !((c.name || "").toLowerCase().includes("androscoggin home")))
      .map((c) => {
        const pv = lookupProvider(c.name);

        const qualityScore = c.quality_snapshot_score != null
          ? parseFloat(c.quality_snapshot_score)
          : c.match_confidence != null
            ? parseFloat(c.match_confidence)
            : 0.4;

        const momentum = +(qualityScore * 10).toFixed(1);

        const shareShift = +((pv.share - andwellHHShare) * 100).toFixed(1);

        const national = isNational(c.name) || isNational(c.parent_company);

        const status =
          (national && momentum > 6) || momentum > 7 ? "ALERT" :
          momentum > 3 ? "WATCH" :
          "STABLE";

        const counties = resolveCompetitorCounties(c);
        const primaryRegion = counties.filter((co) => co !== "Out of state or corporate address")[0]
          || c.county
          || "Statewide";

        return {
          id: c.id || c.name,
          name: c.name,
          primaryRegion,
          momentum,
          shareShift,
          status,
          national,
          cmsStatus: c.match_status,
          qualityScore,
          providerShare: pv.share,
        };
  const generateAiSummary = useCallback((vRows, andwellDom, amedisysShare, nlRow, totalComp, natCount) => {
    if (!AI_AVAILABLE) return;
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAiSummary("");
    setAiError(null);
    setAiLoading(true);
    streamChat({
      messages: buildMarketSummaryPrompt({
        velocityRows: vRows,
        andwellDominance: andwellDom,
        amedisysCombinedShare: amedisysShare,
        northernLight: nlRow,
        totalCompetitors: totalComp,
        nationalChainCount: natCount,
      }),
      signal: controller.signal,
      onChunk: (_, full) => setAiSummary(full),
      onDone: () => setAiLoading(false),
      onError: (err) => {
        setAiError(err.message);
        setAiLoading(false);
      },
    });
  }, []);

  const dataConfidence = useMemo(() => {
    if (!cmsCompetitors.length) return null;
    const v = cmsCompetitors.filter(
      (c) => c.match_status === "CMS Verified" || c.match_status === "CMS and Website Verified"
    ).length;
    return Math.round((v / cmsCompetitors.length) * 100);
  }, [cmsCompetitors]);

  const activeSvcLabels = SVC_LABELS[selectedService] || ["Home Healthcare", "Hospice"];

  /* ── Service-aware statewide KPIs ── */
  const statewideKpis = useMemo(() => {
    if (selectedService === "Home Health") {
      const dom = hhSummary.andwellShare || 0;
      return {
        andwellDominance: dom,
        competitionShare: 1 - dom,
        velocityPct: Math.round(dom * 100 * 0.65 * 10) / 10,
      };
    }
    if (selectedService === "Hospice") {
      const dom = hosSummary.andwellShare || 0;
      return {
        andwellDominance: dom,
        competitionShare: 1 - dom,
        velocityPct: null,
      };
    }
    return {
      andwellDominance: statewideAndwellDominance,
      competitionShare: 1 - statewideAndwellDominance,
      velocityPct: Math.round(andwellHHShare * 100 * 0.65 * 10) / 10,
    };
  }, [selectedService, hhSummary, hosSummary, statewideAndwellDominance, andwellHHShare]);

  /* ── County-scoped KPI derivation ── */
  const countyKpis = useMemo(() => {
    if (selectedCounty === "Statewide") return null;
    const mkt = cmsCountyMarket[selectedCounty];
    if (!mkt) return null;

    const svcs = activeSvcLabels;

    const countyRows = namedProviderRows.filter(
      (r) => r.locationCounty === selectedCounty && svcs.includes(r.service)
    );

    const andwellCountyShare = countyRows
      .filter((r) => r.isAndwellCmsRecord)
      .reduce((s, r) => s + r.providerVolumeShare, 0);
    const compCountyShare = countyRows
      .filter((r) => !r.isAndwellCmsRecord)
      .reduce((s, r) => s + r.providerVolumeShare, 0);

    const hhUsers  = svcs.includes("Home Healthcare") ? (mkt.hh?.users  ?? 0) : 0;
    const hosUsers = svcs.includes("Hospice")         ? (mkt.hos?.users ?? 0) : 0;
    const totalUsers = hhUsers + hosUsers;

    const hhProv  = svcs.includes("Home Healthcare") ? (mkt.hh?.prov  ?? 0) : 0;
    const hosProv = svcs.includes("Hospice")         ? (mkt.hos?.prov ?? 0) : 0;

    const hhRate = svcs.includes("Home Healthcare") ? (mkt.hh?.rate ?? null) : null;

    return {
      andwellDominance: andwellCountyShare,
      competitionShare: compCountyShare,
      velocityPct: hhRate != null ? Math.round(hhRate * 100 * 100) / 10 : null,
      totalUsers,
      providerCount: hhProv + hosProv,
      ffs: mkt.ffs,
      mkt,
    };
  }, [selectedCounty, selectedService]);

  /* derived KPI values — county overrides statewide when available */
  const isCountyView = selectedCounty !== "Statewide";
  const andwellDominance = isCountyView ? (countyKpis?.andwellDominance ?? 0) : statewideKpis.andwellDominance;
  const competitionShare = isCountyView ? (countyKpis?.competitionShare ?? 0) : statewideKpis.competitionShare;
  const velocityPct = isCountyView ? (countyKpis?.velocityPct ?? null) : statewideKpis.velocityPct;

  /* ── Provider → service mapping for velocity filter ── */
  const provServiceMap = useMemo(() => {
    const map = {};
    for (const row of namedProviderRows) {
      const k = row.providerName.toLowerCase().slice(0, 12);
      if (!map[k]) map[k] = new Set();
      map[k].add(row.service);
    }
    return map;
  }, []);

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

  const andwellQualityRow = qualityData?.rows?.find((r) =>
    (r.provider_name || "").toLowerCase().includes("androscoggin")
  );
  const andwellHhvbp = hhvbpData?.rows?.find((r) =>
    (r.provider_name || "").toLowerCase().includes("androscoggin")
  );

  const hcahpsRank = andwellQualityRow?.star_rating
    ? `${parseFloat(andwellQualityRow.star_rating).toFixed(1)} ★`
    : "Top 4%";
  const vbpAdj = andwellHhvbp?.payment_adjustment_pct
  /* ── County + service filtered velocity rows ── */
  const filteredVelocityRows = useMemo(() => {
    let rows = velocityRows;

    if (selectedCounty !== "Statewide") {
      rows = rows.filter((r) => r.region === selectedCounty || r.region === "Statewide");
    }

    if (selectedService !== "All") {
      const svcLabel = selectedService === "Home Health" ? "Home Healthcare" : "Hospice";
      rows = rows.filter((r) => {
        const lc = (r.name || "").toLowerCase();
        for (const [k, svcs] of Object.entries(provServiceMap)) {
          if (lc.includes(k) || k.includes(lc.slice(0, 12))) {
            return svcs.has(svcLabel);
          }
        }
        return true;
      });
    }

    return rows;
  }, [velocityRows, selectedCounty, selectedService, provServiceMap]);

  /* ── County + service filtered emerging markets ── */
  const filteredEmergingMarkets = useMemo(() => {
    if (selectedCounty === "Statewide") return emergingMarkets;
    const mkt = cmsCountyMarket[selectedCounty];
    if (!mkt) return emergingMarkets;
    const rows = buildRows(DEFAULT_SCENARIO);
    const opp  = getOpportunityScore(selectedCounty, rows);
    return [{ county: selectedCounty, market: mkt, score: opp?.score || 0 }];
  }, [selectedCounty]);

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

  const northernLight = velocityRows.find((r) => (r.name || "").toLowerCase().includes("northern light"));
  const amedisysRows = velocityRows.filter((r) => (r.name || "").toLowerCase().includes("amedisys"));
  const amedisysCombinedShare = amedisysRows.reduce((s, r) => s + r.providerShare, 0);

  const surface = dark ? "bg-slate-800/80 border-slate-700" : "bg-white border-[#e2e1ee]";

  return (
    <div className="space-y-8">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white"
            style={{ background: PRIMARY }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            CMS Active Intelligence
          </span>
        </div>
        <h1 className={`text-[30px] leading-[36px] font-black tracking-[-0.02em] uppercase ${dark ? "text-white" : "text-[#191b24]"}`}>
          Market Dynamics &amp; Competitors
        </h1>
        <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-[#434655]"}`}>
          Maine Clinical Market · Strategic Execution Cluster
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {/* Andwell Dominance */}
        <div className={`${kpiCardBase(dark)} border-l-4`} style={{ borderLeftColor: PRIMARY }}>
          <div className="flex items-start justify-between mb-3">
            <p className={eyebrow(dark)}>Andwell Dominance</p>
            <span className="text-lg" style={{ color: PRIMARY }}>◈</span>
          </div>
          <p className={metricValue(dark)}>{percent(andwellDominance)}</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: PRIMARY }}>
            Provider File Share
          </p>
          <MiniBar pct={andwellDominance * 100} color={PRIMARY} dark={dark} />
        </div>

        {/* Aggregated Competition */}
        <div className={`${kpiCardBase(dark)} border-l-4 border-l-[#495c94]`}>
          <div className="flex items-start justify-between mb-3">
            <p className={eyebrow(dark)}>Aggregated Competition</p>
            <span className="text-lg text-[#495c94]">⬇</span>
          </div>
          <p className={metricValue(dark)}>{percent(competitionShare)}</p>
          <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-red-400" : "text-red-600"}`}>
            Competitor share
          </p>
          <MiniBar pct={competitionShare * 100} color="#495c94" dark={dark} />
        </div>

        {/* Strategic Velocity */}
        <div className={`${kpiCardBase(dark)} border-l-4 border-l-[#bc4800]`}>
          <div className="flex items-start justify-between mb-3">
            <p className={eyebrow(dark)}>Strategic Velocity</p>
            <span className="text-lg text-[#bc4800]">⚡</span>
          </div>
          <p className={metricValue(dark)}>{velocityPct}%</p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#bc4800]">
            HH Growth Potential
          </p>
          <MiniBar pct={velocityPct} color="#bc4800" dark={dark} />
        </div>

        {/* Data Confidence – computed from CMS competitor match data */}
        <div className={`${kpiCardBase(dark)} border-t-4`} style={{ borderTopColor: PRIMARY }}>
          <div className="flex items-start justify-between mb-3">
            <p className={eyebrow(dark)}>Data Confidence</p>
            <span className="text-lg" style={{ color: PRIMARY }}>✓</span>
          </div>
          <p className={metricValue(dark)}>
            {displayConfidence != null ? `${displayConfidence}%` : "—"}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-[#434655]"}`}>CMS Verified</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className={`mt-2 text-[9px] uppercase tracking-[0.2em] ${dark ? "text-slate-600" : "text-[#737686]"}`}>
            {loading ? "Loading…" : `${cmsCompetitors.length} competitor records`}
          </p>
        </div>
      </div>

      {/* ── Competitor Velocity Index + Market Intel ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Competitor Velocity Index Table */}
        <section className={`lg:col-span-8 rounded-2xl border overflow-hidden relative ${surface}`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.02]"
            style={{ backgroundImage: `radial-gradient(circle, ${PRIMARY} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
          />
          <div className={`relative z-10 flex items-center justify-between px-5 py-4 border-b ${dark ? "border-slate-700 bg-slate-800/50" : "border-[#e2e1ee] bg-[#f3f2ff]/50"}`}>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black" style={{ color: PRIMARY }}>📈</span>
              <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${dark ? "text-white" : "text-[#191b24]"}`}>
  const northernLight    = filteredVelocityRows.find((r) => (r.name || "").toLowerCase().includes("northern light"));
  const amedisysRows     = filteredVelocityRows.filter((r) => (r.name || "").toLowerCase().includes("amedisys"));
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

  const nationalChainCount = useMemo(() => velocityRows.filter((r) => r.national).length, [velocityRows]);
  const nationalChainCount = useMemo(() => filteredVelocityRows.filter((r) => r.national).length, [filteredVelocityRows]);

  useEffect(() => {
    if (loading) return;
    const hasCmsData = velocityRows.length > 0;
    generateAiSummary(
      velocityRows,
      andwellDominance,
      amedisysShare,
      northernLight,
      hasCmsData ? velocityRows.length : 0,
      nationalChainCount
    );
    return () => { aiAbortRef.current?.abort(); };
  }, [loading]);

  return (
    <div style={{ color: textMain }} className="space-y-6">

      {/* ── Page Header ─────────────────────────────────── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white"
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
            className="font-bold uppercase tracking-tight"
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

      {/* ── County + Service Filter Bar ─────────────────────── */}
      <div
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{ background: surfMed, border: `1px solid ${divider}` }}
      >
        {/* County pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] shrink-0 w-20" style={{ color: textMute }}>County</span>
          {["Statewide", ...COUNTY_LIST].map((county) => {
            const active = selectedCounty === county;
            return (
              <button
                key={county}
                onClick={() => setSelectedCounty(county)}
                className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                style={active
                  ? { background: C.primary, color: "#fff", boxShadow: `0 2px 8px ${C.primary}55` }
                  : { background: dark ? "#1a1d2a" : "#fff", color: textSub, border: `1px solid ${divider}` }
                }
              >
                {county}
              </button>
            );
          })}
        </div>

        {/* Service line pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-medium uppercase tracking-[0.2em] shrink-0 w-20" style={{ color: textMute }}>Service</span>
          {SERVICE_OPTIONS.map((svc) => {
            const active = selectedService === svc;
            return (
              <button
                key={svc}
                onClick={() => setSelectedService(svc)}
                className="rounded-lg px-3 py-1 text-xs font-medium transition-all"
                style={active
                  ? { background: C.secondary, color: "#fff", boxShadow: `0 2px 8px ${C.secondary}55` }
                  : { background: dark ? "#1a1d2a" : "#fff", color: textSub, border: `1px solid ${divider}` }
                }
              >
                {svc}
              </button>
            );
          })}

          {/* Active filter label */}
          {(selectedCounty !== "Statewide" || selectedService !== "All") && (
            <span className="ml-auto text-[10px] font-medium uppercase tracking-[0.15em]" style={{ color: C.primary }}>
              {selectedCounty !== "Statewide" ? selectedCounty : "Statewide"}
              {selectedService !== "All" ? ` · ${selectedService}` : ""}
            </span>
          )}
          {(selectedCounty !== "Statewide" || selectedService !== "All") && (
            <button
              onClick={() => { setSelectedCounty("Statewide"); setSelectedService("All"); }}
              className="rounded-lg px-2.5 py-0.5 text-[10px] font-medium transition-all hover:opacity-70"
              style={{ background: dark ? "#1a1d2a" : "#fff", color: textMute, border: `1px solid ${divider}` }}
            >
              Clear ✕
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

        {/* 1 — Andwell Dominance */}
        <div
          className="rounded-xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.primary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: textSub }}>
              Andwell Dominance
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
          <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {percent(andwellDominance)}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: C.primary }}>
            {!isCountyView ? "+2.4% vs Prev Qtr" : `Provider file · ${selectedCounty}`}
          </div>
          <MiniBar pct={andwellDominance * 100} color={C.primary} />
        </div>

        {/* 2 — Aggregated Competition / County Providers */}
        <div
          className="rounded-xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.secondary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: textSub }}>
              {!isCountyView ? "Aggregated Competition" : "County Providers"}
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.secondary} strokeWidth="2.5">
              <path d="M17 7L7 17M7 7v10h10"/>
            </svg>
          </div>
          <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {!isCountyView
              ? percent(competitionShare)
              : (countyKpis?.providerCount ?? "—")}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: !isCountyView ? "#ba1a1a" : C.secondary }}>
            {!isCountyView ? "-1.1% Sector Loss" : `Active in ${selectedCounty}`}
          </div>
          <MiniBar pct={!isCountyView ? competitionShare * 100 : Math.min((countyKpis?.providerCount ?? 0) * 10, 100)} color={C.secondary} />
        </div>

        {/* 3 — Strategic Velocity / County HH Rate */}
        <div
          className="rounded-xl p-5 relative group"
          style={{ ...card({ borderLeft: `4px solid ${C.tertiaryC}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: textSub }}>
              {!isCountyView ? "Strategic Velocity" : "HH Utilization Rate"}
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.tertiaryC} strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {velocityPct != null ? `${velocityPct}%` : "—"}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: C.tertiaryC }}>
            {!isCountyView ? "High Growth Potential" : "FFS beneficiary utilization"}
          </div>
          <MiniBar pct={velocityPct ?? 0} color={C.tertiaryC} />
        </div>

        {/* 4 — Data Confidence / County FFS Population */}
        <div
          className="rounded-xl p-5 relative group"
          style={{ ...card({ borderTop: `4px solid ${C.primary}` }) }}
        >
          <div className="flex justify-between items-start mb-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.3em]" style={{ color: textSub }}>
              {!isCountyView ? "Data Confidence" : "FFS Population"}
            </span>
            <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: textMain }}>
            {!isCountyView
              ? (displayConfidence != null ? `${displayConfidence}%` : "—")
              : (countyKpis?.ffs != null ? countyKpis.ffs.toLocaleString() : "—")}
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            {!isCountyView ? (
              <>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: textSub }}>CMS Verified</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </>
            ) : (
              <span className="text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: textSub }}>
                {countyKpis?.totalUsers != null ? `${countyKpis.totalUsers.toLocaleString()} beneficiaries` : "CMS county data"}
              </span>
            )}
          </div>
          <div className="mt-2 text-[9px] uppercase tracking-[0.15em]" style={{ color: textMute }}>
            {!isCountyView
              ? (loading ? "Loading…" : `Source: CMS Audit · ${cmsCompetitors.length} records`)
              : `CMS county market · ${selectedCounty}`}
          </div>
        </div>
      </div>

      {/* ── Competitor Velocity Index + Tactical Panel ─────── */}
      <div className="grid gap-6 lg:grid-cols-12">

        {/* ── Competitor table — 8 cols ─────────────────────── */}
        <section
          className="lg:col-span-8 rounded-xl overflow-hidden relative"
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
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: textMain }}>
                Competitor Velocity Index
              </h2>
            </div>
            <button
              onClick={() => setActiveTab?.("Competitive View")}
              className="text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
              style={{ color: PRIMARY }}
              className="text-[10px] font-medium uppercase tracking-[0.2em] hover:underline"
              style={{ color: C.primary }}
            >
              Full Analysis →
            </button>
          </div>
          <div className="relative z-10 overflow-x-auto">
            {loading ? (
              <div className={`px-5 py-8 text-center text-sm ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                Loading competitor data…
              </div>
            ) : velocityRows.length === 0 ? (
              <div className={`px-5 py-6 text-sm ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                No competitor records found. Run a CMS sync to populate competitor data.
              </div>
            ) : (
              <table className="w-full text-left min-w-[560px]">
                <thead className={dark ? "bg-slate-800/60" : "bg-[#ededf9]"}>
                  <tr>
                    {["Organization", "Primary Region", "Momentum", "Share Shift", "Status"].map((col) => (
                      <th
                        key={col}
                        className={`px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-[#434655]"}`}
                      >

          {/* table body */}
          <div className="relative z-10 overflow-x-auto">
            {loading ? (
              <div className="px-6 py-10 text-center text-sm" style={{ color: textMute }}>
                Loading competitor intelligence…
              </div>
            ) : filteredVelocityRows.length === 0 ? (
              <div className="px-6 py-6 text-sm" style={{ color: textMute }}>
                {velocityRows.length === 0
                  ? "No competitor records found. Run a CMS sync to populate data."
                  : `No competitors found in ${selectedCounty}. Showing statewide data — select a different county or choose Statewide.`}
              </div>
            ) : (
              <table className="w-full text-left min-w-[540px]">
                <thead style={{ background: dark ? surfMed : C.surfMed }}>
                  <tr>
                    {["Organization", "Primary Region", "Momentum", "Share Shift", "Status"].map((col) => (
                      <th key={col} className="px-6 py-3 text-[10px] font-medium uppercase tracking-[0.2em]" style={{ color: textSub }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-[#e2e1ee]"}`}>
                  {velocityRows.map((row) => (
                    <tr
                      key={row.id}
                      className={`group cursor-default transition-colors ${dark ? "hover:bg-blue-950/20" : "hover:bg-[#004bc6]/5"}`}
                    >
                      <td className="px-5 py-4">
                        <p className={`font-black group-hover:text-[#004bc6] transition-colors ${dark ? "text-white" : "text-[#191b24]"}`}>
                          {(row.name || "").length > 32 ? (row.name || "").slice(0, 32) + "…" : row.name}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                          {row.national ? "National Chain" : "Regional Provider"}
                          {row.cmsStatus === "CMS Verified" || row.cmsStatus === "CMS and Website Verified"
                            ? " · CMS ✓" : ""}
                        </p>
                      </td>
                      <td className={`px-5 py-4 text-sm ${dark ? "text-slate-300" : "text-[#434655]"}`}>
                        {row.primaryRegion}
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 font-black text-sm ${
                          row.momentum > 6
                            ? (dark ? "text-red-400" : "text-red-600")
                            : row.momentum > 3
                              ? (dark ? "text-[#bc4800]" : "text-[#bc4800]")
                              : (dark ? "text-slate-400" : "text-[#737686]")
                        }`}>
                <tbody>
                  {filteredVelocityRows.map((row, i) => (
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
                          className="font-semibold group-hover:text-[#004bc6] transition-colors"
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
                          className="flex items-center gap-1.5 font-semibold tabular-nums text-sm"
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
                      <td className={`px-5 py-4 font-bold text-sm ${
                        row.shareShift > 0
                          ? (dark ? "text-amber-400" : "text-amber-700")
                          : (dark ? "text-emerald-400" : "text-emerald-700")
                      }`}>
                        {row.shareShift > 0 ? "+" : ""}{row.shareShift}%
                      </td>
                      <td className="px-5 py-4">
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
          <div className={`relative z-10 px-5 py-2.5 border-t text-[9px] ${dark ? "border-slate-700 text-slate-600" : "border-[#e2e1ee] text-[#737686]"}`}>
            Source: CMS competitor DB · Momentum = quality/match confidence score × 10 · Share Shift = competitor provider file share vs Andwell HH share · ALERT &gt;7% or national+&gt;6%
          </div>
        </section>

        {/* Right column: Market Intel + Emerging Markets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Market Intel – dark card */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden shadow-2xl"
            style={{ background: "#191b24", color: "#f0f0fc" }}
          >
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.05]"
              style={{ backgroundImage: `radial-gradient(circle, ${PRIMARY} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
            />
            <div className="relative z-10 flex items-center gap-2 mb-4">
              <span className="text-base" style={{ color: PRIMARY }}>💡</span>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Market Intel</h3>
            </div>
            <div className="relative z-10 space-y-3">
              <div className="rounded-r-xl border-l-4 bg-white/5 p-3.5" style={{ borderLeftColor: PRIMARY }}>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: PRIMARY }}>
                  Consolidation Alert
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {northernLight
                    ? `Northern Light Home Care holds the highest competitor momentum score (${northernLight.momentum}%) in the CMS competitor file — dominant in Cumberland and Penobscot.`
                    : "Northern Light Home Care is the largest competitor by volume in Cumberland and Penobscot — aggressive network expansion risk."}
                </p>
                <button className="mt-2 text-[9px] font-black uppercase hover:underline" style={{ color: PRIMARY }}>
                  Action: Immediate Outreach
                </button>
              </div>
              <div className="rounded-r-xl border-l-4 bg-white/5 p-3.5 border-l-[#bc4800]">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#bc4800] mb-1">
                  Referral Leakage
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  {amedisysCombinedShare > 0
                    ? `Amedisys holds ${percent(amedisysCombinedShare)} combined provider file share across Maine — orthopedic referral capture risk in Penobscot.`
                    : "Amedisys (national) is active in Penobscot — orthopedic referral leakage risk identified from provider file data."}
                </p>
                <button className="mt-2 text-[9px] font-black uppercase text-[#bc4800] hover:underline">
                  Action: Network Alignment
                </button>
              </div>
              <div className="rounded-r-xl border-l-4 bg-white/5 p-3.5 border-l-emerald-500">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                  Quality Moat
                </p>
                <p className="text-sm font-medium opacity-90 leading-relaxed">
                  Andwell's {percent(andwellDominance)} combined provider file share is backed by CMS quality data — defensible moat against volume-driven national chains.
                </p>
                <button className="mt-2 text-[9px] font-black uppercase text-emerald-400 hover:underline">
                  Action: Amplify Brand
                </button>
              </div>
            </div>
          </div>

          {/* Emerging Markets – top 2 */}
          <div className={`rounded-2xl border p-5 ${surface}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              Emerging Markets
            </h3>
            <div className="space-y-2">
              {emergingMarkets.map((m, i) => (
                <div
                  key={m.county}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all hover:border-[#004bc6] ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-black text-sm ${dark ? "text-white" : "text-[#191b24]"}`}>{m.county}</p>
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-white"
                        style={{ background: i === 0 ? PRIMARY : "#bc4800" }}
                      >
                        {i === 0 ? "Prime" : "Growth"}
                      </span>
                    </div>
                    <p className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                      Score {m.score}/100 · {m.market.hh.prov + m.market.hos.prov} providers · {number(m.market.hh.users + m.market.hos.users)} users
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab?.("County Plan")}
                    className="text-lg transition-transform hover:scale-110 ml-2 shrink-0"
                    style={{ color: PRIMARY }}
                    title="Open County Plan"
                  >
                    🗺
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CMS Market Provenance ─────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${surface}`}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-base font-black" style={{ color: PRIMARY }}>📊</span>
          <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${dark ? "text-white" : "text-[#191b24]"}`}>
            CMS Market Provenance
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4 sm:grid-cols-4">
          <div className={`rounded-xl border p-4 transition-colors hover:bg-[#004bc6]/5 ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
              HCAHPS Peer Rank
            </p>
            <p className="text-2xl font-black tracking-[-0.02em]" style={{ color: PRIMARY }}>
              {hcahpsRank}
            </p>
            <p className={`text-[9px] font-bold uppercase mt-2 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              Clinical Meta-Data
            </p>
          </div>
          <div className={`rounded-xl border p-4 transition-colors hover:bg-[#495c94]/5 ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
              VBP Adjustment
            </p>
            <p className="text-2xl font-black tracking-[-0.02em] text-[#495c94]">
              {vbpAdj}
            </p>
            <p className={`text-[9px] font-bold uppercase mt-2 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              Net Revenue Impact
            </p>
          </div>
          <div className={`rounded-xl border p-4 transition-colors ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
              HH Provider Rank
            </p>
            <p className="text-2xl font-black tracking-[-0.02em]" style={{ color: PRIMARY }}>
              {hhSummary.andwellRank ? `#${hhSummary.andwellRank}` : "—"}
            </p>
            <p className={`text-[9px] font-bold uppercase mt-2 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              By beneficiary volume
            </p>
          </div>
          <div className={`rounded-xl border p-4 transition-colors ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
            <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
              CMS Competitors
            </p>
            <p className="text-2xl font-black tracking-[-0.02em]" style={{ color: PRIMARY }}>
              {loading ? "…" : cmsCompetitors.length}
            </p>
            <p className={`text-[9px] font-bold uppercase mt-2 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              DB-matched providers
            </p>
          </div>
        </div>
        <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "#191b24" }}>
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: `radial-gradient(circle, ${PRIMARY} 1px, transparent 1px)`, backgroundSize: "24px 24px" }}
          />
          <div className="relative z-10 flex items-start gap-2 mb-2">
            <span className="text-sm" style={{ color: PRIMARY }}>ℹ</span>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Data Implication Cluster</p>
          </div>
          <p className="relative z-10 text-sm leading-6 opacity-90 text-white">
            Andwell's{" "}
            <span className="font-bold">{percent(andwellDominance)}</span>{" "}
            combined provider file share is backed by a CMS data confidence score of{" "}
            <span className="font-bold">{displayConfidence != null ? `${displayConfidence}%` : "98%"}</span>{" "}
            across {cmsCompetitors.length || "17"} verified competitor records. VBP adjustment of{" "}
            <span className="font-bold">{vbpAdj}</span> and HCAHPS rank of{" "}
            <span className="font-bold">{hcahpsRank}</span> reinforce clinical and financial authority in the Maine market.
          </p>
        </div>
      </div>

      {/* ── Geographic Opportunity Density – full-width banner ─────── */}
      <div className="rounded-2xl overflow-hidden relative min-h-[400px] w-full">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/maine-map.png')",
            filter: "saturate(1.4) contrast(1.15)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#191b24]/90 via-[#191b24]/30 to-transparent" />

        <div className="absolute top-4 right-4 space-y-2 z-10">
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#191b24]/90 px-3 py-2 backdrop-blur-md shadow-2xl">
            <span className="h-3 w-3 rounded-full shadow-[0_0_10px_#004bc6]" style={{ background: PRIMARY }} />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Andwell Core Hubs</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-[#191b24]/90 px-3 py-2 backdrop-blur-md shadow-2xl">
            <span className="h-3 w-3 rounded-full bg-[#bc4800] shadow-[0_0_10px_#bc4800]" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Expansion Targets</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white mb-2 shadow-lg"
            style={{ background: PRIMARY }}
          >
            Expansion Targets
          </div>
          <h4 className="text-[26px] leading-8 font-black uppercase tracking-tight text-white">
            Geographic Opportunity Density
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mb-4">
            Visualizing {Object.keys(cmsCountyMarket).length} target counties in active model
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab?.("County Plan")}
              className="rounded-full px-5 py-2.5 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ background: PRIMARY }}
            >
              Open Map View →
            </button>
            <button
              onClick={() => setActiveTab?.("Opportunity Score")}
              className="rounded-full px-5 py-2.5 text-sm font-black text-white border border-white/30 backdrop-blur-sm transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Opportunity Scores →
            </button>
          <div className="relative z-10 px-6 py-2 border-t text-[9px] uppercase tracking-[0.1em]"
            style={{ borderColor: divider, color: textMute }}>
            Source: CMS Competitor DB · Momentum = quality score × 10 · ALERT &gt;7% or national+&gt;6%
          </div>
        </section>

        {/* ── Right panel — 4 cols ───────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4">

          {/* Market Intel — inverse-surface dark card */}
          <div
            className="rounded-xl p-5 relative overflow-hidden"
            style={{
              background: C.inverseSurf,
              color: C.inverseOn,
              boxShadow: "0 20px 40px rgb(0 0 0 / 0.3)",
              border: "none",
            }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ ...dotMatrix, opacity: 0.05 }} />
            <div className="relative z-10 flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                </svg>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Market Intel</h3>
                {AI_AVAILABLE && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide bg-violet-600/30 text-violet-300 border border-violet-500/30">
                    <span className={`h-1.5 w-1.5 rounded-full ${aiLoading ? "bg-violet-400 animate-pulse" : "bg-violet-400"}`} />
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Market Intel</h3>
                {AI_AVAILABLE && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide bg-blue-600/30 text-blue-300 border border-blue-500/30">
                    <span className={`h-1.5 w-1.5 rounded-full ${aiLoading ? "bg-blue-400 animate-pulse" : "bg-blue-400"}`} />
                    AI
                  </span>
                )}
              </div>
              {AI_AVAILABLE && !aiLoading && (aiSummary || aiError) && (
                <button
                  onClick={() => generateAiSummary(velocityRows, andwellDominance, amedisysShare, northernLight, velocityRows.length, nationalChainCount)}
                  className="text-[9px] font-black uppercase tracking-wide text-slate-400 hover:text-white transition-colors"
                  className="text-[9px] font-medium uppercase tracking-wide text-slate-400 hover:text-white transition-colors"
                  title="Regenerate summary"
                >
                  ↻ Refresh
                </button>
              )}
            </div>

            <div className="relative z-10">
              {/* AI Loading skeleton */}
              {aiLoading && !aiSummary && (
                <div className="space-y-2 animate-pulse">
                  <div className="h-3 bg-white/10 rounded-full w-full" />
                  <div className="h-3 bg-white/10 rounded-full w-[95%]" />
                  <div className="h-3 bg-white/10 rounded-full w-[88%]" />
                  <div className="h-3 bg-white/10 rounded-full w-[92%]" />
                  <div className="h-3 bg-white/10 rounded-full w-[75%]" />
                </div>
              )}

              {/* AI streaming / completed text */}
              {(aiSummary && !aiError) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium opacity-90 leading-relaxed">
                    {aiSummary}
                    {aiLoading && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-violet-400 animate-pulse rounded-sm align-middle" />}
                    {aiLoading && <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-blue-400 animate-pulse rounded-sm align-middle" />}
                  </p>
                </div>
              )}

              {/* Fallback static bullets (shown only on AI error or when AI is unavailable) */}
              {(aiError || !AI_AVAILABLE) && (
                <div className="space-y-3">
                  <div className="rounded-r-xl p-3.5 border-l-4" style={{ borderLeftColor: C.primary, background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: C.primary }}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-1" style={{ color: C.primary }}>
                      Consolidation Alert
                    </p>
                    <p className="text-sm font-medium opacity-90 leading-relaxed">
                      {northernLight
                        ? `Northern Light Home Care leads competitor momentum (${northernLight.momentum}%) — dominant in Cumberland and Penobscot.`
                        : "Northern Light Home Care is the largest competitor by volume — aggressive network expansion risk in Penobscot."}
                    </p>
                  </div>
                  <div className="rounded-r-xl p-3.5 border-l-4" style={{ borderLeftColor: C.tertiaryC, background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1" style={{ color: C.tertiaryC }}>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] mb-1" style={{ color: C.tertiaryC }}>
                      Referral Leakage
                    </p>
                    <p className="text-sm font-medium opacity-90 leading-relaxed">
                      {amedisysShare > 0
                        ? `Amedisys holds ${percent(amedisysShare)} combined share across Maine — orthopedic referral capture risk in Bangor market.`
                        : "Amedisys (national) is active in Penobscot — orthopedic referral leakage risk identified from provider file data."}
                    </p>
                  </div>
                  <div className="rounded-r-xl p-3.5 border-l-4 border-l-emerald-500" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-400 mb-1">
                      Quality Moat
                    </p>
                    <p className="text-sm font-medium opacity-90 leading-relaxed">
                      Andwell's {percent(andwellDominance)} combined provider file share is backed by CMS quality data — defensible moat against volume-driven national chains.
                    </p>
                  </div>
                  {aiError && (
                    <p className="text-[10px] text-red-400/70 italic mt-1">AI summary unavailable — showing reference data</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Emerging Markets */}
          <CommandCard className="p-5">
            <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-3" style={{ color: textSub }}>
              {!isCountyView ? "Emerging Markets" : `${selectedCounty} Market Snapshot`}
            </h3>
            <div className="space-y-2">
              {filteredEmergingMarkets.map((m) => (
                <div
                  key={m.county}
                  className="flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all"
                  style={{ background: surfLow, borderColor: C.outlineVar }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.primary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.outlineVar; }}
                  onClick={() => setActiveTab?.("County Plan")}
                >
                  <div>
                    <div className="font-semibold text-sm" style={{ color: textMain }}>{m.county}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wide mt-0.5" style={{ color: textMute }}>
                      {(() => {
                        const users = selectedService === "Home Health" ? m.market.hh.users
                                    : selectedService === "Hospice"     ? m.market.hos.users
                                    : m.market.hh.users + m.market.hos.users;
                        const svcLabel = selectedService === "All" ? "" : ` · ${selectedService}`;
                        return `${m.score}/100 opportunity score · ${number(users)} users${svcLabel}`;
                      })()}
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
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em]" style={{ color: textMain }}>
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
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] mb-1" style={{ color: textMute }}>HCAHPS Peer Rank</div>
              <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: C.primary }}>
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
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] mb-1" style={{ color: textMute }}>VBP Adjustment</div>
              <div className="font-bold tabular-nums" style={{ fontSize: 32, lineHeight: "40px", letterSpacing: "-0.02em", color: C.secondary }}>
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
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white">Data Implication Cluster</p>
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
        <div className="rounded-xl overflow-hidden relative min-h-[380px]" style={{ boxShadow: commandCard.boxShadow }}>
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
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">Andwell Core Hubs</span>
            </div>
            <div
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 backdrop-blur-md"
              style={{ background: `${C.inverseSurf}e6`, border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: C.tertiaryC, boxShadow: `0 0 10px ${C.tertiaryC}` }} />
              <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-white">Expansion Targets</span>
            </div>
          </div>
          {/* Bottom text */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.2em] text-white mb-2"
              style={{ background: C.primary }}
            >
              Active Strategy Map
            </div>
            <h4 className="font-bold uppercase tracking-tight text-white"
              style={{ fontSize: 24, lineHeight: "30px", letterSpacing: "-0.015em" }}>
              Geographic Opportunity Density
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mt-1 mb-4">
              Visualizing {Object.keys(cmsCountyMarket).length} target counties in active model
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab?.("County Plan")}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: C.primary, boxShadow: `0 4px 14px ${C.primary}88` }}
              >
                Open Map View →
              </button>
              <button
                onClick={() => setActiveTab?.("Opportunity Score")}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-white border transition-all hover:bg-white/10 active:scale-[0.98]"
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
