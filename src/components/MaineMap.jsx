import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { HEATMAP_MODES } from "../data/constants.js";
import { getHeatmapValue, getCompetitiveThreatScore } from "../utils/calculations.js";

const countyPaths = {
  York: "M 85 680 L 130 680 L 145 650 L 170 640 L 185 610 L 175 580 L 150 570 L 120 575 L 100 590 L 80 620 L 75 655 Z",
  Cumberland: "M 120 575 L 150 570 L 175 580 L 195 555 L 210 540 L 195 515 L 170 510 L 145 520 L 125 540 L 115 560 Z",
  Sagadahoc: "M 170 510 L 195 515 L 210 500 L 200 485 L 180 480 L 165 490 Z",
  Lincoln: "M 180 480 L 200 485 L 220 470 L 230 450 L 215 435 L 195 440 L 180 455 Z",
  Knox: "M 195 440 L 215 435 L 235 420 L 250 430 L 240 450 L 220 455 L 205 450 Z",
  Kennebec: "M 145 520 L 170 510 L 165 490 L 180 455 L 195 440 L 185 410 L 165 400 L 140 415 L 130 445 L 125 480 Z",
  Androscoggin: "M 125 540 L 145 520 L 125 480 L 105 490 L 95 520 Z",
  Oxford: "M 50 530 L 95 520 L 105 490 L 125 480 L 130 445 L 140 415 L 120 390 L 90 380 L 60 400 L 40 440 L 35 490 Z",
  Franklin: "M 90 380 L 120 390 L 140 415 L 165 400 L 160 370 L 145 340 L 120 330 L 95 345 L 80 360 Z",
  Somerset: "M 120 330 L 145 340 L 160 370 L 165 400 L 185 410 L 205 390 L 220 350 L 210 310 L 190 280 L 160 270 L 140 290 L 125 310 Z",
  Penobscot: "M 210 310 L 220 350 L 205 390 L 185 410 L 195 440 L 235 420 L 270 400 L 290 370 L 295 330 L 285 290 L 260 260 L 235 250 L 215 270 L 210 290 Z",
  Piscataquis: "M 140 290 L 160 270 L 190 280 L 210 290 L 215 270 L 235 250 L 220 220 L 195 200 L 160 195 L 130 210 L 120 245 L 125 275 Z",
  Waldo: "M 235 420 L 250 430 L 270 420 L 280 400 L 270 380 L 250 385 Z",
  Hancock: "M 270 400 L 290 370 L 310 380 L 330 400 L 320 430 L 300 440 L 280 430 Z",
  Washington: "M 290 370 L 295 330 L 310 300 L 340 290 L 360 310 L 365 350 L 350 380 L 330 400 L 310 380 Z",
  Aroostook: "M 160 195 L 195 200 L 220 220 L 235 250 L 260 260 L 285 290 L 295 330 L 310 300 L 340 290 L 350 250 L 340 200 L 320 150 L 290 100 L 260 70 L 230 60 L 200 70 L 180 100 L 165 140 L 155 170 Z",
};

const launchCounties = new Set([
  "York", "Cumberland", "Penobscot", "Kennebec",
  "Knox", "Lincoln", "Sagadahoc", "Washington",
  "Aroostook", "Oxford", "Somerset", "Franklin",
]);

const priorityColors = {
  "Priority 1": "#2563eb",
  "Priority 2": "#7c3aed",
  "Priority 3": "#f59e0b",
};

function interpolateColor(value, min, max, dark) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const clamped = Math.max(0, Math.min(1, ratio));
  if (dark) {
    const r = Math.round(30 + clamped * 90);
    const g = Math.round(41 + (1 - clamped) * 60);
    const b = Math.round(59 + clamped * 180);
    return `rgb(${r},${g},${b})`;
  }
  const r = Math.round(219 - clamped * 185);
  const g = Math.round(234 - clamped * 140);
  const b = Math.round(254 - clamped * 19);
  return `rgb(${r},${g},${b})`;
}

function competitionColor(score, dark) {
  if (score >= 70) return dark ? "#991b1b" : "#fecaca";
  if (score >= 50) return dark ? "#92400e" : "#fed7aa";
  if (score >= 30) return dark ? "#1e40af" : "#bfdbfe";
  return dark ? "#166534" : "#bbf7d0";
}

