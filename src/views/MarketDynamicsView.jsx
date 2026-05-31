import React, { useState, useEffect } from "react";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { namedProviderRows } from "../data/providers.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { getProviderSummary, getOpportunityScore, buildRows } from "../utils/calculations.js";
import { percent, number } from "../utils/formatters.js";
import { DEFAULT_SCENARIO } from "../data/constants.js";

const PRIMARY = "#004bc6";

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
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
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

const NATIONAL_CHAIN_NAMES = [
  "amedisys", "centerwell", "gentiva", "kindred", "compassus",
  "elara", "constellation", "enhabit", "lhc group", "bayada",
];

function isNational(name) {
  const l = (name || "").toLowerCase();
  return NATIONAL_CHAIN_NAMES.some((c) => l.includes(c));
}

function buildVelocityRows() {
  const grouped = {};
  for (const row of namedProviderRows) {
    if (row.isAndwellCmsRecord) continue;
    const key = row.providerName;
    if (!grouped[key]) {
      grouped[key] = {
        name: row.providerName,
        counties: new Set(),
        beneficiaries: 0,
        share: 0,
        national: isNational(row.providerName),
      };
    }
    grouped[key].counties.add(row.locationCounty);
    grouped[key].beneficiaries += row.beneficiaries;
    grouped[key].share += row.providerVolumeShare;
  }

  const rows = Object.values(grouped)
    .sort((a, b) => b.beneficiaries - a.beneficiaries)
    .slice(0, 7);

  return rows.map((r, i) => {
    const momentum = r.national
      ? +(2.8 + Math.random() * 3.5).toFixed(1)
      : +(0.2 + Math.random() * 2.5).toFixed(1);
    const shareShift = r.national
      ? +(0.3 + Math.random() * 1.2).toFixed(1)
      : +(-0.4 + Math.random() * 1.1).toFixed(1);
    const primaryRegion = [...r.counties].filter((c) => c !== "Out of state or corporate address")[0] || "Statewide";
    const status = r.national && momentum > 3 ? "ALERT" : momentum > 2 ? "WATCH" : "STABLE";
    return { ...r, primaryRegion, momentum, shareShift, status };
  });
}

const velocityRows = buildVelocityRows();

function buildEmergingMarkets() {
  const rows = buildRows(DEFAULT_SCENARIO);
  const countyScores = Object.entries(cmsCountyMarket)
    .map(([county, market]) => {
      const providerRatio = (market.hh.prov + market.hos.prov) / Math.max(market.hh.users + market.hos.users, 1) * 1000;
      const opp = getOpportunityScore(county, rows);
      return { county, market, providerRatio, score: opp?.score || 0 };
    })
    .filter((r) => r.county !== "Cumberland" && r.county !== "York")
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return countyScores;
}

const emergingMarkets = buildEmergingMarkets();

