import React, { useMemo, useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { HEATMAP_MODES } from "../data/constants.js";
import { namedProviderRows } from "../data/providers.js";
import { MAINE_COUNTIES, getCountyPriority, getCountyMapMetrics, getMapMetricValue } from "../data/dashboardData.js";
import MAINE_COUNTY_GEOJSON from "../data/generated/maineCountyBoundaries.json";

const priorityColors = {
  "Priority 1": "#2563eb",
  "Priority 2": "#7c3aed",
  "Priority 3": "#f59e0b",
  "Not in plan": "#94a3b8",
};

const darkPriorityColors = {
  "Priority 1": "#60a5fa",
  "Priority 2": "#a78bfa",
  "Priority 3": "#fbbf24",
  "Not in plan": "#334155",
};

function getFeatureName(feature) {
  return (feature.properties?.name || feature.properties?.NAME || "").replace(/\s+County$/i, "");
}

function flattenCoords(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates.flat();
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat(2);
  return [];
}

function boundsForFeatures(features) {
  const coords = features.flatMap((feature) => flattenCoords(feature.geometry));
  const xs = coords.map(([lng]) => lng);
  const ys = coords.map(([, lat]) => lat);
  return {
    minLng: Math.min(...xs),
    maxLng: Math.max(...xs),
    minLat: Math.min(...ys),
    maxLat: Math.max(...ys),
  };
}

function makeProjector(bounds, width, height, padding) {
  const lngSpan = bounds.maxLng - bounds.minLng;
  const latSpan = bounds.maxLat - bounds.minLat;
  const scale = Math.min((width - padding * 2) / lngSpan, (height - padding * 2) / latSpan);
  const usedWidth = lngSpan * scale;
  const usedHeight = latSpan * scale;
  const offsetX = (width - usedWidth) / 2;
  const offsetY = (height - usedHeight) / 2;
  return ([lng, lat]) => [offsetX + (lng - bounds.minLng) * scale, offsetY + (bounds.maxLat - lat) * scale];
}

function ringPath(ring, project) {
  return ring.map((coord, index) => {
    const [x, y] = project(coord);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z";
}

function featurePath(feature, project) {
  const geometry = feature.geometry;
  if (geometry.type === "Polygon") return geometry.coordinates.map((ring) => ringPath(ring, project)).join(" ");
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ringPath(ring, project))).join(" ");
  return "";
}

function centroid(feature, project) {
  const coords = flattenCoords(feature.geometry);
  if (!coords.length) return [0, 0];
  const sum = coords.reduce((acc, coord) => {
    const [x, y] = project(coord);
    acc[0] += x;
    acc[1] += y;
    return acc;
  }, [0, 0]);
  return [sum[0] / coords.length, sum[1] / coords.length];
}

function interpolateColor(value, min, max, dark) {
  const ratio = max > min ? (value - min) / (max - min) : 0;
  const clamped = Math.max(0, Math.min(1, ratio));
  if (dark) {
    const b = Math.round(90 + clamped * 140);
    return `rgb(30, ${Math.round(60 + clamped * 70)}, ${b})`;
  }
  const r = Math.round(226 - clamped * 170);
  const g = Math.round(232 - clamped * 100);
  const b = Math.round(240 - clamped * 30);
  return `rgb(${r}, ${g}, ${b})`;
}

function countyFill({ county, rows, rowMap, heatmapMode, heatValues, min, max, dark }) {
  const priority = getCountyPriority(county, rows);
  if (heatmapMode === "priority") return (dark ? darkPriorityColors : priorityColors)[priority] || (dark ? "#334155" : "#cbd5e1");
  const row = rowMap[county] || getCountyMapMetrics(county, rows);
  if (!row) return dark ? "#1e293b" : "#e2e8f0";
  return interpolateColor(heatValues[county] || 0, min, max, dark);
}

function Legend({ heatmapMode, dark, min, max }) {
  if (heatmapMode === "priority") {
    return (
      <div className="flex flex-wrap justify-center gap-3">
        {Object.entries(dark ? darkPriorityColors : priorityColors).map(([label, color]) => (
          <div key={label} className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{label}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`flex items-center justify-center gap-2 text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
      <span>{Math.round(min).toLocaleString()}</span>
      <span className="h-3 w-40 rounded-full" style={{ background: "linear-gradient(to right,#e2e8f0,#2563eb)" }} />
      <span>{Math.round(max).toLocaleString()}</span>
    </div>
  );
}

export default function MaineMap({ rows, selectedCounty, onSelectCounty, providerTypeFilter, onProviderTypeFilterChange, heatmapMode: controlledHeatmapMode, onHeatmapModeChange }) {
  const { dark } = useDarkMode();
  const [internalHeatmapMode, setInternalHeatmapMode] = useState("priority");
  const heatmapMode = controlledHeatmapMode || internalHeatmapMode;
  const setHeatmapMode = (nextMode) => {
    setInternalHeatmapMode(nextMode);
    onHeatmapModeChange?.(nextMode);
  };
  const [hoverCounty, setHoverCounty] = useState(null);
  const features = MAINE_COUNTY_GEOJSON.features || [];
  const width = 720;
  const height = 720;
  const bounds = useMemo(() => boundsForFeatures(features), [features]);
  const project = useMemo(() => makeProjector(bounds, width, height, 32), [bounds]);
  const rowMap = useMemo(() => Object.fromEntries(rows.map((row) => [row.county, row])), [rows]);
  const heatValues = useMemo(() => {
    const values = {};
    for (const county of MAINE_COUNTIES.map((item) => item.name)) values[county] = getMapMetricValue(county, heatmapMode, rows);
    return values;
  }, [heatmapMode, rows]);
  const vals = Object.values(heatValues).filter((value) => Number.isFinite(value));
  const min = vals.length ? Math.min(...vals) : 0;
  const max = vals.length ? Math.max(...vals) : 1;
  const countyCount = MAINE_COUNTIES.length;
  const activeCount = new Set(rows.map((row) => row.county)).size;
  const visibleProviders = namedProviderRows.filter((provider) => {
    if (providerProviderType(providerTypeFilter) === "all") return true;
    return providerProviderType(providerTypeFilter) === provider.service;
  });

  const selectedFeature = features.find((feature) => getFeatureName(feature) === selectedCounty);
  const selectedPriority = getCountyPriority(selectedCounty, rows);
  const hoverMetrics = hoverCounty ? getCountyMapMetrics(hoverCounty, rows) : null;
  const selectedMetrics = getCountyMapMetrics(selectedCounty, rows);
  const activeLayer = HEATMAP_MODES.find((mode) => mode.key === heatmapMode)?.label || "Priority Group";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {HEATMAP_MODES.map((mode) => (
          <button key={mode.key} onClick={() => setHeatmapMode(mode.key)} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${heatmapMode === mode.key ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>{mode.label}</button>
        ))}
        {onProviderTypeFilterChange && (
          <select value={providerTypeFilter || "all"} onChange={(event) => onProviderTypeFilterChange(event.target.value)} className={`ml-auto rounded-xl border px-3 py-2 text-xs font-semibold ${dark ? "border-slate-700 bg-slate-800 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}>
            <option value="all">All providers</option>
            <option value="homehealth">Home health</option>
            <option value="hospice">Hospice</option>
          </select>
        )}
      </div>

      <div className={`rounded-[24px] border p-3 ${dark ? "border-slate-700 bg-slate-950" : "border-slate-200 bg-slate-50"}`}>
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Interactive Maine county strategy map" className="h-[32rem] w-full max-h-[70vh]">
          <rect width={width} height={height} rx="24" fill={dark ? "#0f172a" : "#f8fafc"} />
          {features.map((feature) => {
            const county = getFeatureName(feature);
            const isSelected = county === selectedCounty;
            const isHovered = county === hoverCounty;
            const priority = getCountyPriority(county, rows);
            return (
              <path
                key={county}
                d={featurePath(feature, project)}
                role="button"
                tabIndex={0}
                aria-label={`${county} County, ${priority}`}
                onClick={() => onSelectCounty?.(county)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelectCounty?.(county); }}
                onMouseEnter={() => setHoverCounty(county)}
                onMouseLeave={() => setHoverCounty(null)}
                fill={countyFill({ county, rows, rowMap, heatmapMode, heatValues, min, max, dark })}
                fillOpacity={isSelected ? 0.92 : priority === "Not in plan" && heatmapMode === "priority" ? 0.42 : 0.72}
                stroke={isSelected ? (dark ? "#f8fafc" : "#0f172a") : isHovered ? "#38bdf8" : dark ? "#475569" : "#ffffff"}
                strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 1.2}
                className="cursor-pointer transition-all duration-150 outline-none"
              >
                <title>{`${county} County · ${activeLayer}: ${Math.round(heatValues[county] || 0).toLocaleString()}`}</title>
              </path>
            );
          })}
          {features.map((feature) => {
            const county = getFeatureName(feature);
            const [x, y] = centroid(feature, project);
            const showLabel = county === selectedCounty || ["York", "Cumberland", "Penobscot", "Kennebec", "Aroostook"].includes(county);
            if (!showLabel) return null;
            return <text key={`label-${county}`} x={x} y={y} textAnchor="middle" fontSize={county === selectedCounty ? 18 : 12} fontWeight="800" fill={dark ? "#f8fafc" : "#0f172a"} paintOrder="stroke" stroke={dark ? "#0f172a" : "#ffffff"} strokeWidth="4">{county}</text>;
          })}
        </svg>
      </div>

      <Legend heatmapMode={heatmapMode} dark={dark} min={min} max={max} />

      {(hoverMetrics || selectedMetrics) && (
        <div className={`rounded-2xl border p-4 text-sm ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={dark ? "text-slate-500" : "text-slate-400"}>{hoverMetrics ? "Hover county" : "Selected county"}</p>
              <p className="font-bold">{(hoverMetrics || selectedMetrics).county} · {activeLayer}</p>
            </div>
            <p className="text-lg font-bold tabular-nums">{Math.round(getMapMetricValue((hoverMetrics || selectedMetrics).county, heatmapMode, rows)).toLocaleString()}</p>
          </div>
          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-4">
            <div><span className={dark ? "text-slate-500" : "text-slate-400"}>Demand</span><p className="font-semibold tabular-nums">{Math.round((hoverMetrics || selectedMetrics).demand).toLocaleString()}</p></div>
            <div><span className={dark ? "text-slate-500" : "text-slate-400"}>Y1 revenue</span><p className="font-semibold tabular-nums">${Math.round((hoverMetrics || selectedMetrics).revenue).toLocaleString()}</p></div>
            <div><span className={dark ? "text-slate-500" : "text-slate-400"}>Providers</span><p className="font-semibold tabular-nums">{(hoverMetrics || selectedMetrics).allProviders}</p></div>
            <div><span className={dark ? "text-slate-500" : "text-slate-400"}>Penetration</span><p className="font-semibold tabular-nums">{((hoverMetrics || selectedMetrics).marketPenetration || 0).toFixed(1)}%</p></div>
          </div>
          {(hoverMetrics || selectedMetrics).missingNote && <p className={`mt-2 text-xs ${dark ? "text-amber-300" : "text-amber-700"}`}>{(hoverMetrics || selectedMetrics).missingNote}</p>}
        </div>
      )}

      <div className={`grid gap-3 rounded-2xl border p-4 text-sm sm:grid-cols-4 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
        <div><p className={dark ? "text-slate-500" : "text-slate-400"}>County boundaries</p><p className="font-bold">US Census TIGERweb</p></div>
        <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Counties shown</p><p className="font-bold">{countyCount}</p></div>
        <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Counties in plan</p><p className="font-bold">{activeCount}</p></div>
        <div><p className={dark ? "text-slate-500" : "text-slate-400"}>Selected</p><p className="font-bold">{selectedFeature ? `${selectedCounty} (${selectedPriority})` : "None"}</p></div>
      </div>
      <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-500"}`}>Provider filter context loaded: {visibleProviders.length} provider-file rows. Provider file share is not county market share.</p>
    </div>
  );
}

function providerProviderType(filter) {
  if (filter === "homehealth") return "Home Healthcare";
  if (filter === "hospice") return "Hospice";
  return "all";
}
