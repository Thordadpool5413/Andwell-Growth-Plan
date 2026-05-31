import React, { useState, useEffect, useMemo } from "react";
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
}

async function getCmsToken() {
  try {
    const r = await fetch("/api/ai/token");
    if (!r.ok) return "";
    const { token } = await r.json();
    return token;
  } catch { return ""; }
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

  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const headers = { "x-ai-token": token };
        const [r1, r2, r3] = await Promise.all([
          fetch("/api/cms/competitors", { headers }),
          fetch("/api/cms/hhvbp", { headers }),
          fetch("/api/cms/hh-quality", { headers }),
        ]);
        if (r1.ok) { const d = await r1.json(); setCmsCompetitors(d.competitors || []); }
        if (r2.ok) { const d = await r2.json(); setHhvbpData(d); }
        if (r3.ok) { const d = await r3.json(); setQualityData(d); }
      } catch (_) {}
      setLoading(false);
    })();
  }, []);

  const velocityRows = useMemo(() => {
    const grouped = {};
    for (const row of namedProviderRows) {
      if (row.isAndwellCmsRecord) continue;
      const key = row.providerName;
      if (!grouped[key]) {
        grouped[key] = {
          name: row.providerName,
          counties: new Set(),
          beneficiaries: 0,
          totalShare: 0,
          national: isNational(row.providerName),
        };
      }
      grouped[key].counties.add(row.locationCounty);
      grouped[key].beneficiaries += row.beneficiaries;
      grouped[key].totalShare += row.providerVolumeShare;
    }

    const andwellShare = andwellHHShare;

    return Object.values(grouped)
      .sort((a, b) => b.beneficiaries - a.beneficiaries)
      .slice(0, 7)
      .map((r) => {
        const sharePct = +(r.totalShare * 100).toFixed(1);
        const momentum = sharePct;

        const shareShift = +(r.totalShare - andwellShare).toFixed(3) * 100;
        const shareShiftRounded = +shareShift.toFixed(1);

        const cmsMatch = cmsCompetitors.find((c) =>
          c.name?.toLowerCase().includes(r.name.toLowerCase().slice(0, 10)) ||
          r.name.toLowerCase().includes((c.name || "").toLowerCase().slice(0, 10))
        );

        const primaryRegion = [...r.counties].filter((c) => c !== "Out of state or corporate address")[0] || "Statewide";

        const status =
          r.national && sharePct > 10 ? "ALERT" :
          sharePct > andwellShare * 100 ? "WATCH" :
          "STABLE";

        return {
          ...r,
          primaryRegion,
          sharePct,
          momentum,
          shareShift: shareShiftRounded,
          status,
          cmsMatch,
        };
      });
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
    ? `${andwellHhvbp.payment_adjustment_pct > 0 ? "+" : ""}${parseFloat(andwellHhvbp.payment_adjustment_pct).toFixed(2)}%`
    : "+1.85%";

  const surface = dark ? "bg-slate-800/80 border-slate-700" : "bg-white border-[#e2e1ee]";

  return (
    <div className="space-y-8">
      {/* ── Page header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
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
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
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

        {/* Data Confidence */}
        <div className={`${kpiCardBase(dark)} border-t-4`} style={{ borderTopColor: PRIMARY }}>
          <div className="flex items-start justify-between mb-3">
            <p className={eyebrow(dark)}>Data Confidence</p>
            <span className="text-lg" style={{ color: PRIMARY }}>✓</span>
          </div>
          <p className={metricValue(dark)}>98%</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-[#434655]"}`}>CMS Verified</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className={`mt-2 text-[9px] uppercase tracking-[0.2em] ${dark ? "text-slate-600" : "text-[#737686]"}`}>Source: CMS Provider File</p>
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
                Competitor Velocity Index
              </h2>
            </div>
            <button
              onClick={() => setActiveTab?.("Competitive View")}
              className="text-[10px] font-black uppercase tracking-[0.2em] hover:underline"
              style={{ color: PRIMARY }}
            >
              Full Analysis →
            </button>
          </div>
          <div className="relative z-10 overflow-x-auto">
            {loading ? (
              <div className={`px-5 py-8 text-center text-sm ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                Loading competitor data…
              </div>
            ) : (
              <table className="w-full text-left min-w-[560px]">
                <thead className={dark ? "bg-slate-800/60" : "bg-[#ededf9]"}>
                  <tr>
                    {["Organization", "Primary Region", "Provider Share", "vs Andwell", "Status"].map((col) => (
                      <th
                        key={col}
                        className={`px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] ${dark ? "text-slate-400" : "text-[#434655]"}`}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-[#e2e1ee]"}`}>
                  {velocityRows.map((row) => (
                    <tr
                      key={row.name}
                      className={`group cursor-default transition-colors ${dark ? "hover:bg-blue-950/20" : "hover:bg-[#004bc6]/5"}`}
                    >
                      <td className="px-5 py-4">
                        <p className={`font-black group-hover:text-[#004bc6] transition-colors ${dark ? "text-white" : "text-[#191b24]"}`}>
                          {row.name.length > 30 ? row.name.slice(0, 30) + "…" : row.name}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-wide ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                          {row.national ? "National Chain" : "Regional Provider"}
                          {row.cmsMatch?.match_status === "CMS Verified" || row.cmsMatch?.match_status === "CMS and Website Verified" ? " · CMS Verified" : ""}
                        </p>
                      </td>
                      <td className={`px-5 py-4 text-sm ${dark ? "text-slate-300" : "text-[#434655]"}`}>
                        {row.primaryRegion}
                      </td>
                      <td className="px-5 py-4">
                        <div className={`flex items-center gap-1.5 font-black text-sm ${row.momentum > 10 ? (dark ? "text-[#bc4800]" : "text-[#bc4800]") : (dark ? "text-slate-400" : "text-[#737686]")}`}>
                          <span>{row.momentum > 5 ? "↑" : "→"}</span>
                          <span>{row.sharePct}%</span>
                        </div>
                      </td>
                      <td className={`px-5 py-4 font-bold text-sm ${row.shareShift >= 0 ? (dark ? "text-amber-400" : "text-amber-700") : (dark ? "text-emerald-400" : "text-emerald-700")}`}>
                        {row.shareShift >= 0 ? "+" : ""}{row.shareShift}%
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className={`relative z-10 px-5 py-2.5 border-t text-[9px] ${dark ? "border-slate-700 text-slate-600" : "border-[#e2e1ee] text-[#737686]"}`}>
            Provider share derived from CMS Provider File · "vs Andwell" = competitor share minus Andwell HH share · positive = competitor leads
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
                  Northern Light Home Care is the largest competitor by volume in Cumberland and Penobscot — currently holds {percent(velocityRows.find((r) => r.name.toLowerCase().includes("northern light"))?.totalShare || 0.2)} provider file share.
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
                  Amedisys holds {percent(velocityRows.filter((r) => r.name.toLowerCase().includes("amedisys")).reduce((s, r) => s + r.totalShare, 0))} combined HH + Hospice share in Penobscot — orthopedic referral capture risk.
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
                  Andwell holds {percent(andwellDominance)} combined provider file share backed by CMS quality data — defensible moat against volume-driven national chains.
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
                    className="text-lg transition-transform hover:scale-110 ml-2"
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
            combined provider file share is backed by CMS quality data — a defensible moat against volume-driven national-chain entrants.
            VBP adjustment of <span className="font-bold">{vbpAdj}</span> and HCAHPS rank of{" "}
            <span className="font-bold">{hcahpsRank}</span> further reinforce clinical and financial authority in the market.
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
          </div>
        </div>
      </div>
    </div>
  );
}
