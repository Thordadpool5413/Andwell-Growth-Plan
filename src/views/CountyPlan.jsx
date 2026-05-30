import React, { useState, useRef, useCallback, useEffect } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import Abbr from "../components/Abbr.jsx";
import AiBadge from "../components/AiBadge.jsx";
import MaineMap from "../components/MaineMap.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getCountyIntelligence } from "../utils/calculations.js";
import { streamChat, buildCountyPrompt, AI_AVAILABLE } from "../utils/ai.js";
import { currency, number, percent } from "../utils/formatters.js";

export default function CountyPlan({ rows, selectedCounty, setSelectedCounty, competitorProviderType, setCompetitorProviderType }) {
  const { dark } = useDarkMode();
  const selected = rows.find((row) => row.county === selectedCounty) || rows[0];
  const intel = getCountyIntelligence(selected.county, rows);

  const [aiText, setAiText] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const abortRef = useRef(null);

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
        <Card title="Maine county map" eyebrow="Geographic view">
          <MaineMap rows={rows} selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} providerTypeFilter={competitorProviderType} onProviderTypeFilterChange={setCompetitorProviderType} />
        </Card>
        <Card title="County launch queue" eyebrow="Prioritization">
          <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${dark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
            <span className="font-black">Priority groups: </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Priority 1</span> = immediate launch (months 1–12) ·{" "}
            <span className="font-semibold text-blue-600 dark:text-blue-400">Priority 2</span> = staged expansion (months 7–18) ·{" "}
            <span className="font-semibold text-amber-600 dark:text-amber-400">Priority 3</span> = targeted growth (months 13–24)
          </div>
          <div className="space-y-3">
            {rows.map((row) => {
              const rowIntel = getCountyIntelligence(row.county, rows);
              return (
                <button
                  key={row.county}
                  onClick={() => setSelectedCounty(row.county)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedCounty === row.county
                      ? dark ? "border-blue-500 bg-blue-950/50" : "border-blue-500 bg-blue-50"
                      : dark ? "border-slate-700 bg-slate-800 hover:border-blue-600" : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{row.county}</p>
                      <ServiceBadge service={row.service} />
                    </div>
                    <div className="flex items-center gap-2">
                      {rowIntel?.threat && (
                        <Badge tone={rowIntel.threat.score >= 50 ? "red" : rowIntel.threat.score >= 30 ? "amber" : "green"}>
                          Threat {rowIntel.threat.score}
                        </Badge>
                      )}
                      <Badge tone={row.launchGroup.includes("1") ? "green" : row.launchGroup.includes("2") ? "blue" : "amber"}>
                        {row.launchGroup}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title={`${selected.county} County`} eyebrow="County detail">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              label="Year 1 goal"
              value={number(selected.starts[0])}
              detail={selected.meta.unit}
              sparkData={selected.starts}
              sparkColor="#2563eb"
            />
            <Metric
              label="Year 1 referrals"
              value={number(selected.referrals[0])}
              detail="At 75 percent modeled conversion."
              sparkData={selected.referrals}
              sparkColor="#f59e0b"
            />
            <Metric
              label="Year 1 revenue"
              value={currency(selected.revenue[0])}
              detail={<span className="flex items-center gap-1.5 flex-wrap"><SourceBadge basis={selected.basis} /><span>{selected.basis}</span></span>}
              sparkData={selected.revenue}
              sparkColor="#16a34a"
            />
          </div>
          <div className="mt-5 space-y-4">
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Why this county</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.reason}</p>
            </div>
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Current Andwell presence</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.current}</p>
            </div>
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Missing service lines</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.missing}</p>
            </div>
            <div className="grid gap-2">
              {selected.accounts.map((account) => (
                <div key={account} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                  {account}
                </div>
              ))}
            </div>

            {AI_AVAILABLE && (
              <div>
                {!aiText && !aiGenerating && (
                  <button
                    onClick={generateSummary}
                    className={`w-full rounded-2xl border-2 border-dashed py-3 text-sm font-black transition ${
                      dark
                        ? "border-violet-700 text-violet-400 hover:border-violet-500 hover:bg-violet-950/30"
                        : "border-violet-200 text-violet-600 hover:border-violet-400 hover:bg-violet-50"
                    }`}
                  >
                    ✦ Generate AI Summary
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
                          <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400" />
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
          </div>
        </Card>

        {intel && (
          <Card title="County intelligence" eyebrow="Smart analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Competitive threat</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{intel.threat?.score ?? "—"}/100</p>
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
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Market penetration</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
                  {intel.penetration ? percent(intel.penetration.y1Penetration) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Y3 target: {intel.penetration ? percent(intel.penetration.y3Penetration) : "—"}
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}><Abbr term="HH">HH</Abbr> provider density</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{intel.providerDensityHH}</p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Providers per 10K <Abbr term="FFS">FFS</Abbr> beneficiaries</p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Revenue per beneficiary</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
                  {intel.penetration ? currency(intel.penetration.revenuePerBeneficiary) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Y1 revenue / {number(intel.ffs)} <Abbr term="FFS">FFS</Abbr></p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
