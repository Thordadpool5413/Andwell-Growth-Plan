import React, { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import Abbr from "../components/Abbr.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { currency, number } from "../utils/formatters.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const QUARTERS = ["Q1", "Q1", "Q1", "Q2", "Q2", "Q2", "Q3", "Q3", "Q3", "Q4", "Q4", "Q4"];

function monthOffsetToLabel(offset, startYear, startMonth) {
  const absMonth = startMonth + offset;
  const year = startYear + Math.floor(absMonth / 12);
  const monthIdx = absMonth % 12;
  return `${QUARTERS[monthIdx]} ${year}`;
}

const PRIORITY_TIMELINE = {
  "Priority 1": { startMonth: 1, endMonth: 12, color: COLORS.blue, phase: "Phase 1 — Immediate launch", status: "planning" },
  "Priority 2": { startMonth: 7, endMonth: 18, color: COLORS.purple, phase: "Phase 2 — Staged expansion", status: "preparing" },
  "Priority 3": { startMonth: 13, endMonth: 24, color: COLORS.amber, phase: "Phase 3 — Targeted growth", status: "active" },
};

const PHASE_STATUS_STYLES = {
  planning: { bg: dark => dark ? "bg-blue-950/50" : "bg-blue-50", dot: "bg-blue-500", label: "Planning" },
  preparing: { bg: dark => dark ? "bg-purple-950/50" : "bg-purple-50", dot: "bg-purple-500", label: "Preparing" },
  active: { bg: dark => dark ? "bg-amber-950/50" : "bg-amber-50", dot: "bg-amber-500", label: "Targeted" },
};

const MILESTONES = [
  { month: 1, label: "Staffing hired" },
  { month: 3, label: "First referrals" },
  { month: 6, label: "Mid-year review" },
  { month: 12, label: "Y1 close" },
  { month: 18, label: "Y2 mid-point" },
  { month: 24, label: "Y2 close" },
];

export default function LaunchTimeline({ rows }) {
  const { dark } = useDarkMode();
  const totalMonths = 24;
  const currentYear = new Date().getFullYear();
  const [startYear, setStartYear] = useState(currentYear);
  const [startMonthIdx, setStartMonthIdx] = useState(0);

  const countyTimeline = useMemo(() => {
    return rows.map((row) => {
      const timeline = PRIORITY_TIMELINE[row.launchGroup] || PRIORITY_TIMELINE["Priority 3"];
      const monthlyRevenue = row.revenue[0] / 12;
      const monthlyCost = row.starts[0] > 0 ? (row.revenue[0] * (1 - row.meta.margin)) / 12 : 0;
      const monthlyContribution = monthlyRevenue * row.meta.margin;
      const breakEvenMonths = monthlyContribution > 0 ? Math.ceil(monthlyCost * 3 / monthlyContribution) : 0;

      return {
        county: row.county,
        service: row.service,
        launchGroup: row.launchGroup,
        startMonth: timeline.startMonth,
        endMonth: timeline.endMonth,
        color: timeline.color,
        phase: timeline.phase,
        status: timeline.status,
        y1Revenue: row.revenue[0],
        breakEvenMonths: Math.min(breakEvenMonths, 36),
        starts: row.starts,
      };
    });
  }, [rows]);

  const phases = [...new Set(countyTimeline.map((c) => c.phase))];
  const avgBreakEven = countyTimeline.length > 0
    ? Math.round(countyTimeline.reduce((s, c) => s + c.breakEvenMonths, 0) / countyTimeline.length)
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Launch timeline" icon="🗓️" title="Priority-phased rollout with milestones">
        Visual timeline showing the Priority 1→2→3 rollout sequence. Each county bar shows its active launch window. Milestones mark key execution gates.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Launch counties" value={countyTimeline.length} detail="Counties in the active rollout plan." color="emerald" />
        <Metric label="Total timeline" value={`${totalMonths} months`} detail="Full rollout duration across all phases." color="blue" />
        <Metric label="Avg break-even" value={`${avgBreakEven} months`} detail="Mean estimated months to contribution break-even." color="amber" />
        <Metric label="Phase 1 counties" value={countyTimeline.filter((c) => c.launchGroup === "Priority 1").length} detail="Immediate launch targets." color="emerald" />
      </div>

      <Card title="Gantt timeline" eyebrow="24-month rollout view">
        <div className={`mb-4 flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2 text-xs ${dark ? "border-slate-700 bg-slate-800/60 text-slate-400" : "border-slate-100 bg-slate-50 text-slate-500"}`}>
          <span className="font-black">Timeline start:</span>
          <select
            value={startMonthIdx}
            onChange={(e) => setStartMonthIdx(Number(e.target.value))}
            className={`rounded-lg border px-2 py-1 text-xs ${dark ? "border-slate-600 bg-slate-700 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          <select
            value={startYear}
            onChange={(e) => setStartYear(Number(e.target.value))}
            className={`rounded-lg border px-2 py-1 text-xs ${dark ? "border-slate-600 bg-slate-700 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
          >
            {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className={`italic ${dark ? "text-slate-500" : "text-slate-400"}`}>Month labels show the calendar quarter each milestone falls in</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-shrink-0 w-40" />
            <div className="flex-1 relative h-6">
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((month) => (
                <div key={month} className="absolute top-0 flex flex-col items-center" style={{ left: `${(month / totalMonths) * 100}%` }}>
                  <div className={`h-4 border-l ${dark ? "border-slate-700" : "border-slate-200"}`} />
                  <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{monthOffsetToLabel(month, startYear, startMonthIdx)}</span>
                </div>
              ))}
            </div>
            <div className="flex-shrink-0 w-20" />
          </div>

          {MILESTONES.map((ms) => (
            <div key={ms.month + ms.label} className="flex items-center gap-2" style={{ height: 0, position: "relative", zIndex: 10 }}>
              <div className="w-40" />
              <div className="flex-1 relative">
                <div className="absolute" style={{ left: `${(ms.month / totalMonths) * 100}%`, top: "-8px" }}>
                  <div
                    className={`h-4 w-0.5 ${dark ? "bg-slate-600" : "bg-slate-300"}`}
                    style={{ position: "absolute", left: 0 }}
                    title={ms.label}
                  />
                  <span
                    className={`absolute text-[9px] font-semibold whitespace-nowrap ${dark ? "text-slate-500" : "text-slate-400"}`}
                    style={{ left: 4, top: 0 }}
                  >{ms.label}</span>
                </div>
              </div>
              <div className="flex-shrink-0 w-20" />
            </div>
          ))}

          <div className="mt-6 space-y-4">
            {phases.map((phase) => {
              const phaseCounties = countyTimeline.filter((c) => c.phase === phase);
              const firstCounty = phaseCounties[0];
              const phaseStatus = PHASE_STATUS_STYLES[firstCounty?.status] || PHASE_STATUS_STYLES.planning;
              return (
                <div key={phase}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${phaseStatus.dot}`} />
                    <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-slate-300" : "text-slate-700"}`}>
                      {phase}
                    </p>
                    <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>({phaseCounties.length} counties)</span>
                  </div>
                  <div className="space-y-1.5">
                    {phaseCounties.map((county) => {
                      const leftPct = (county.startMonth / totalMonths) * 100;
                      const widthPct = ((county.endMonth - county.startMonth) / totalMonths) * 100;
                      return (
                        <div key={`${county.county}-${county.service}`} className="flex items-center gap-2">
                          <div className={`flex-shrink-0 w-40 text-sm font-semibold truncate ${dark ? "text-slate-300" : "text-slate-700"}`}>
                            {county.county}
                          </div>
                          <div className={`flex-1 relative h-8 rounded-lg ${dark ? "bg-slate-800/80" : "bg-slate-100"}`}>
                            <div
                              className="absolute inset-y-1 rounded-md flex items-center px-2 text-[10px] font-black text-white shadow-sm"
                              style={{ left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: county.color }}
                            >
                              <span className="truncate">{county.service}</span>
                            </div>
                            {county.breakEvenMonths > 0 && county.breakEvenMonths <= totalMonths && (
                              <div
                                className="absolute top-0 h-full w-0.5 bg-emerald-400 z-10"
                                style={{ left: `${((county.startMonth + county.breakEvenMonths) / totalMonths) * 100}%` }}
                                title={`Break-even: Month ${county.startMonth + county.breakEvenMonths}`}
                              />
                            )}
                          </div>
                          <div className={`flex-shrink-0 w-24 text-right text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
                            {currency(county.y1Revenue)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-4 text-xs border-t pt-4 ${dark ? 'border-slate-700' : 'border-slate-100'}">
          {Object.entries(PRIORITY_TIMELINE).map(([label, config]) => (
            <div key={label} className={`flex items-center gap-1.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
              <span className="h-3 w-6 rounded" style={{ backgroundColor: config.color }} />
              {label}
            </div>
          ))}
          <div className={`flex items-center gap-1.5 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            <span className="h-3 w-0.5 bg-emerald-400" />
            Break-even point
          </div>
        </div>
      </Card>

      <Card title="Launch phase summary" eyebrow="Phase execution detail">
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(PRIORITY_TIMELINE).map(([label, config]) => {
            const phaseCounties = countyTimeline.filter((c) => c.launchGroup === label);
            const phaseRevenue = phaseCounties.reduce((s, c) => s + c.y1Revenue, 0);
            const phaseStarts = phaseCounties.reduce((s, c) => s + c.starts[0], 0);
            const statusStyle = PHASE_STATUS_STYLES[config.status] || PHASE_STATUS_STYLES.planning;
            return (
              <div key={label} className={`rounded-2xl border p-5 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: config.color }} />
                  <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{label}</p>
                </div>
                <div className={`mb-3 flex items-center gap-1.5 text-xs`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                  <span className={dark ? "text-slate-400" : "text-slate-500"}>{statusStyle.label}</span>
                  <span className={`ml-1 ${dark ? "text-slate-500" : "text-slate-400"}`}>M{config.startMonth}–M{config.endMonth}</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Counties</span>
                    <span className="font-black">{phaseCounties.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 starts</span>
                    <span className="font-black">{number(phaseStarts)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 revenue</span>
                    <span className={`font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(phaseRevenue)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
