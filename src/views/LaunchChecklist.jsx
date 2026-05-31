import React, { useState, useEffect } from "react";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import Abbr from "../components/Abbr.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import launchPlan from "../data/launchPlan.js";

const STATUS_CYCLE = ["Not Started", "In Progress", "Done"];
const nextStatus = (s) => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
const statusTone = (s) => (s === "Done" ? "green" : s === "In Progress" ? "blue" : "slate");

const STATUS_INDICATOR = {
  "Done": { dot: "bg-emerald-500", ring: "ring-emerald-500/30", text: "text-emerald-600 dark:text-emerald-400", label: "Done" },
  "In Progress": { dot: "bg-blue-500", ring: "ring-blue-500/30", text: "text-blue-600 dark:text-blue-400", label: "In progress" },
  "Not Started": { dot: "bg-slate-300 dark:bg-slate-600", ring: "ring-slate-200 dark:ring-slate-700", text: "text-slate-400 dark:text-slate-500", label: "Not started" },
};

const PHASE_LABELS = {
  "Priority 1": "Phase 1 — Immediate launch (months 1–12)",
  "Priority 2": "Phase 2 — Staged expansion (months 7–18)",
  "Priority 3": "Phase 3 — Targeted growth (months 13–24)",
};

const PHASE_COLORS = {
  "Phase 1 — Immediate launch (months 1–12)": { dot: "bg-blue-500", accent: "emerald" },
  "Phase 2 — Staged expansion (months 7–18)": { dot: "bg-purple-500", accent: "blue" },
  "Phase 3 — Targeted growth (months 13–24)": { dot: "bg-amber-500", accent: "amber" },
};

const itemKey = (item) => `${item.county}::${item.service}`;
const STORAGE_KEY = "andwell-checklist-overrides-v2";

function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export default function LaunchChecklist() {
  const { dark } = useDarkMode();
  const [overrides, setOverrides] = useState(loadOverrides);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  }, [overrides]);

  const resolvedItems = launchPlan.map((item) => ({
    ...item,
    key: itemKey(item),
    phase: PHASE_LABELS[item.launchGroup] || item.launchGroup,
    status: overrides[itemKey(item)] ?? "Not Started",
  }));

  const phaseOrder = ["Priority 1", "Priority 2", "Priority 3"];
  const phases = phaseOrder
    .map((p) => PHASE_LABELS[p])
    .filter((phase) => resolvedItems.some((item) => item.phase === phase));

  const done = resolvedItems.filter((i) => i.status === "Done").length;
  const inProgress = resolvedItems.filter((i) => i.status === "In Progress").length;
  const total = resolvedItems.length;

  const toggleStatus = (key) => {
    setOverrides((prev) => {
      const currentStatus = prev[key] ?? "Not Started";
      return { ...prev, [key]: nextStatus(currentStatus) };
    });
  };

  const resetAll = () => setOverrides({});
  const hasOverrides = Object.keys(overrides).length > 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Launch checklist" icon="✅" title="Phased launch task tracking">
        Track progress across launch phases. Click any status indicator to cycle it through Not Started → In Progress → Done. Progress is saved locally in your browser. Use Reset to restore all items to Not Started.
      </SectionHeader>

      <div className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Overall progress</p>
            <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{done}/{total} complete</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className={dark ? "text-slate-400" : "text-slate-500"}>{done} done</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className={dark ? "text-slate-400" : "text-slate-500"}>{inProgress} in progress</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${dark ? "bg-slate-600" : "bg-slate-300"}`} />
                <span className={dark ? "text-slate-400" : "text-slate-500"}>{total - done - inProgress} not started</span>
              </span>
            </div>
            {hasOverrides && (
              <button
                onClick={resetAll}
                className={`rounded-full px-4 py-2 text-xs font-black ring-1 transition ${
                  dark ? "bg-slate-700 text-slate-300 ring-slate-600 hover:bg-slate-600" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                Reset to defaults
              </button>
            )}
            <div className={`text-sm font-black ${done === total ? "text-emerald-600" : dark ? "text-blue-400" : "text-blue-700"}`}>
              {total > 0 ? Math.round((done / total) * 100) : 0}%
            </div>
          </div>
        </div>
        <div className={`h-3 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
          <div className="h-full flex">
            <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
            <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>

      {phases.map((phase) => {
        const phaseItems = resolvedItems.filter((item) => item.phase === phase);
        const phaseDone = phaseItems.filter((i) => i.status === "Done").length;
        const phaseInProgress = phaseItems.filter((i) => i.status === "In Progress").length;
        const phaseComplete = phaseDone === phaseItems.length;
        const phaseColors = PHASE_COLORS[phase] || { dot: "bg-slate-500", accent: "slate" };
        return (
          <div key={phase}>
            <div className={`mb-3 flex items-center gap-3 rounded-2xl border px-4 py-3 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-slate-50"}`}>
              <span className={`h-3 w-3 rounded-full flex-shrink-0 ${phaseColors.dot}`} />
              <div className="flex-1">
                <p className={`font-black text-sm ${dark ? "text-white" : "text-slate-950"}`}>{phase}</p>
              </div>
              <div className={`flex items-center gap-3 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                <span>{phaseDone}/{phaseItems.length} done</span>
                {phaseInProgress > 0 && <span className="text-blue-500">{phaseInProgress} in progress</span>}
                {phaseComplete && <span className="font-black text-emerald-600">✓ Phase complete</span>}
              </div>
            </div>
            <div className="space-y-2">
              {phaseItems.map((item) => {
                const indicator = STATUS_INDICATOR[item.status];
                const isDone = item.status === "Done";
                const isOverridden = overrides[item.key] !== undefined;
                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl border p-4 transition ${
                      isDone
                        ? dark ? "border-emerald-900/50 bg-emerald-950/20" : "border-emerald-100 bg-emerald-50"
                        : item.status === "In Progress"
                        ? dark ? "border-blue-900/50 bg-blue-950/20" : "border-blue-100 bg-blue-50"
                        : dark ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleStatus(item.key)}
                        title="Click to advance status"
                        className={`mt-0.5 flex-shrink-0 h-5 w-5 rounded-full ring-2 flex items-center justify-center transition-all active:scale-95 ${indicator.ring} ${isDone ? "bg-emerald-500" : item.status === "In Progress" ? "bg-blue-500" : dark ? "bg-slate-700 ring-slate-600" : "bg-white ring-slate-200"}`}
                        aria-label={`Toggle status for ${item.county} ${item.service}, currently ${item.status}`}
                      >
                        {isDone && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {item.status === "In Progress" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className={`font-black ${isDone ? (dark ? "text-slate-400 line-through" : "text-slate-400 line-through") : (dark ? "text-white" : "text-slate-950")}`}>{item.county} County</p>
                          <ServiceBadge service={item.service} />
                          {isOverridden && (
                            <span className={`text-[10px] font-semibold ${dark ? "text-blue-500" : "text-blue-600"}`}>● Updated</span>
                          )}
                        </div>
                        <p className={`text-sm leading-6 ${isDone ? (dark ? "text-slate-500" : "text-slate-400") : (dark ? "text-slate-300" : "text-slate-600")}`}>{item.action}</p>
                      </div>
                      <div className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-lg ${indicator.ring} ring-1 ${dark ? "text-slate-300" : "text-slate-600"}`}>
                        {item.status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
