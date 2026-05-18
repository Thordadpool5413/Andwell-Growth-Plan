import React from "react";
import { DEFAULT_SCENARIO } from "../data/constants.js";

function SliderRow({ label, value, min, max, step, format, onChange }) {
  return (
    <div className="flex items-center gap-4">
      <label className="w-44 shrink-0 text-sm font-semibold text-slate-700">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-blue-600"
      />
      <span className="w-16 text-right text-sm font-black text-slate-950">{format(value)}</span>
    </div>
  );
}

export default function ScenarioPanel({ scenario, setScenario }) {
  const pct = (v) => `${(v * 100).toFixed(0)}%`;

  const update = (key, value) =>
    setScenario((prev) => ({ ...prev, [key]: value }));

  const updateCapture = (key, index, value) =>
    setScenario((prev) => {
      const arr = [...prev[key]];
      arr[index] = value;
      return { ...prev, [key]: arr };
    });

  const isDefault =
    scenario.conversionRate === DEFAULT_SCENARIO.conversionRate &&
    JSON.stringify(scenario.hhCapture) === JSON.stringify(DEFAULT_SCENARIO.hhCapture) &&
    JSON.stringify(scenario.woundCapture) === JSON.stringify(DEFAULT_SCENARIO.woundCapture) &&
    JSON.stringify(scenario.therapyCapture) === JSON.stringify(DEFAULT_SCENARIO.therapyCapture);

  return (
    <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-700">Scenario Controls</p>
          <p className="mt-1 text-sm text-slate-600">Adjust assumptions to see real-time financial impact</p>
        </div>
        {!isDefault && (
          <button
            onClick={() => setScenario(DEFAULT_SCENARIO)}
            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            Reset defaults
          </button>
        )}
      </div>

      <div className="space-y-4">
        <SliderRow
          label="Conversion rate"
          value={scenario.conversionRate}
          min={0.5}
          max={1}
          step={0.05}
          format={pct}
          onChange={(v) => update("conversionRate", v)}
        />

        <div className="border-t border-blue-200 pt-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Home Healthcare capture</p>
          {["Year 1", "Year 2", "Year 3"].map((label, i) => (
            <SliderRow
              key={label}
              label={label}
              value={scenario.hhCapture[i]}
              min={0.01}
              max={0.5}
              step={0.01}
              format={pct}
              onChange={(v) => updateCapture("hhCapture", i, v)}
            />
          ))}
        </div>

        <div className="border-t border-blue-200 pt-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Mobile Wound capture</p>
          {["Year 1", "Year 2", "Year 3"].map((label, i) => (
            <SliderRow
              key={label}
              label={label}
              value={scenario.woundCapture[i]}
              min={0.01}
              max={0.7}
              step={0.01}
              format={pct}
              onChange={(v) => updateCapture("woundCapture", i, v)}
            />
          ))}
        </div>

        <div className="border-t border-blue-200 pt-3">
          <p className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">Therapy Care capture</p>
          {["Year 1", "Year 2", "Year 3"].map((label, i) => (
            <SliderRow
              key={label}
              label={label}
              value={scenario.therapyCapture[i]}
              min={0.01}
              max={0.6}
              step={0.01}
              format={pct}
              onChange={(v) => updateCapture("therapyCapture", i, v)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
