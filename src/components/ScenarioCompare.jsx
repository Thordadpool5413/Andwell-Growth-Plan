import React, { useState } from "react";
import { DEFAULT_SCENARIO } from "../data/constants.js";
import { buildRows } from "../utils/calculations.js";
import { currency, number, percent } from "../utils/formatters.js";
import { useDarkMode } from "./DarkModeContext.jsx";

const PRESET_SCENARIOS = {
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

function DeltaCell({ base, compare, format }) {
  const diff = compare - base;
  if (diff === 0) return <span className="text-slate-400">—</span>;
  const positive = diff > 0;
  return (
    <span className={positive ? "font-black text-emerald-600" : "font-black text-red-500"}>
      {positive ? "+" : ""}{format(diff)}
    </span>
  );
}

export default function ScenarioCompare({ currentScenario }) {
  const { dark } = useDarkMode();
  const [compareKey, setCompareKey] = useState("Conservative");

  const currentRows = buildRows(currentScenario);
  const compareRows = buildRows(PRESET_SCENARIOS[compareKey]);

  const summarize = (rows) => ({
    y1Revenue: rows.reduce((s, r) => s + r.revenue[0], 0),
    y3Revenue: rows.reduce((s, r) => s + r.revenue[2], 0),
    y1Referrals: rows.reduce((s, r) => s + r.referrals[0], 0),
    y1Starts: rows.reduce((s, r) => s + r.starts[0], 0),
    y3Starts: rows.reduce((s, r) => s + r.starts[2], 0),
    totalContribution: rows.reduce((s, r) => s + r.totalContribution, 0),
  });

  const current = summarize(currentRows);
  const compare = summarize(compareRows);

  const metrics = [
    { label: "Year 1 Revenue", key: "y1Revenue", fmt: currency },
    { label: "Year 3 Revenue", key: "y3Revenue", fmt: currency },
    { label: "Year 1 Referrals", key: "y1Referrals", fmt: number },
    { label: "Year 1 Starts", key: "y1Starts", fmt: number },
    { label: "Year 3 Starts", key: "y3Starts", fmt: number },
    { label: "Total 3Y Contribution", key: "totalContribution", fmt: currency },
  ];

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${dark ? "border-slate-700 bg-slate-800/60" : "border-indigo-200 bg-indigo-50/60"}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-indigo-400" : "text-indigo-700"}`}>Scenario Comparison</p>
          <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>Compare your current assumptions against presets</p>
        </div>
        <select
          value={compareKey}
          onChange={(e) => setCompareKey(e.target.value)}
          className={`rounded-xl px-4 py-2 text-sm font-black shadow-sm ${dark ? "bg-slate-700 text-white border-slate-600" : "bg-white text-slate-700 border-slate-200"} border`}
        >
          {Object.keys(PRESET_SCENARIOS).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={dark ? "text-slate-400" : "text-slate-500"}>
              <th className="px-4 py-3 text-left text-xs uppercase tracking-wide">Metric</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide">Current</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide">{compareKey}</th>
              <th className="px-4 py-3 text-right text-xs uppercase tracking-wide">Delta</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-indigo-100"}`}>
            {metrics.map((m) => (
              <tr key={m.key} className={dark ? "hover:bg-slate-700/50" : "hover:bg-indigo-100/50"}>
                <td className={`px-4 py-3 font-black ${dark ? "text-white" : "text-slate-950"}`}>{m.label}</td>
                <td className={`px-4 py-3 text-right ${dark ? "text-slate-300" : "text-slate-700"}`}>{m.fmt(current[m.key])}</td>
                <td className={`px-4 py-3 text-right ${dark ? "text-slate-300" : "text-slate-700"}`}>{m.fmt(compare[m.key])}</td>
                <td className="px-4 py-3 text-right">
                  <DeltaCell base={current[m.key]} compare={compare[m.key]} format={m.fmt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
