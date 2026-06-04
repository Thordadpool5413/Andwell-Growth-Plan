import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { DEFAULT_SCENARIO } from "../data/constants.js";
import { buildRows } from "../utils/calculations.js";
import { currency, number } from "../utils/formatters.js";
import { useDarkMode } from "./DarkModeContext.jsx";
import { useScenarioStore } from "../store/scenarioStore.js";
import { X, Plus } from "lucide-react";

const PRESETS = {
  "Default Baseline": DEFAULT_SCENARIO,
  "Conservative": {
    conversionRate: 0.65,
    hhCapture: [0.07, 0.10, 0.14],
    woundCapture: [0.15, 0.22, 0.30],
    therapyCapture: [0.12, 0.18, 0.25],
    marginOverrides: {},
  },
  "Aggressive Growth": {
    conversionRate: 0.85,
    hhCapture: [0.15, 0.25, 0.35],
    woundCapture: [0.35, 0.50, 0.65],
    therapyCapture: [0.30, 0.45, 0.55],
    marginOverrides: {},
  },
  "Board Presentation": {
    conversionRate: 0.75,
    hhCapture: [0.12, 0.18, 0.25],
    woundCapture: [0.28, 0.40, 0.50],
    therapyCapture: [0.22, 0.32, 0.42],
    marginOverrides: {},
  },
};

const COLUMN_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

const METRICS = [
  { label: "Year 1 Revenue", key: "y1Revenue", fmt: currency, chartLabel: "Y1 Rev" },
  { label: "Year 3 Revenue", key: "y3Revenue", fmt: currency, chartLabel: "Y3 Rev" },
  { label: "3-Year Contribution", key: "totalContribution", fmt: currency, chartLabel: "3Y Contrib" },
  { label: "Year 1 Referrals", key: "y1Referrals", fmt: number, chartLabel: "Y1 Referrals" },
  { label: "Year 1 Starts", key: "y1Starts", fmt: number, chartLabel: "Y1 Starts" },
  { label: "Year 3 Starts", key: "y3Starts", fmt: number, chartLabel: "Y3 Starts" },
];

function summarize(scenarioData) {
  const rows = buildRows(scenarioData);
  return {
    y1Revenue: rows.reduce((s, r) => s + r.revenue[0], 0),
    y3Revenue: rows.reduce((s, r) => s + r.revenue[2], 0),
    y1Referrals: rows.reduce((s, r) => s + r.referrals[0], 0),
    y1Starts: rows.reduce((s, r) => s + r.starts[0], 0),
    y3Starts: rows.reduce((s, r) => s + r.starts[2], 0),
    totalContribution: rows.reduce((s, r) => s + r.totalContribution, 0),
  };
}

