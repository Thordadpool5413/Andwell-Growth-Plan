import React, { useState, useRef, useCallback, useEffect } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import Abbr from "../components/Abbr.jsx";
import AiBadge from "../components/AiBadge.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import EstBadge from "../components/EstBadge.jsx";
import MaineMap from "../components/MaineMap.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getCountyIntelligence, getOpportunityScore } from "../utils/calculations.js";
import { streamChat, buildCountyPrompt, AI_AVAILABLE } from "../utils/ai.js";
import { currency, number, percent } from "../utils/formatters.js";
import { themeClasses } from "../utils/themeClasses.js";
import { MAINE_COUNTIES, getCountyDashboardRecord, getFreshness } from "../data/dashboardData.js";

export default function CountyPlan({ rows, selectedCounty, setSelectedCounty, competitorProviderType, setCompetitorProviderType, mapLayer, setMapLayer }) {
  const { dark } = useDarkMode();
  const selectedRecord = getCountyDashboardRecord(selectedCounty, rows);
  const freshness = getFreshness();
  const selected = rows.find((row) => row.county === selectedCounty) || {
    county: selectedCounty,
    service: "Not in current launch plan",
    launchGroup: "Not in plan",
    starts: [0, 0, 0],
    referrals: [0, 0, 0],
    revenue: [0, 0, 0],
    meta: { unit: "No modeled starts" },
    basis: "No modeled planning row",
    reason: "This county is shown with official Maine county boundaries but is not currently included in the active launch plan.",
    current: "No active Andwell launch-plan row in this model.",
    missing: "No service-line gap is modeled for this county in the current plan.",
    accounts: [],
  };
  const intel = getCountyIntelligence(selected.county, rows);
  const displayRows = [
    ...rows,
    ...MAINE_COUNTIES
      .filter((county) => !rows.some((row) => row.county === county.name))
      .map((county) => ({
        county: county.name,
        service: "Not in plan",
        launchGroup: "Not in plan",
        starts: [0, 0, 0],
        referrals: [0, 0, 0],
        revenue: [0, 0, 0],
      })),
  ];
  const countyMarket = selectedRecord.market;
  const sourceMarket = selectedRecord.sourceMarket;
  const countyProviders = selectedRecord.providers || [];
  const topCountyProviders = countyProviders.slice(0, 4);
  const qualityRows = selectedRecord.homeHealthAgencies || [];
  const hhvbpRows = selectedRecord.hhvbp || [];
  const hospiceRows = selectedRecord.hospiceProviders || [];
  const hospiceCahpsRows = selectedRecord.hospiceCahps || [];
  const hrsaRows = selectedRecord.hrsaHospiceFacilities || [];
  const qualitySummary = selectedRecord.quality;
  const providerLandscape = selectedRecord.providerLandscape;
  const qualityStarRows = qualityRows.filter((row) => row.star_rating != null);
  const avgQualityStar = qualityStarRows.length
    ? qualityStarRows.reduce((sum, row) => sum + Number(row.star_rating), 0) / qualityStarRows.length
    : null;
  const hhvbpValues = hhvbpRows
    .map((row) => row.total_performance_score ?? row.overall_rating_score ?? row.care_of_patients_score)
    .filter((value) => value != null);
  const hhvbpDisplay = hhvbpValues.length
    ? hhvbpValues.reduce((sum, value) => sum + Number(value), 0) / hhvbpValues.length
    : null;
  const cmsMarketDetail = countyMarket
    ? `HH users ${number(countyMarket.home_health_users)} · Hospice users ${number(countyMarket.hospice_users)}`
    : "CMS PUF county row not bundled";

  const [aiText, setAiText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const abortRef = useRef(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    abortRef.current?.abort();
    setAiText("");
    setAiError(null);
    setAiGenerating(false);
  }, [selectedCounty]);

  const generateSummary = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setAiText("");
    setAiError(null);
    setAiGenerating(true);

    streamChat({
      messages: buildCountyPrompt(selected, intel, rows),
      signal: controller.signal,
      onChunk: (_, full) => setAiText(full),
      onDone: () => setAiGenerating(false),
      onError: (err) => {
        setAiError(err.message);
        setAiGenerating(false);
      },
    });
  }, [selected, intel, rows]);

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        {/* Map Card */}
        <Card title="Maine county map" eyebrow="Geographic view">
          <MaineMap rows={rows} selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} providerTypeFilter={competitorProviderType} onProviderTypeFilterChange={setCompetitorProviderType} heatmapMode={mapLayer} onHeatmapModeChange={setMapLayer} />
        </Card>

        {/* County Selection List */}
        <Card title="County launch queue" eyebrow="Prioritization — ranked by opportunity score">
          <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${dark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
            <span className="font-semibold">Priority groups: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Priority 1</span> = immediate launch (months 1–12) ·{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">Priority 2</span> = staged expansion (months 7–18) ·{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">Priority 3</span> = targeted growth (months 13–24)
          </div>
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search counties…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm transition ${
                dark
                  ? "border-slate-600 bg-slate-700 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  : "border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none"
              }`}
            />
          </div>
          <div className="space-y-2">
            {displayRows.filter((r) => !search || r.county.toLowerCase().includes(search.toLowerCase())).map((row, index) => {
              const rowIntel = getCountyIntelligence(row.county, rows);
              const oppScore = getOpportunityScore(row.county, rows);
              const score = oppScore?.score ?? 0;
              const isSelected = selectedCounty === row.county;
              const isPlanned = row.launchGroup !== "Not in plan";
              return (
                <button
                  key={row.county}
                  onClick={() => setSelectedCounty(row.county)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? dark ? "border-blue-500 bg-blue-950/50" : "border-blue-500 bg-blue-50"
                      : dark ? "border-slate-700 bg-slate-800 hover:border-blue-600" : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
                      index === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                      : index === 1 ? "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      : index === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300"
                      : dark ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`font-semibold truncate ${dark ? "text-slate-100" : "text-slate-800"}`}>{row.county}</p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {rowIntel?.threat && (
                            <Badge tone={rowIntel.threat.score >= 50 ? "red" : rowIntel.threat.score >= 30 ? "amber" : "green"}>
                              ⚔ {rowIntel.threat.score}
                            </Badge>
                          )}
                          <Badge tone={!isPlanned ? "slate" : row.launchGroup.includes("1") ? "green" : row.launchGroup.includes("2") ? "blue" : "amber"}>
                            {isPlanned ? `P${row.launchGroup.match(/\d/)?.[0] || "?"}` : "Not in plan"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {isPlanned ? <ServiceBadge service={row.service} /> : <Badge tone="slate">Official county boundary</Badge>}
                        <div className="flex-1">
                          <div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
                            <div
                              className={`h-full rounded-full ${score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-amber-500" : "bg-slate-400"}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] font-medium tabular-nums flex-shrink-0 ${score >= 60 ? (dark ? "text-emerald-400" : "text-emerald-600") : (dark ? "text-amber-400" : "text-amber-600")}`}>
                          {score}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* County Details Panel */}
      <div className="space-y-6">
        <Card title={`${selected.county} County`} eyebrow="County detail">
          <div className="mb-3 flex items-center gap-2">
            <FreshnessChip lastSynced={freshness.generatedAt} label="CMS/HRSA data" syncType="Bundled source registry" />
            <Badge tone={selectedRecord.inPlan ? "blue" : "slate"}>{selectedRecord.priority}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              label="Year 1 goal"
              value={number(selected.starts[0])}
              detail={selected.meta.unit}
              sparkData={selected.starts}
              sparkColor="#2563eb"
              color="emerald"
              sourceType="modeled"
            />
            <Metric
              label="Year 1 referrals"
              value={number(selected.referrals[0])}
              detail={<span>At <EstBadge reason="75% referral-to-start conversion rate — NAHC 2023 median for home health and hospice providers.">Est.</EstBadge> 75% modeled conversion.</span>}
              sparkData={selected.referrals}
              sparkColor="#f59e0b"
              color="amber"
              sourceType="modeled"
            />
            <Metric
              label="Year 1 revenue"
              value={currency(selected.revenue[0])}
              detail={<span className="flex items-center gap-1.5 flex-wrap"><SourceBadge basis={selected.basis} /><span>{selected.basis}</span></span>}
              sparkData={selected.revenue}
              sparkColor="#16a34a"
              color="indigo"
              sourceType={selected.basis && selected.basis.toLowerCase().includes("cms") ? "cms" : "modeled"}
            />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={"rounded-2xl border p-4 " + (dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white")}>
              <p className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (dark ? "text-slate-500" : "text-slate-400")}>CMS county market</p>
              <p className={"mt-2 text-2xl font-bold tabular-nums " + (dark ? "text-slate-100" : "text-slate-900")}>{countyMarket?.ffs != null ? number(countyMarket.ffs) : sourceMarket?.ffs != null ? number(sourceMarket.ffs) : "Unavailable"}</p>
              <p className={"mt-1 text-xs " + (dark ? "text-slate-400" : "text-slate-500")}>FFS beneficiaries · {cmsMarketDetail}</p>
            </div>
            <div className={"rounded-2xl border p-4 " + (dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white")}>
              <p className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (dark ? "text-slate-500" : "text-slate-400")}>CMS providers</p>
              <p className={"mt-2 text-2xl font-bold tabular-nums " + (dark ? "text-slate-100" : "text-slate-900")}>{number(providerLandscape.counts.homeHealth + providerLandscape.counts.hospice)}</p>
              <p className={"mt-1 text-xs " + (dark ? "text-slate-400" : "text-slate-500")}>{number(providerLandscape.counts.homeHealth)} home health · {number(providerLandscape.counts.hospice)} hospice records</p>
            </div>
            <div className={"rounded-2xl border p-4 " + (dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white")}>
              <p className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (dark ? "text-slate-500" : "text-slate-400")}>Quality / HHVBP</p>
              <p className={"mt-2 text-2xl font-bold tabular-nums " + (dark ? "text-slate-100" : "text-slate-900")}>{avgQualityStar != null ? avgQualityStar.toFixed(1) + " stars" : hhvbpDisplay != null ? hhvbpDisplay.toFixed(1) : qualitySummary.avgHospiceCahpsScore != null ? qualitySummary.avgHospiceCahpsScore.toFixed(0) : "Unavailable"}</p>
              <p className={"mt-1 text-xs " + (dark ? "text-slate-300" : "text-slate-600")}>{number(qualityRows.length)} HH quality · {number(qualitySummary.hhcahps?.length || 0)} HHCAHPS · {number(hhvbpRows.length)} HHVBP · {number(hospiceCahpsRows.length)} hospice CAHPS</p>
            </div>
            <div className={"rounded-2xl border p-4 " + (dark ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-white")}>
              <p className={"text-[10px] font-semibold uppercase tracking-[0.16em] " + (dark ? "text-slate-500" : "text-slate-400")}>HRSA facilities</p>
              <p className={"mt-2 text-2xl font-bold tabular-nums " + (dark ? "text-slate-100" : "text-slate-900")}>{number(hrsaRows.length)}</p>
              <p className={"mt-1 text-xs " + (dark ? "text-slate-400" : "text-slate-500")}>CMS-approved hospice facility layer records</p>
            </div>
          </div>

          <div className={"mt-4 rounded-2xl border p-4 " + (dark ? "border-blue-900/40 bg-blue-950/20" : "border-blue-100 bg-blue-50")}>
            <div className="flex flex-wrap items-center gap-2">
              <p className={"text-sm font-semibold " + (dark ? "text-blue-100" : "text-blue-950")}>Selected county data context</p>
              <Badge tone={selectedRecord.inPlan ? "blue" : "slate"}>{selectedRecord.priority}</Badge>
              <Badge tone="green">Bundled CMS/HRSA data</Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                { label: "County identity", value: `${selected.county} County`, detail: `${selectedRecord.fips || "FIPS unavailable"} · ${selectedRecord.priority}` },
                { label: "Demand and opportunity", value: countyMarket ? `${number((countyMarket.home_health_users || 0) + (countyMarket.hospice_users || 0))} users` : "Unavailable", detail: cmsMarketDetail },
                { label: "Provider landscape", value: `${number(providerLandscape.counts.all)} records`, detail: `${providerLandscape.counts.homeHealth} home health · ${providerLandscape.counts.hospice} hospice · ${providerLandscape.counts.hrsa} HRSA` },
                { label: "Quality, HHCAHPS, and HHVBP", value: qualitySummary.bestScore ? `${qualitySummary.bestScore.score.toFixed(qualitySummary.bestScore.score > 10 ? 0 : 1)} best available` : "Unavailable", detail: qualitySummary.bestScore ? `${qualitySummary.bestScore.provider} · ${qualitySummary.bestScore.source}` : qualitySummary.missingNotes[0] || "No matched score" },
                { label: "Referral math", value: `${number(selected.referrals[0])} referrals`, detail: `${number(selected.starts[0])} starts at modeled conversion` },
                { label: "Revenue math", value: currency(selected.revenue[0]), detail: `${selected.basis} · modeled output` },
              ].map((item) => (
                <div key={item.label} className={"rounded-xl px-3 py-3 text-xs " + (dark ? "bg-slate-900/70 text-slate-300" : "bg-white text-slate-700")}>
                  <p className={"font-semibold uppercase tracking-wide " + (dark ? "text-blue-300" : "text-blue-800")}>{item.label}</p>
                  <p className="mt-1 text-base font-bold">{item.value}</p>
                  <p className={"mt-1 leading-5 " + (dark ? "text-slate-400" : "text-slate-500")}>{item.detail}</p>
                </div>
              ))}
            </div>
            {qualitySummary.missingNotes.length > 0 && (
              <div className={"mt-3 rounded-xl border px-3 py-2 text-xs " + (dark ? "border-amber-800/50 bg-amber-950/20 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-800")}>
                <span className="font-semibold">Missing data notes: </span>{qualitySummary.missingNotes.join(" ")}
              </div>
            )}
            <p className={"mt-3 text-xs leading-5 " + (dark ? "text-blue-200/80" : "text-blue-900/75")}>
              CMS/HRSA records are sourced public data. Referral goals, starts, revenue, opportunity scores, and strategic notes are modeled planning outputs. Provider file share is not true county market share.
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`rounded-lg p-4 ${dark ? "bg-slate-700/30" : "bg-slate-50"}`}>
              <p className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-800"}`}>Why this county</p>
              <p className={`mt-2 leading-7 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.reason}</p>
            </div>
            <div className={`rounded-lg p-4 ${dark ? "bg-slate-700/30" : "bg-slate-50"}`}>
              <p className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-800"}`}>Current Andwell presence</p>
              <p className={`mt-2 leading-7 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.current}</p>
            </div>
          </div>

          <div className={`mt-4 rounded-lg p-4 ${dark ? "bg-slate-700/30" : "bg-slate-50"}`}>
            <p className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-800"}`}>Missing service lines</p>
            <p className={`mt-2 leading-7 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.missing}</p>
          </div>

          <div className="mt-4 grid gap-2">
            {selected.accounts.map((account) => (
              <div key={account} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                {account}
              </div>
            ))}
          </div>

          {AI_AVAILABLE && (
            <div className="mt-4">
              {!aiText && !aiGenerating && (
                <button
                  onClick={generateSummary}
                  className={`w-full rounded-xl border-2 border-dashed py-3 text-sm font-medium transition ${
                    dark
                      ? "border-slate-600 text-slate-400 hover:border-slate-500 hover:bg-slate-800/50"
                      : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                >
                  Generate AI Summary
                </button>
              )}
              {(aiText || aiGenerating) && (
                <AiBadge
                  label="County intelligence summary"
                  generating={aiGenerating}
                  onRegenerate={!aiGenerating ? generateSummary : undefined}
                >
                  {aiText ? (
                    <p className={`text-sm leading-7 ${dark ? "text-slate-200" : "text-slate-700"}`}>
                      {aiText}
                      {aiGenerating && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-blue-400" />
                      )}
                    </p>
                  ) : (
                    <p className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>Generating…</p>
                  )}
                </AiBadge>
              )}
              {aiError && (
                <p className={`mt-2 text-xs ${dark ? "text-red-400" : "text-red-600"}`}>{aiError}</p>
              )}
            </div>
          )}
        </Card>

        {intel && (
          <Card title="County intelligence" eyebrow="Smart analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-lg border p-4 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Competitive threat</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className={`text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{intel.threat?.score ?? "—"}/100</p>
                  {intel.threat && (
                    <Badge tone={intel.threat.level === "Fortress" ? "red" : intel.threat.level === "High" ? "amber" : intel.threat.level === "Moderate" ? "blue" : "green"}>
                      {intel.threat.level}
                    </Badge>
                  )}
                </div>
                {intel.threat?.hasNationalChain && (
                  <p className={`mt-1 text-xs font-semibold ${dark ? "text-red-400" : "text-red-600"}`}>National chain present</p>
                )}
              </div>
              <div className={`rounded-lg border p-4 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}>Market penetration</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>
                  {intel.penetration ? percent(intel.penetration.y1Penetration) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Y3 target: {intel.penetration ? percent(intel.penetration.y3Penetration) : "—"}
                </p>
              </div>
              <div className={`rounded-lg border p-4 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-500"}`}><Abbr term="HH">HH</Abbr> provider density</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{intel.providerDensityHH}</p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Providers per 10K <Abbr term="FFS">FFS</Abbr> beneficiaries</p>
              </div>
              <div className={`rounded-lg border p-4 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-600"}`}>Modeled Y1 revenue per <Abbr term="FFS">FFS</Abbr> beneficiary</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>
                  {intel.penetration ? currency(intel.penetration.revenuePerBeneficiary) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{currency(selected.revenue[0])} modeled Y1 revenue / {number(intel.ffs)} <Abbr term="FFS">FFS</Abbr> beneficiaries</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
