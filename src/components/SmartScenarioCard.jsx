import React, { useMemo } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { currency, number, percent } from "../utils/formatters.js";
import { areScenariosEqual, getSmartScenarioRecommendation } from "../utils/calculations.js";

function formatCurrencyDelta(value) {
  if (Math.abs(value) < 1) return "No material change";
  return `${value > 0 ? "+" : "-"}${currency(Math.abs(value))}`;
}

function MetricTile({ label, value, detail, dark }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${dark ? "border-slate-700/70 bg-slate-900/50" : "border-slate-200 bg-white/80"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
      <p className={`mt-1 text-[11px] ${dark ? "text-slate-400" : "text-slate-500"}`}>{detail}</p>
    </div>
  );
}

export default function SmartScenarioCard({ scenario, onApplyScenario, onNavigate, compact = false }) {
  const { dark } = useDarkMode();
  const recommendation = useMemo(() => getSmartScenarioRecommendation(scenario), [scenario]);
  const isApplied = areScenariosEqual(scenario, recommendation.recommendedScenario);
  const topCounty = recommendation.recommended.topCounty?.county;

  return (
    <div className={`rounded-2xl border p-4 transition-colors duration-200 ${dark ? "border-emerald-900/70 bg-emerald-950/15" : "border-emerald-200 bg-emerald-50/80"}`}>
      <div className={`flex ${compact ? "flex-col gap-2" : "items-start justify-between gap-4"}`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-emerald-300" : "text-emerald-700"}`}>
            Smart planner
          </p>
          <h3 className={`mt-1 text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
            Recommended scenario
          </h3>
          <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
            Optimized across revenue, contribution, opportunity score, staffing load, and county concentration.
          </p>
        </div>
        <div className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${dark ? "bg-emerald-900/70 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
          {recommendation.strategyLabel}
        </div>
      </div>

      <div className={`mt-4 grid gap-2 ${compact ? "grid-cols-2" : "md:grid-cols-4"}`}>
        <MetricTile
          label="Year 1 revenue"
          value={currency(recommendation.recommended.totals.y1Revenue)}
          detail={formatCurrencyDelta(recommendation.deltas.y1Revenue)}
          dark={dark}
        />
        <MetricTile
          label="3-year contribution"
          value={currency(recommendation.recommended.totals.totalContribution)}
          detail={formatCurrencyDelta(recommendation.deltas.totalContribution)}
          dark={dark}
        />
        <MetricTile
          label="Opportunity score"
          value={`${number(Math.round(recommendation.recommended.weightedOpportunityScore))}/100`}
          detail={`Top county: ${topCounty || "—"}`}
          dark={dark}
        />
        <MetricTile
          label="Year 1 staffing"
          value={`${number(recommendation.recommended.y1Fte)} FTE`}
          detail={`${recommendation.deltas.y1Fte > 0 ? "+" : ""}${number(recommendation.deltas.y1Fte)} vs current`}
          dark={dark}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[
          { label: "Conversion", value: percent(recommendation.recommendedScenario.conversionRate) },
          { label: "HH Y1", value: percent(recommendation.recommendedScenario.hhCapture[0]) },
          { label: "Wound Y1", value: percent(recommendation.recommendedScenario.woundCapture[0]) },
          { label: "Therapy Y1", value: percent(recommendation.recommendedScenario.therapyCapture[0]) },
        ].map((item) => (
          <span
            key={item.label}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${dark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600"}`}
          >
            {item.label}: <span className={dark ? "text-white" : "text-slate-900"}>{item.value}</span>
          </span>
        ))}
      </div>

      <ul className="mt-4 space-y-2">
        {recommendation.rationale.map((item) => (
          <li key={item} className={`flex gap-2 text-xs leading-5 ${dark ? "text-slate-300" : "text-slate-600"}`}>
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${dark ? "bg-emerald-400" : "bg-emerald-600"}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <div className={`mt-4 flex ${compact ? "flex-col" : "flex-wrap"} gap-2`}>
        <button
          onClick={() => onApplyScenario?.(recommendation.recommendedScenario)}
          disabled={isApplied}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            isApplied
              ? dark
                ? "cursor-default bg-slate-800 text-slate-500"
                : "cursor-default bg-slate-100 text-slate-400"
              : "bg-emerald-700 text-white hover:bg-emerald-600"
          }`}
        >
          {isApplied ? "Smart plan applied" : "Apply smart plan"}
        </button>
        {topCounty && (
          <button
            onClick={() => onNavigate?.({ tab: "County Plan", county: topCounty })}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${dark ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-white text-slate-700 hover:bg-slate-100"}`}
          >
            Review {topCounty}
          </button>
        )}
        <div className={`flex items-center rounded-lg px-2.5 py-2 text-[11px] ${dark ? "bg-slate-900/60 text-slate-400" : "bg-white/70 text-slate-500"}`}>
          Concentration risk: {percent(recommendation.recommended.concentrationRisk)}
        </div>
      </div>
    </div>
  );
}
