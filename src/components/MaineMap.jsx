import React, { useState, useEffect, useRef, useCallback } from "react";
import { APIProvider, Map, useMap, AdvancedMarker, InfoWindow } from "@vis.gl/react-google-maps";
import { useDarkMode } from "./DarkModeContext.jsx";
import { HEATMAP_MODES } from "../data/constants.js";
import { getHeatmapValue, getCompetitiveThreatScore } from "../utils/calculations.js";
import MAINE_HOSPITALS from "../data/maineHospitals.js";
import ANDWELL_OFFICES from "../data/andwellOffices.js";
import MAINE_COUNTY_GEOJSON from "../data/maineCountyGeoJson.js";

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const MAINE_CENTER = { lat: 45.25, lng: -69.45 };
const MAINE_ZOOM = 7;

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

function interpolateColorHex(value, min, max, dark) {
  const css = interpolateColor(value, min, max, dark);
  const m = css.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return "#3b82f6";
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("");
}

function competitionColor(score, dark) {
  if (score >= 70) return dark ? "#991b1b" : "#fecaca";
  if (score >= 50) return dark ? "#92400e" : "#fed7aa";
  if (score >= 30) return dark ? "#1e40af" : "#bfdbfe";
  return dark ? "#166534" : "#bbf7d0";
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function nearestOffice(hospital) {
  let best = null;
  let bestKm = Infinity;
  for (const office of ANDWELL_OFFICES) {
    const km = haversineKm(hospital.lat, hospital.lng, office.lat, office.lng);
    if (km < bestKm) { bestKm = km; best = office; }
  }
  const miles = (bestKm * 0.621371).toFixed(0);
  return { office: best, miles };
}

const DRIVE_TIME_RINGS = [
  { minutes: 30, radiusKm: 32, color: "#22c55e", fillOpacity: 0.07, strokeOpacity: 0.7 },
  { minutes: 60, radiusKm: 64, color: "#f59e0b", fillOpacity: 0.05, strokeOpacity: 0.6 },
  { minutes: 90, radiusKm: 96, color: "#ef4444", fillOpacity: 0.04, strokeOpacity: 0.5 },
];

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#334155" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", stylers: [{ visibility: "simplified" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#334155" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#475569" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0c1a2e" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#475569" }] },
];

function CountyLayer({ heatmapMode, rows, selectedCounty, onSelectCounty, dark }) {
  const map = useMap();
  const dataLayerRef = useRef(null);

  const rowMap = {};
  if (rows) rows.forEach((r) => { rowMap[r.county] = r; });

  const heatValues = {};
  if (heatmapMode !== "priority" && rows) {
    Object.keys(rowMap).forEach((county) => {
      if (launchCounties.has(county)) {
        heatValues[county] = getHeatmapValue(county, heatmapMode, rows);
      }
    });
  }
  const heatVals = Object.values(heatValues);
  const heatMin = heatVals.length ? Math.min(...heatVals) : 0;
  const heatMax = heatVals.length ? Math.max(...heatVals) : 1;

  function getFill(countyName) {
    const isActive = launchCounties.has(countyName);
    if (!isActive) return dark ? "#1e293b" : "#e2e8f0";
    if (heatmapMode === "priority") {
      const row = rowMap[countyName];
      return row ? priorityColors[row.launchGroup] || (dark ? "#334155" : "#e2e8f0") : dark ? "#475569" : "#93c5fd";
    }
    if (heatmapMode === "competition") {
      const threat = getCompetitiveThreatScore(countyName);
      return competitionColor(threat ? threat.score : 0, dark);
    }
    const val = heatValues[countyName] || 0;
    return interpolateColorHex(val, heatMin, heatMax, dark);
  }

  useEffect(() => {
    if (!map) return;

    if (dataLayerRef.current) {
      dataLayerRef.current.forEach((f) => map.data.remove(f));
    }

    const features = map.data.addGeoJson(MAINE_COUNTY_GEOJSON);
    dataLayerRef.current = features;

    map.data.setStyle((feature) => {
      const name = feature.getProperty("name");
      const isSelected = name === selectedCounty;
      const isActive = launchCounties.has(name);
      return {
        fillColor: isSelected ? (dark ? "#1d4ed8" : "#1e3a5f") : getFill(name),
        fillOpacity: isSelected ? 0.75 : isActive ? 0.65 : 0.35,
        strokeColor: isSelected ? "#3b82f6" : dark ? "#475569" : "#94a3b8",
        strokeWeight: isSelected ? 2.5 : 1,
        cursor: isActive ? "pointer" : "default",
      };
    });

    const clickListener = map.data.addListener("click", (event) => {
      const name = event.feature.getProperty("name");
      if (launchCounties.has(name) && onSelectCounty) onSelectCounty(name);
    });

    return () => {
      if (dataLayerRef.current) {
        dataLayerRef.current.forEach((f) => map.data.remove(f));
      }
      google.maps.event.removeListener(clickListener);
    };
  }, [map, heatmapMode, selectedCounty, dark, rows]);

  return null;
}

