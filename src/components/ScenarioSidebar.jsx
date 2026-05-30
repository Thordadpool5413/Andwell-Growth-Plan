import React, { useEffect, useRef } from "react";
import { DEFAULT_SCENARIO } from "../data/constants.js";
import { useDarkMode } from "./DarkModeContext.jsx";

function CompactSlider({ label, value, min, max, step, format, onChange, dark }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold leading-tight ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
        <span className={`shrink-0 text-xs font-black tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-1.5 w-full cursor-pointer appearance-none rounded-full accent-blue-500 ${dark ? "bg-slate-600" : "bg-slate-200"}`}
      />
    </div>
  );
}

function SliderGroup({ title, dark, children }) {
  return (
    <div>
      <p className={`mb-2 text-[10px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function ScenarioSidebar({ scenario, setScenario, open, onClose }) {
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

  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px] 2xl:hidden print:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={panelRef}
        className={`
          fixed top-0 right-0 z-50 h-full w-80 transform transition-transform duration-300 ease-in-out
          print:hidden flex flex-col
          ${dark ? "bg-slate-900 border-l border-slate-700" : "bg-white border-l border-slate-200"}
          shadow-2xl
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
        aria-label="Scenario controls sidebar"
        role="dialog"
        aria-modal="true"
      >
        <div className={`flex shrink-0 items-center justify-between border-b px-4 py-3 ${dark ? "border-slate-700" : "border-slate-100"}`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.22em] ${dark ? "text-blue-400" : "text-blue-600"}`}>
              Scenario Controls
            </p>
            <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
              Live assumptions — all views update
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isDefault && (
              <button
                onClick={() => setScenario(DEFAULT_SCENARIO)}
                className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 transition ${
                  dark
                    ? "bg-slate-700 text-slate-200 ring-slate-600 hover:bg-slate-600"
                    : "bg-slate-50 text-slate-600 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                Reset
              </button>
            )}
            <button
              onClick={onClose}
              className={`rounded-full p-1.5 transition ${dark ? "text-slate-400 hover:bg-slate-800 hover:text-slate-200" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
              aria-label="Close scenario panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          <SliderGroup title="Conversion" dark={dark}>
            <CompactSlider
              label="Conversion rate"
              value={scenario.conversionRate}
              min={0.5}
              max={1}
              step={0.05}
              format={pct}
              onChange={(v) => update("conversionRate", v)}
              dark={dark}
            />
          </SliderGroup>

          <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`} />

          <SliderGroup title="Home Healthcare capture" dark={dark}>
            {["Year 1", "Year 2", "Year 3"].map((label, i) => (
              <CompactSlider
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
          </SliderGroup>

          <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`} />

          <SliderGroup title="Mobile Wound capture" dark={dark}>
            {["Year 1", "Year 2", "Year 3"].map((label, i) => (
              <CompactSlider
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
          </SliderGroup>

          <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`} />

          <SliderGroup title="Therapy Care capture" dark={dark}>
            {["Year 1", "Year 2", "Year 3"].map((label, i) => (
              <CompactSlider
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
          </SliderGroup>

          <div className={`border-t ${dark ? "border-slate-800" : "border-slate-100"}`} />

          <div className={`rounded-xl p-3 text-[10px] leading-relaxed ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <p className={`mb-1 font-black ${dark ? "text-slate-300" : "text-slate-600"}`}>Benchmarks</p>
            <p>Conversion: 72–78% industry median (NAHC 2023)</p>
            <p>HH capture: 8–15% first-year (industry)</p>
            <p>Wound/Therapy: Andwell planning assumptions</p>
          </div>
        </div>

        {!isDefault && (
          <div className={`shrink-0 border-t px-4 py-3 ${dark ? "border-slate-700 bg-slate-900" : "border-slate-100 bg-white"}`}>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${dark ? "bg-amber-900/30 text-amber-300" : "bg-amber-50 text-amber-700"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Custom scenario active</span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className={`
          fixed right-80 top-1/2 z-50 -translate-y-1/2 transition-all duration-300 print:hidden
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        aria-label="Close scenario panel"
      >
        <div className={`flex h-10 w-6 items-center justify-center rounded-l-lg shadow-lg ${dark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-white text-slate-600 hover:bg-slate-50"} border ${dark ? "border-slate-600" : "border-slate-200"}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </div>
      </button>
    </>
  );
}