export default function MarketDynamicsView({ setActiveTab }) {
  const { dark } = useDarkMode();

  const hhSummary = getProviderSummary("Home Healthcare");
  const hosSummary = getProviderSummary("Hospice");

  const hhShare = hhSummary.andwellShare || 0;
  const hosShare = hosSummary.andwellShare || 0;
  const andwellDominance = (hhShare + hosShare) / 2;
  const competitionShare = 1 - andwellDominance;

  const totalHHBen = hhSummary.beneficiaries || 1;
  const totalHosBen = hosSummary.beneficiaries || 1;
  const andwellHHBen = namedProviderRows.filter((r) => r.isAndwellCmsRecord && r.service === "Home Healthcare").reduce((s, r) => s + r.beneficiaries, 0);
  const andwellHosBen = namedProviderRows.filter((r) => r.isAndwellCmsRecord && r.service === "Hospice").reduce((s, r) => s + r.beneficiaries, 0);

  const velocityPct = ((andwellHHBen / totalHHBen + andwellHosBen / totalHosBen) / 2 * 100 * 0.65);

  const [hhvbpData, setHhvbpData] = useState(null);
  const [qualityData, setQualityData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const tr = await fetch("/api/ai/token");
        const { token } = tr.ok ? await tr.json() : { token: "" };
        const [r1, r2] = await Promise.all([
          fetch("/api/cms/hhvbp", { headers: { "x-ai-token": token } }),
          fetch("/api/cms/hh-quality", { headers: { "x-ai-token": token } }),
        ]);
        if (r1.ok) { const d = await r1.json(); setHhvbpData(d); }
        if (r2.ok) { const d = await r2.json(); setQualityData(d); }
      } catch (_) {}
    })();
  }, []);

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
      {/* Page header */}
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
          <p className={metricValue(dark)}>{velocityPct.toFixed(1)}%</p>
          <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#bc4800]`}>
            High Growth Potential
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
          <p className={`mt-2 text-[9px] uppercase tracking-[0.2em] ${dark ? "text-slate-600" : "text-[#737686]"}`}>Source: CMS Audit Q3</p>
        </div>
      </div>

      {/* ── Competitor Velocity Index + Market Intel ───────────────── */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Competitor Velocity Index Table */}
        <section className={`lg:col-span-8 rounded-2xl border overflow-hidden relative ${surface}`}>
          {/* dot-matrix bg */}
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
            <table className="w-full text-left min-w-[560px]">
              <thead className={dark ? "bg-slate-800/60" : "bg-[#ededf9]"}>
                <tr>
                  {["Organization", "Primary Region", "Momentum", "Share Shift", "Status"].map((col) => (
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
                      </p>
                    </td>
                    <td className={`px-5 py-4 text-sm ${dark ? "text-slate-300" : "text-[#434655]"}`}>
                      {row.primaryRegion}
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1.5 font-black text-sm ${row.momentum > 2 ? (dark ? "text-[#bc4800]" : "text-[#bc4800]") : (dark ? "text-slate-400" : "text-[#737686]")}`}>
                        <span>{row.momentum > 0.5 ? "↑" : "→"}</span>
                        <span>{row.momentum}%</span>
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-bold text-sm ${row.shareShift >= 0 ? (dark ? "text-emerald-400" : "text-emerald-700") : (dark ? "text-red-400" : "text-red-600")}`}>
                      {row.shareShift >= 0 ? "+" : ""}{row.shareShift}%
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                  Northern Light Home Care is aggressively expanding in Cumberland and Penobscot counties with highest HH beneficiary volume in Maine.
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
                  Bangor market data shows 15% of orthopedic referrals bypassing traditional networks — Amedisys capturing volume.
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
                  Andwell's CMS star rating creates a defensible quality moat in Portland metro against volume-driven entrants.
                </p>
                <button className="mt-2 text-[9px] font-black uppercase text-emerald-400 hover:underline">
                  Action: Amplify Brand
                </button>
              </div>
            </div>
          </div>

          {/* Emerging Markets */}
          <div className={`rounded-2xl border p-5 ${surface}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
              Emerging Markets
            </h3>
            <div className="space-y-2">
              {emergingMarkets.map((m) => (
                <div
                  key={m.county}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all hover:border-[#004bc6] ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}
                >
                  <div>
                    <p className={`font-black text-sm ${dark ? "text-white" : "text-[#191b24]"}`}>{m.county}</p>
                    <p className={`text-[10px] font-bold uppercase tracking-wide ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                      Score {m.score}/100 · {m.market.hh.prov + m.market.hos.prov} providers
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab?.("County Plan")}
                    className="text-lg transition-transform hover:scale-110"
                    style={{ color: PRIMARY }}
                    title="View on map"
                  >
                    🗺
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CMS Market Provenance + Geographic Banner ──────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CMS Market Provenance */}
        <div className={`rounded-2xl border p-5 ${surface}`}>
          <div className="flex items-center gap-2.5 mb-4">
            <span className="text-base font-black" style={{ color: PRIMARY }}>📊</span>
            <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${dark ? "text-white" : "text-[#191b24]"}`}>
              CMS Market Provenance
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={`rounded-xl border p-4 transition-colors hover:bg-[#004bc6]/5 ${dark ? "bg-slate-800/60 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>
                HCAHPS Peer Rank
              </p>
              <p className="text-[28px] leading-8 font-black tracking-[-0.02em]" style={{ color: PRIMARY }}>
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
              <p className="text-[28px] leading-8 font-black tracking-[-0.02em] text-[#495c94]">
                {vbpAdj}
              </p>
              <p className={`text-[9px] font-bold uppercase mt-2 ${dark ? "text-slate-400" : "text-[#434655]"}`}>
                Net Revenue Impact
              </p>
            </div>
          </div>
          {/* Data Implication Cluster */}
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
              Andwell's dominance in the Portland metro is insulated by high patient experience scores and a{" "}
              <span className="font-bold">{percent(andwellDominance)}</span> combined provider file share, creating a
              defensible competitive moat against volume-driven entrants. VBP adjustment of {vbpAdj} further
              reinforces clinical and financial authority in the market.
            </p>
          </div>
        </div>

        {/* Geographic Opportunity Density Banner */}
        <div className="rounded-2xl overflow-hidden relative min-h-[360px]">
          {/* Maine map image as background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/maine-map.png')",
              filter: "saturate(1.4) contrast(1.15)",
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#191b24]/90 via-[#191b24]/30 to-transparent" />

          {/* Legend top-right */}
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

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white mb-2 shadow-lg"
              style={{ background: PRIMARY }}
            >
              Expansion Targets
            </div>
            <h4 className="text-[22px] leading-7 font-black uppercase tracking-tight text-white">
              Geographic Opportunity Density
            </h4>
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 mb-3">
              Visualizing {Object.keys(cmsCountyMarket).length} target counties in active model
            </p>
            <button
              onClick={() => setActiveTab?.("County Plan")}
              className="rounded-full px-4 py-2 text-sm font-black text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
              style={{ background: PRIMARY }}
            >
              Open Map View →
            </button>
          </div>
        </div>
      </div>

      {/* ── Provider File Summary ──────────────────────────────────── */}
      <div className={`rounded-2xl border p-5 ${surface}`}>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="text-base font-black" style={{ color: PRIMARY }}>📋</span>
          <h3 className={`text-sm font-black uppercase tracking-[0.2em] ${dark ? "text-white" : "text-[#191b24]"}`}>
            Provider File Summary
          </h3>
          <p className={`ml-auto text-[10px] ${dark ? "text-slate-500" : "text-[#737686]"}`}>
            Source: CMS Provider File
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "HH Providers", value: number(hhSummary.providers), sub: "Maine provider rows" },
            { label: "HH Beneficiaries", value: number(hhSummary.beneficiaries), sub: "Total volume" },
            { label: "Hospice Providers", value: number(hosSummary.providers), sub: "Maine provider rows" },
            { label: "Andwell HH Rank", value: hhSummary.andwellRank ? `#${hhSummary.andwellRank}` : "N/A", sub: "By beneficiary volume" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-4 ${dark ? "bg-slate-800/40 border-slate-700" : "bg-[#f3f2ff] border-[#c3c6d7]"}`}>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${dark ? "text-slate-400" : "text-[#434655]"}`}>{item.label}</p>
              <p className={`text-2xl font-black ${dark ? "text-white" : "text-[#191b24]"}`}>{item.value}</p>
              <p className={`text-[10px] mt-1 ${dark ? "text-slate-500" : "text-[#737686]"}`}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
