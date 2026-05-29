import React, { useState, useEffect } from "react";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import launchPlan from "../data/launchPlan.js";

const STATUS_CYCLE = ["Not Started", "In Progress", "Done"];
const nextStatus = (s) => STATUS_CYCLE[(STATUS_CYCLE.indexOf(s) + 1) % STATUS_CYCLE.length];
const statusTone = (s) => (s === "Done" ? "green" : s === "In Progress" ? "blue" : "slate");

const PHASE_LABELS = {
  "Priority 1": "Phase 1 — Immediate launch (months 1–12)",
  "Priority 2": "Phase 2 — Staged expansion (months 7–18)",
  "Priority 3": "Phase 3 — Targeted growth (months 13–24)",
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
      <SectionHeader eyebrow="Launch checklist" title="Phased launch task tracking">
        Track progress across launch phases. Click any status badge to cycle it through Not Started → In Progress → Done. Progress is saved locally in your browser. Use Reset to restore all items to Not Started.
      </SectionHeader>

      <div className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Overall progress</p>
            <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{done}/{total} complete</p>
          </div>
          <div className="flex items-center gap-3">
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
        <div className={`mt-3 h-2 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
          <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {phases.map((phase) => {
        const phaseItems = resolvedItems.filter((item) => item.phase === phase);
        const phaseDone = phaseItems.filter((i) => i.status === "Done").length;
        const phaseComplete = phaseDone === phaseItems.length;
        return (
          <Card
            key={phase}
            title={phase}
            eyebrow={`Launch phase — ${phaseDone}/${phaseItems.length} done`}
          >
            {phaseComplete && (
              <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black ${dark ? "bg-emerald-950/50 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                ✓ Phase complete
              </div>
            )}
            <div className="space-y-3">
              {phaseItems.map((item) => {
                const isOverridden = overrides[item.key] !== undefined;
                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl border p-4 transition ${
                      item.status === "Done"
                        ? dark ? "border-emerald-900/50 bg-emerald-950/30" : "border-emerald-100 bg-emerald-50"
                        : dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{item.county} County</p>
                          <ServiceBadge service={item.service} />
                        </div>
                        <p className={`text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-600"}`}>{item.action}</p>
                        {isOverridden && (
                          <p className={`mt-1 text-[10px] font-semibold ${dark ? "text-blue-500" : "text-blue-600"}`}>
                            ● Manually updated
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleStatus(item.key)}
                        title="Click to advance status"
                        className="shrink-0 cursor-pointer transition-transform active:scale-95"
                        aria-label={`Toggle status for ${item.county} ${item.service}, currently ${item.status}`}
                      >
                        <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
