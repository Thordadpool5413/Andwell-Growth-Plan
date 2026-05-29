import React from "react";
import { DEFAULT_SCENARIO } from "../data/constants.js";
import { useDarkMode } from "./DarkModeContext.jsx";

function SliderRow({ label, value, min, max, step, format, onChange, dark }) {
  return (
    <div className="flex items-center gap-4">
      <label className={`w-44 shrink-0 text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 flex-1 cursor-pointer appearance-none rounded-full accent-blue-500 ${dark ? "bg-slate-600" : "bg-slate-200"}`}
      />
      <span className={`w-16 text-right text-sm font-black ${dark ? "text-white" : "text-slate-950"}`}>{format(value)}</span>
    </div>
  );
}

export default function ScenarioPanel({ scenario, setScenario }) {
  const { dark } = useDarkMode();
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
    <div className={`rounded-3xl border p-6 shadow-sm transition-colors duration-300 ${
      dark
        ? "border-blue-800 bg-blue-950/30"
        : "border-blue-200 bg-blue-50/60"
    }`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className={`text-xs font-black uppercase tracking-[0.22em] ${dark ? "text-blue-400" : "text-blue-700"}`}>Scenario Controls</p>
          <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>Adjust assumptions to see real-time financial impact across all views</p>
        </div>
        {!isDefault && (
          <button
            onClick={() => setScenario(DEFAULT_SCENARIO)}
            className={`rounded-full px-4 py-2 text-xs font-black shadow-sm ring-1 transition ${
              dark
                ? "bg-slate-700 text-slate-200 ring-slate-600 hover:bg-slate-600"
                : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            Reset defaults
          </button>
        )}
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3 text-xs">
        {[
          { label: "Conversion rate baseline", benchmark: "Industry median: 72–78% (NAHC 2023)" },
          { label: "HH capture rate", benchmark: "Industry median: 8–15% first-year capture" },
          { label: "Wound / Therapy capture", benchmark: "Internal Andwell planning assumptions" },
        ].map((note) => (
          <div key={note.label} className={`rounded-xl px-3 py-2 ${dark ? "bg-slate-800/60 text-slate-400" : "bg-white/70 text-slate-500"}`}>
            <p className={`font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{note.label}</p>
            <p className="mt-0.5 text-[10px] leading-4">{note.benchmark}</p>
          </div>
        ))}
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
          dark={dark}
        />

        <div className={`border-t pt-3 ${dark ? "border-blue-800" : "border-blue-200"}`}>
          <p className={`mb-2 text-xs font-black uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-500"}`}>Home Healthcare capture</p>
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
              dark={dark}
            />
          ))}
        </div>

        <div className={`border-t pt-3 ${dark ? "border-blue-800" : "border-blue-200"}`}>
          <p className={`mb-2 text-xs font-black uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-500"}`}>Mobile Wound capture</p>
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
              dark={dark}
            />
          ))}
        </div>

        <div className={`border-t pt-3 ${dark ? "border-blue-800" : "border-blue-200"}`}>
          <p className={`mb-2 text-xs font-black uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-500"}`}>Therapy Care capture</p>
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
              dark={dark}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