function DriveTimeRings({ visible, dark }) {
  const map = useMap();
  const circlesRef = useRef([]);

  useEffect(() => {
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];
    if (!map || !visible) return;

    for (const office of ANDWELL_OFFICES) {
      for (const ring of DRIVE_TIME_RINGS) {
        const circle = new google.maps.Circle({
          map,
          center: { lat: office.lat, lng: office.lng },
          radius: ring.radiusKm * 1000,
          fillColor: ring.color,
          fillOpacity: ring.fillOpacity,
          strokeColor: ring.color,
          strokeOpacity: ring.strokeOpacity,
          strokeWeight: 1.5,
          clickable: false,
        });
        circlesRef.current.push(circle);
      }
    }

    return () => {
      circlesRef.current.forEach((c) => c.setMap(null));
      circlesRef.current = [];
    };
  }, [map, visible, dark]);

  return null;
}

function OfficeMarkers({ visible, dark }) {
  if (!visible) return null;
  return ANDWELL_OFFICES.map((office) => (
    <AdvancedMarker key={office.id} position={{ lat: office.lat, lng: office.lng }}>
      <div
        title={office.name}
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: dark ? "#60a5fa" : "#1d4ed8",
          border: "2.5px solid white",
          boxShadow: "0 0 0 2px #3b82f6, 0 2px 6px rgba(0,0,0,0.4)",
        }}
      />
    </AdvancedMarker>
  ));
}

function HospitalMarkers({ visible, dark, selectedHospital, onSelect }) {
  if (!visible) return null;
  return MAINE_HOSPITALS.map((h) => {
    const isSelected = selectedHospital?.id === h.id;
    return (
      <AdvancedMarker
        key={h.id}
        position={{ lat: h.lat, lng: h.lng }}
        onClick={() => onSelect(isSelected ? null : h)}
      >
        <div
          title={h.name}
          style={{
            width: isSelected ? 14 : 10,
            height: isSelected ? 14 : 10,
            borderRadius: "50%",
            background: isSelected ? "#f97316" : dark ? "#f87171" : "#dc2626",
            border: `2px solid ${isSelected ? "#fff" : dark ? "#1e293b" : "#fff"}`,
            boxShadow: isSelected ? "0 0 0 2px #f97316, 0 2px 6px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.3)",
            transition: "all 0.15s",
            cursor: "pointer",
          }}
        />
      </AdvancedMarker>
    );
  });
}

function HospitalInfoWindow({ hospital, onClose, dark }) {
  if (!hospital) return null;
  const { office, miles } = nearestOffice(hospital);
  return (
    <InfoWindow
      position={{ lat: hospital.lat, lng: hospital.lng }}
      onCloseClick={onClose}
      pixelOffset={[0, -10]}
    >
      <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 180, maxWidth: 240, padding: "2px 0" }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#0f172a", lineHeight: 1.3 }}>{hospital.name}</p>
        <p style={{ margin: "3px 0 0", fontSize: 11, color: "#475569" }}>{hospital.system}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}>
          <span style={{ fontWeight: 700 }}>County:</span> {hospital.county}
        </p>
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 11, color: "#475569" }}>
            <span style={{ fontWeight: 700 }}>Nearest Andwell:</span>
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#1d4ed8", fontWeight: 700 }}>{office?.name}</p>
          <p style={{ margin: "1px 0 0", fontSize: 11, color: "#475569" }}>~{miles} mi as the crow flies</p>
        </div>
      </div>
    </InfoWindow>
  );
}

