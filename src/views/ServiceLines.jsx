import React from "react";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import Badge from "../components/Badge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import services from "../data/services.js";
import { currency, percent } from "../utils/formatters.js";

function MarginBar({ margin, dark }) {
  const pct = Math.round((margin || 0) * 100);
  const color = pct >= 22 ? "bg-emerald-500" : pct >= 18 ? "bg-blue-500" : pct > 0 ? "bg-amber-500" : "bg-slate-300";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-[10px] font-medium uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>Margin</span>
        <span className={`text-xs font-medium ${pct > 0 ? (dark ? "text-emerald-400" : "text-emerald-700") : (dark ? "text-slate-500" : "text-slate-400")}`}>
          {pct > 0 ? `${pct}%` : "Validate"}
        </span>
      </div>
      <div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? "bg-slate-700" : "bg-slate-100"}`}>
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(pct * 3, 100)}%` }} />
      </div>
    </div>
  );
}

function ReimbursementBadge({ value, dark }) {
  if (!value) return (
    <div className={`rounded-lg border-2 border-dashed px-3 py-2 text-center ${dark ? "border-slate-600 text-slate-500" : "border-slate-200 text-slate-400"}`}>
      <p className="text-xs font-medium">Validate</p>
      <p className="text-[10px]">Rate TBD</p>
    </div>
  );
  return (
    <div className={`rounded-lg border px-3 py-2 text-center ${dark ? "border-blue-800/40 bg-blue-950/20" : "border-blue-100 bg-blue-50"}`}>
      <p className={`text-lg font-bold tabular-nums ${dark ? "text-blue-300" : "text-blue-700"}`}>{currency(value)}</p>
      <p className={`text-[10px] font-medium ${dark ? "text-blue-500" : "text-blue-500"}`}>per episode</p>
    </div>
  );
}

const STATUS_CONFIG = {
  "Home Healthcare": { tone: "green", label: "Active" },
  "Mobile Wound":   { tone: "blue",  label: "Active" },
  "Therapy Care":   { tone: "green", label: "Active" },
  "GUIDE":          { tone: "amber", label: "Validating" },
  "Hospice":        { tone: "slate", label: "Future" },
};

export default function ServiceLines() {
  const { dark } = useDarkMode();
  const activeLines = Object.entries(services).filter(([, m]) => m.reimbursement > 0);
  const totalModeled = activeLines.reduce((s, [, m]) => s + m.reimbursement, 0);
  const avgMargin = activeLines.length > 0
    ? activeLines.reduce((s, [, m]) => s + m.margin, 0) / activeLines.length
    : 0;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Service lines" title="Andwell service line definitions and reimbursement assumptions">
        Each service line card shows the clinical role, modeled Medicare reimbursement rate, target contribution margin, and billing unit. Reimbursement figures are internal planning assumptions based on <Abbr term="CMS">CMS</Abbr> rate schedules — actual rates vary by patient acuity, geography, and payer mix.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-xl border-l-4 border-l-emerald-500 border p-4 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Active service lines</p>
          <p className={`mt-1.5 text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{activeLines.length}</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>of {Object.keys(services).length} total — {Object.keys(services).length - activeLines.length} pending validation</p>
        </div>
        <div className={`rounded-xl border-l-4 border-l-blue-500 border p-4 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Avg reimbursement</p>
          <p className={`mt-1.5 text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{activeLines.length > 0 ? currency(Math.round(totalModeled / activeLines.length)) : "—"}</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Per episode across active lines</p>
        </div>
        <div className={`rounded-xl border-l-4 border-l-slate-400 border p-4 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Avg contribution margin</p>
          <p className={`mt-1.5 text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-900"}`}>{percent(avgMargin)}</p>
          <p className={`mt-1 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Blended across active service lines</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(services).map(([service, meta]) => {
          const status = STATUS_CONFIG[service] || { tone: "slate", label: "Unknown" };
          const isActive = meta.reimbursement > 0;
          return (
            <div
              key={service}
              className={`rounded-xl border p-5 transition-colors duration-150 hover:shadow-md ${
                isActive
                  ? dark ? "border-slate-700/60 bg-slate-800/60 shadow-sm" : "border-slate-200 bg-white shadow-sm"
                  : dark ? "border-slate-700/40 bg-slate-800/30" : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`font-semibold text-sm leading-tight ${dark ? "text-slate-100" : "text-slate-800"}`}>{service}</p>
                  <p className={`text-[11px] mt-0.5 ${dark ? "text-slate-400" : "text-slate-500"}`}>{meta.role}</p>
                </div>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>

              <div className="mb-4">
                <ReimbursementBadge value={meta.reimbursement} dark={dark} />
              </div>

              <MarginBar margin={meta.margin} dark={dark} />

              <div className={`mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs ${dark ? "border-slate-700/60" : "border-slate-100"}`}>
                <div>
                  <p className={`font-medium uppercase tracking-wide text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Unit</p>
                  <p className={`mt-0.5 font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>{meta.unit}</p>
                </div>
                <div>
                  <p className={`font-medium uppercase tracking-wide text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>Conversion</p>
                  <p className={`mt-0.5 font-medium ${dark ? "text-slate-300" : "text-slate-600"}`}>{percent(meta.conversion)} baseline</p>
                </div>
              </div>

              {!isActive && (
                <div className={`mt-3 rounded-lg px-3 py-2 text-center text-[10px] font-medium uppercase tracking-wide ${dark ? "bg-amber-950/20 text-amber-400 border border-amber-800/30" : "bg-amber-50 text-amber-700 border border-amber-100"}`}>
                  Awaiting rate validation
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={`rounded-lg border px-5 py-4 text-xs ${dark ? "border-slate-700/60 bg-slate-800/40 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
        <span className="font-semibold">Note on reimbursement: </span>
        Rates shown are internal planning assumptions based on CMS national schedules. Actual rates vary by patient acuity, geography, episode type, and payer mix. "Validate" lines require independent rate confirmation before budget use.
      </div>
    </div>
  );
}