export default function MaineMap({ rows, selectedCounty, onSelectCounty }) {
  const { dark } = useDarkMode();
  const [heatmapMode, setHeatmapMode] = useState("priority");

  const rowMap = {};
  if (rows) rows.forEach((row) => { rowMap[row.county] = row; });

  const heatValues = {};
  if (heatmapMode !== "priority" && rows) {
    Object.keys(countyPaths).forEach((county) => {
      if (launchCounties.has(county)) {
        heatValues[county] = getHeatmapValue(county, heatmapMode, rows);
      }
    });
  }
  const heatVals = Object.values(heatValues);
  const heatMin = heatVals.length ? Math.min(...heatVals) : 0;
  const heatMax = heatVals.length ? Math.max(...heatVals) : 1;

  function getFill(county) {
    const isActive = launchCounties.has(county);
    if (!isActive) return dark ? "#1e293b" : "#e2e8f0";

    if (heatmapMode === "priority") {
      const row = rowMap[county];
      return row ? priorityColors[row.launchGroup] || (dark ? "#334155" : "#e2e8f0") : dark ? "#475569" : "#93c5fd";
    }
    if (heatmapMode === "competition") {
      const threat = getCompetitiveThreatScore(county);
      return competitionColor(threat ? threat.score : 0, dark);
    }
    const val = heatValues[county] || 0;
    return interpolateColor(val, heatMin, heatMax, dark);
  }

  const legendItems = heatmapMode === "priority"
    ? [
        ...Object.entries(priorityColors).map(([label, color]) => ({ label, color })),
        { label: "Not in plan", color: dark ? "#334155" : "#d1d5db" },
      ]
    : heatmapMode === "competition"
      ? [
          { label: "Low (<30)", color: dark ? "#166534" : "#bbf7d0" },
          { label: "Moderate (30-49)", color: dark ? "#1e40af" : "#bfdbfe" },
          { label: "High (50-69)", color: dark ? "#92400e" : "#fed7aa" },
          { label: "Fortress (70+)", color: dark ? "#991b1b" : "#fecaca" },
        ]
      : [
          { label: "Low", color: interpolateColor(0, 0, 1, dark) },
          { label: "Medium", color: interpolateColor(0.5, 0, 1, dark) },
          { label: "High", color: interpolateColor(1, 0, 1, dark) },
        ];

  return (
    <div className="relative">
      <div className="mb-3 flex flex-wrap gap-1.5">
        {HEATMAP_MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setHeatmapMode(mode.key)}
            className={`rounded-full px-3 py-1 text-xs font-black transition ${
              heatmapMode === mode.key
                ? "bg-blue-600 text-white"
                : dark
                  ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-blue-50"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <svg viewBox="20 40 370 670" className="mx-auto h-[500px] w-full max-w-[400px]">
        {Object.entries(countyPaths).map(([county, path]) => {
          const isActive = launchCounties.has(county);
          const isSelected = county === selectedCounty;
          const fill = getFill(county);
          const heatVal = heatValues[county];

          return (
            <path
              key={county}
              d={path}
              fill={isSelected ? (dark ? "#1d4ed8" : "#1e3a5f") : fill}
              stroke={isSelected ? "#3b82f6" : dark ? "#475569" : "#94a3b8"}
              strokeWidth={isSelected ? 2.5 : 1}
              className={isActive ? "cursor-pointer transition-colors hover:opacity-80" : ""}
              onClick={() => isActive && onSelectCounty && onSelectCounty(county)}
            >
              <title>
                {county}
                {rowMap[county] ? ` - ${rowMap[county].launchGroup}` : ""}
                {heatVal !== undefined ? ` | ${HEATMAP_MODES.find((m) => m.key === heatmapMode)?.label}: ${heatmapMode === "penetration" ? `${heatVal.toFixed(1)}%` : heatmapMode === "revenue" ? `$${Math.round(heatVal).toLocaleString()}` : Math.round(heatVal).toLocaleString()}` : ""}
              </title>
            </path>
          );
        })}
      </svg>

      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {legendItems.map(({ label, color }) => (
          <div key={label} className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