function DeltaBadge({ base, value, fmt }) {
  const diff = value - base;
  if (Math.abs(diff) < 1) return <span className="text-slate-400 text-[10px]">—</span>;
  const up = diff > 0;
  return (
    <span className={`text-[10px] font-bold tabular-nums ${up ? "text-emerald-500" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {fmt(Math.abs(diff))}
    </span>
  );
}

function CustomTooltip({ active, payload, label, dark }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-4 py-3 shadow-xl text-xs ${dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-800"}`}>
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.fill }} />
          <span className={dark ? "text-slate-300" : "text-slate-600"}>{p.name}:</span>
          <span className="font-bold tabular-nums">{currency(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function ScenarioCompare({ currentScenario }) {
  const { dark } = useDarkMode();
  const { scenarios: savedScenarios } = useScenarioStore();
  const [chartMetric, setChartMetric] = useState("y1Revenue");

  // Each slot: { id, label, data } | null
  const [slots, setSlots] = useState([
    { id: "current", label: "Current", data: currentScenario },
    { id: "preset:Conservative", label: "Conservative", data: PRESETS["Conservative"] },
  ]);

  const addSlot = () => {
    if (slots.length >= 4) return;
    setSlots((prev) => [...prev, null]);
  };

  const removeSlot = (idx) => {
    setSlots((prev) => prev.filter((_, i) => i !== idx));
  };

  const pickSlot = (idx, value) => {
    let entry;
    if (value === "current") {
      entry = { id: "current", label: "Current", data: currentScenario };
    } else if (value.startsWith("preset:")) {
      const name = value.slice(7);
      entry = { id: value, label: name, data: PRESETS[name] };
    } else {
      const saved = savedScenarios.find((s) => s.id === value);
      if (saved) entry = { id: saved.id, label: saved.name, data: saved.data };
    }
    if (entry) {
      setSlots((prev) => prev.map((s, i) => (i === idx ? entry : s)));
    }
  };

  const filledSlots = slots.filter(Boolean);
  const summaries = filledSlots.map((slot) => summarize(slot.data));
  const baseIdx = 0;

  // Chart data
  const selectedMetric = METRICS.find((m) => m.key === chartMetric);
  const revenueChartData = ["Year 1", "Year 2", "Year 3"].map((yr, yi) => {
    const entry = { year: yr };
    filledSlots.forEach((slot, si) => {
      const rows = buildRows(slot.data);
      entry[slot.label] = rows.reduce((s, r) => s + r.revenue[yi], 0);
    });
    return entry;
  });

  const barChartData = [
    {
      metric: selectedMetric?.chartLabel,
      ...Object.fromEntries(filledSlots.map((slot, si) => [slot.label, summaries[si][chartMetric]])),
    },
  ];

  const usedIds = new Set(slots.map((s) => s?.id).filter(Boolean));

  function SelectDropdown({ idx, current }) {
    return (
      <select
        value={current?.id ?? ""}
        onChange={(e) => pickSlot(idx, e.target.value)}
        className={`w-full rounded-lg border px-2 py-1.5 text-xs font-medium truncate ${
          dark ? "bg-slate-700 border-slate-600 text-white" : "bg-white border-slate-200 text-slate-700"
        }`}
      >
        <option value="" disabled>Pick scenario…</option>
        <optgroup label="Live">
          <option value="current">Current (active)</option>
        </optgroup>
        <optgroup label="Presets">
          {Object.keys(PRESETS).map((name) => {
            const id = `preset:${name}`;
            if (id !== current?.id && usedIds.has(id)) return null;
            return <option key={id} value={id}>{name}</option>;
          })}
        </optgroup>
        {savedScenarios.length > 0 && (
          <optgroup label="Saved">
            {savedScenarios.map((s) => {
              if (s.id !== current?.id && usedIds.has(s.id)) return null;
              return <option key={s.id} value={s.id}>{s.name}</option>;
            })}
          </optgroup>
        )}
      </select>
    );
  }

  return (
    <div className={`rounded-xl border shadow-sm overflow-hidden ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>

      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? "border-slate-700 bg-slate-800" : "border-slate-100 bg-slate-50"}`}>
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Scenario Comparison</p>
          <p className={`mt-0.5 text-sm font-medium ${dark ? "text-white" : "text-slate-800"}`}>
            Compare up to 4 scenarios side-by-side
          </p>
        </div>
        {slots.length < 4 && (
          <button
            onClick={addSlot}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              dark ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            Add scenario
          </button>
        )}
      </div>

      {/* Slot selectors */}
      <div className={`grid gap-0 border-b ${dark ? "border-slate-700" : "border-slate-100"}`}
        style={{ gridTemplateColumns: `180px repeat(${slots.length}, 1fr)` }}>
        <div className={`px-4 py-3 text-[10px] font-semibold uppercase tracking-wider ${dark ? "text-slate-500" : "text-slate-400"}`}>Metric</div>
        {slots.map((slot, idx) => (
          <div key={idx} className={`flex items-center gap-1.5 px-3 py-2 border-l ${dark ? "border-slate-700 bg-slate-800/40" : "border-slate-100 bg-slate-50"}`}>
            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: COLUMN_COLORS[idx] }} />
            <SelectDropdown idx={idx} current={slot} />
            {slots.length > 1 && (
              <button
                onClick={() => removeSlot(idx)}
                className={`shrink-0 rounded p-0.5 transition ${dark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-700"}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Metrics table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 180 }} />
            {slots.map((_, i) => <col key={i} />)}
          </colgroup>
          <tbody className={`divide-y ${dark ? "divide-slate-700/60" : "divide-slate-100"}`}>
            {METRICS.map((m) => (
              <tr key={m.key} className={dark ? "hover:bg-slate-700/30" : "hover:bg-slate-50/70"}>
                <td className={`px-4 py-3 text-xs font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>
                  {m.label}
                </td>
                {slots.map((slot, si) => {
                  if (!slot) return (
                    <td key={si} className={`px-4 py-3 border-l text-center text-xs ${dark ? "border-slate-700 text-slate-600" : "border-slate-100 text-slate-400"}`}>—</td>
                  );
                  const val = summaries[si]?.[m.key] ?? 0;
                  const baseVal = summaries[baseIdx]?.[m.key] ?? 0;
                  return (
                    <td key={si} className={`px-4 py-3 border-l ${dark ? "border-slate-700" : "border-slate-100"}`}>
                      <p className={`tabular-nums font-bold text-sm ${dark ? "text-white" : "text-slate-900"}`}>{m.fmt(val)}</p>
                      {si !== baseIdx && (
                        <DeltaBadge base={baseVal} value={val} fmt={m.fmt} />
                      )}
                      {si === baseIdx && (
                        <span className={`text-[10px] ${dark ? "text-slate-600" : "text-slate-400"}`}>baseline</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Revenue chart */}
      {filledSlots.length >= 2 && (
        <div className={`border-t px-6 py-5 ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <div className="mb-4 flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wider ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Revenue by Year
            </p>
            <div className="flex gap-1">
              {[
                { key: "y1Revenue", label: "Summary" },
              ].map(({ key, label }) => null)}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueChartData} barGap={4} barCategoryGap="28%">
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}K`}
                width={52}
              />
              <Tooltip content={<CustomTooltip dark={dark} />} cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={7}
              />
              {filledSlots.map((slot, si) => (
                <Bar key={slot.id} dataKey={slot.label} fill={COLUMN_COLORS[si]} radius={[4, 4, 0, 0]} maxBarSize={40} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