function MapLegend({ isGradientMode, gradientLow, gradientHigh, heatmapMode, heatMin, heatMax, dark, showHospitals, showRings }) {
  const discreteLegendItems = heatmapMode === "priority"
    ? [
        ...Object.entries(priorityColors).map(([label, color]) => ({ label, color })),
        { label: "Not in plan", color: dark ? "#334155" : "#d1d5db" },
      ]
    : [
        { label: "Low (<30)", color: dark ? "#166534" : "#bbf7d0" },
        { label: "Moderate (30–49)", color: dark ? "#1e40af" : "#bfdbfe" },
        { label: "High (50–69)", color: dark ? "#92400e" : "#fed7aa" },
        { label: "Fortress (70+)", color: dark ? "#991b1b" : "#fecaca" },
      ];

  const formatVal = (v) => {
    if (heatmapMode === "penetration") return `${v.toFixed(1)}%`;
    if (heatmapMode === "revenue") return `$${Math.round(v).toLocaleString()}`;
    return Math.round(v).toLocaleString();
  };

  return (
    <div className="mt-4 space-y-2">
      {isGradientMode ? (
        <div className="flex flex-col items-center gap-1">
          <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {heatmapMode === "penetration" ? "Market penetration" : heatmapMode === "revenue" ? "Modeled Y1 revenue" : "65+ population"} — low to high
          </p>
          <div className="flex w-48 items-center gap-2">
            <span className={`text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>{formatVal(heatMin)}</span>
            <div className="h-3 flex-1 rounded-full" style={{ background: `linear-gradient(to right, ${gradientLow}, ${gradientHigh})` }} />
            <span className={`text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>{formatVal(heatMax)}</span>
          </div>
          <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: dark ? "#334155" : "#d1d5db" }} />
            Not in plan
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-3">
          {discreteLegendItems.map(({ label, color }) => (
            <div key={label} className={`flex items-center gap-1.5 text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
          ))}
        </div>
      )}

      {showRings && (
        <div className="flex flex-wrap justify-center gap-3">
          {DRIVE_TIME_RINGS.map((r) => (
            <div key={r.minutes} className={`flex items-center gap-1.5 text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: r.color, background: "transparent" }} />
              {r.minutes} min
            </div>
          ))}
          <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>drive-time from each Andwell office</span>
        </div>
      )}

      {showHospitals && (
        <div className={`flex items-center justify-center gap-1.5 text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#dc2626" }} />
          Hospital / Health System — click for details
        </div>
      )}
    </div>
  );
}

function CompetitorMarkers({ visible, dark, competitors }) {
  const [selected, setSelected] = useState(null);
  if (!visible || !competitors?.length) return null;

  const COUNTY_COORDS = {
    Cumberland: { lat: 43.82, lng: -70.38 },
    York: { lat: 43.45, lng: -70.72 },
    Penobscot: { lat: 44.93, lng: -68.67 },
    Kennebec: { lat: 44.41, lng: -69.77 },
    Knox: { lat: 44.07, lng: -69.18 },
    Lincoln: { lat: 43.98, lng: -69.57 },
    Androscoggin: { lat: 44.18, lng: -70.23 },
    Sagadahoc: { lat: 43.93, lng: -69.87 },
    Aroostook: { lat: 46.72, lng: -68.01 },
    Somerset: { lat: 45.52, lng: -69.96 },
    Franklin: { lat: 44.97, lng: -70.44 },
    Oxford: { lat: 44.22, lng: -70.74 },
    Washington: { lat: 44.99, lng: -67.64 },
    Hancock: { lat: 44.56, lng: -68.39 },
    Waldo: { lat: 44.44, lng: -69.13 },
    Piscataquis: { lat: 45.81, lng: -69.28 },
  };

  const placed = competitors
    .filter((c) => c.known_counties?.length || c.county)
    .flatMap((c, idx) => {
      const counties = c.known_counties?.length ? c.known_counties : c.county ? [c.county] : [];
      return counties.slice(0, 2).map((county, ci) => {
        const base = COUNTY_COORDS[county];
        if (!base) return null;
        const jitter = (idx * 0.03 + ci * 0.015);
        return { ...c, lat: base.lat + jitter, lng: base.lng + jitter, county };
      }).filter(Boolean);
    })
    .slice(0, 40);

  const isNational = (c) => {
    const CHAINS = ["amedisys", "gentiva", "kindred", "compassus", "constellation", "lhc group"];
    return CHAINS.some((ch) => (c.name || "").toLowerCase().includes(ch) || (c.parent_company || "").toLowerCase().includes(ch));
  };

  return (
    <>
      {placed.map((comp, i) => {
        const sel = selected?.name === comp.name && selected?.county === comp.county;
        const national = isNational(comp);
        return (
          <React.Fragment key={`${comp.name}-${comp.county}-${i}`}>
            <AdvancedMarker
              position={{ lat: comp.lat, lng: comp.lng }}
              onClick={() => setSelected(sel ? null : comp)}
            >
              <div
                title={comp.name}
                style={{
                  width: sel ? 14 : 10,
                  height: sel ? 14 : 10,
                  borderRadius: "50%",
                  background: national ? (dark ? "#fbbf24" : "#f59e0b") : (dark ? "#a78bfa" : "#7c3aed"),
                  border: `2px solid ${sel ? "#fff" : dark ? "#1e293b" : "#fff"}`,
                  boxShadow: sel ? "0 0 0 2px #7c3aed, 0 2px 6px rgba(0,0,0,0.4)" : "0 1px 4px rgba(0,0,0,0.3)",
                  transition: "all 0.15s",
                  cursor: "pointer",
                }}
              />
            </AdvancedMarker>
            {sel && (
              <InfoWindow
                position={{ lat: comp.lat, lng: comp.lng }}
                onCloseClick={() => setSelected(null)}
                pixelOffset={[0, -10]}
              >
                <div style={{ fontFamily: "system-ui, sans-serif", minWidth: 180, maxWidth: 240, padding: "2px 0" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#0f172a", lineHeight: 1.3 }}>{comp.name}</p>
                  {comp.parent_company && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>{comp.parent_company}</p>}
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "#475569" }}><span style={{ fontWeight: 700 }}>County:</span> {comp.county}</p>
                  {comp.provider_type && <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}><span style={{ fontWeight: 700 }}>Type:</span> {comp.provider_type}</p>}
                  {comp.match_status && <p style={{ margin: "4px 0 0", fontSize: 11, fontWeight: 700, color: comp.match_status === "CMS Verified" ? "#059669" : "#6b7280" }}>{comp.match_status}</p>}
                  {national && <p style={{ margin: "4px 0 0", fontSize: 10, color: "#d97706", fontWeight: 700 }}>⚠ National chain</p>}
                </div>
              </InfoWindow>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}

function MapInner({ heatmapMode, rows, selectedCounty, onSelectCounty, dark, showHospitals, showRings, showOffices, showCompetitors, competitors }) {
  const [selectedHospital, setSelectedHospital] = useState(null);

  return (
    <>
      <CountyLayer
        heatmapMode={heatmapMode}
        rows={rows}
        selectedCounty={selectedCounty}
        onSelectCounty={onSelectCounty}
        dark={dark}
      />
      <DriveTimeRings visible={showRings} dark={dark} />
      <OfficeMarkers visible={showOffices || showRings} dark={dark} />
      <HospitalMarkers
        visible={showHospitals}
        dark={dark}
        selectedHospital={selectedHospital}
        onSelect={setSelectedHospital}
      />
      <HospitalInfoWindow
        hospital={selectedHospital}
        onClose={() => setSelectedHospital(null)}
        dark={dark}
      />
      <CompetitorMarkers visible={showCompetitors} dark={dark} competitors={competitors} />
    </>
  );
}

export default function MaineMap({ rows, selectedCounty, onSelectCounty }) {
  const { dark } = useDarkMode();
  const [heatmapMode, setHeatmapMode] = useState("priority");
  const [showHospitals, setShowHospitals] = useState(false);
  const [showRings, setShowRings] = useState(false);
  const [showCompetitors, setShowCompetitors] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [compFilter, setCompFilter] = useState({ providerType: "all", cmsStatus: "all", nationalOnly: false });

  React.useEffect(() => {
    if (showCompetitors && competitors.length === 0) {
      fetch("/api/cms/competitors")
        .then((r) => r.json())
        .then((d) => setCompetitors(d.competitors || []))
        .catch(() => {});
    }
  }, [showCompetitors]);

  const filteredCompetitors = React.useMemo(() => {
    const CHAINS = ["amedisys", "gentiva", "kindred", "compassus", "constellation", "lhc group", "centerwell", "enhabit"];
    return competitors.filter((c) => {
      if (compFilter.providerType !== "all" && c.provider_type !== compFilter.providerType) return false;
      if (compFilter.cmsStatus !== "all" && c.match_status !== compFilter.cmsStatus) return false;
      if (compFilter.nationalOnly) {
        const isNat = CHAINS.some((ch) => (c.name || "").toLowerCase().includes(ch) || (c.parent_company || "").toLowerCase().includes(ch));
        if (!isNat) return false;
      }
      return true;
    });
  }, [competitors, compFilter]);

  const rowMap = {};
  if (rows) rows.forEach((row) => { rowMap[row.county] = row; });

  const heatValues = {};
  if (heatmapMode !== "priority" && rows) {
    Object.keys(rowMap).forEach((county) => {
      if (launchCounties.has(county)) {
        heatValues[county] = getHeatmapValue(county, heatmapMode, rows);
      }
    });
  }
  const heatVals = Object.values(heatValues);
  const heatMin = heatVals.length ? Math.min(...heatVals) : 0;
  const heatMax = heatVals.length ? Math.max(...heatVals) : 1;
  const isGradientMode = heatmapMode !== "priority" && heatmapMode !== "competition";
  const gradientLow = interpolateColor(0, 0, 1, dark);
  const gradientHigh = interpolateColor(1, 0, 1, dark);

  if (!API_KEY) {
    return (
      <div className={`flex h-64 items-center justify-center rounded-2xl border text-sm font-semibold ${dark ? "border-slate-700 bg-slate-800 text-slate-400" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
        Google Maps API key not configured (VITE_GOOGLE_MAPS_API_KEY)
      </div>
    );
  }

  const toggleBtn = (label, active, onClick, color) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition ${
        active
          ? `${color} text-white`
          : dark
            ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="relative space-y-3">
      <div className="flex flex-wrap gap-1.5">
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

      <div className={`flex flex-wrap items-center gap-1.5 rounded-xl border px-3 py-2 ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
        <span className={`mr-1 text-[10px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>Layers:</span>
        {toggleBtn("🏥 Hospitals", showHospitals, () => setShowHospitals((p) => !p), "bg-red-600")}
        {toggleBtn("⏱ Drive-time rings", showRings, () => setShowRings((p) => !p), "bg-emerald-600")}
        {toggleBtn("🟣 Competitors", showCompetitors, () => setShowCompetitors((p) => !p), "bg-purple-600")}
      </div>

      <APIProvider apiKey={API_KEY}>
        <div style={{ width: "100%", height: 480, borderRadius: 16, overflow: "hidden" }}>
          <Map
            defaultCenter={MAINE_CENTER}
            defaultZoom={MAINE_ZOOM}
            mapId="maine-map"
            styles={dark ? DARK_MAP_STYLE : undefined}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={true}
            zoomControl={true}
            clickableIcons={false}
          >
            <MapInner
              heatmapMode={heatmapMode}
              rows={rows}
              selectedCounty={selectedCounty}
              onSelectCounty={onSelectCounty}
              dark={dark}
              showHospitals={showHospitals}
              showRings={showRings}
              showOffices={showRings}
              showCompetitors={showCompetitors}
              competitors={filteredCompetitors}
            />
          </Map>
        </div>
      </APIProvider>

      <MapLegend
        isGradientMode={isGradientMode}
        gradientLow={gradientLow}
        gradientHigh={gradientHigh}
        heatmapMode={heatmapMode}
        heatMin={heatMin}
        heatMax={heatMax}
        dark={dark}
        showHospitals={showHospitals}
        showRings={showRings}
      />
      {showCompetitors && (
        <div className="space-y-2">
          <div className={`flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 ${dark ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>Filter:</span>
            <select
              value={compFilter.providerType}
              onChange={(e) => setCompFilter((f) => ({ ...f, providerType: e.target.value }))}
              className={`rounded-lg border px-2 py-1 text-xs font-semibold ${dark ? "border-slate-600 bg-slate-700 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option value="all">All types</option>
              <option value="hospice">Hospice</option>
              <option value="homehealth">Home health</option>
              <option value="both">Both</option>
            </select>
            <select
              value={compFilter.cmsStatus}
              onChange={(e) => setCompFilter((f) => ({ ...f, cmsStatus: e.target.value }))}
              className={`rounded-lg border px-2 py-1 text-xs font-semibold ${dark ? "border-slate-600 bg-slate-700 text-slate-200" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option value="all">All CMS status</option>
              <option value="CMS Verified">CMS Verified</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Not Verified by CMS">Not CMS Verified</option>
            </select>
            <label className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${dark ? "text-slate-300" : "text-slate-700"}`}>
              <input
                type="checkbox"
                checked={compFilter.nationalOnly}
                onChange={(e) => setCompFilter((f) => ({ ...f, nationalOnly: e.target.checked }))}
                className="rounded"
              />
              National chains only
            </label>
            <span className={`ml-auto text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
              {filteredCompetitors.length} of {competitors.length} shown
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#7c3aed" }} />
              Regional competitor
            </div>
            <div className={`flex items-center gap-1.5 text-[10px] font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              National chain
            </div>
            <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>— click pin for details · Run CMS Sync to populate</span>
          </div>
        </div>
      )}
    </div>
  );
}
