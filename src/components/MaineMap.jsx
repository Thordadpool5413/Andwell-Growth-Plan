import React from "react";

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

export default function MaineMap({ rows, selectedCounty, onSelectCounty }) {
  const rowMap = {};
  if (rows) {
    rows.forEach((row) => { rowMap[row.county] = row; });
  }

  return (
    <div className="relative">
      <svg viewBox="20 40 370 670" className="mx-auto h-[500px] w-full max-w-[400px]">
        {Object.entries(countyPaths).map(([county, path]) => {
          const row = rowMap[county];
          const isActive = launchCounties.has(county);
          const isSelected = county === selectedCounty;
          const fillColor = row
            ? priorityColors[row.launchGroup] || "#e2e8f0"
            : isActive
              ? "#93c5fd"
              : "#e2e8f0";

          return (
            <path
              key={county}
              d={path}
              fill={isSelected ? "#1e3a5f" : fillColor}
              stroke={isSelected ? "#1e40af" : "#94a3b8"}
              strokeWidth={isSelected ? 2.5 : 1}
              className={isActive ? "cursor-pointer transition-colors hover:opacity-80" : ""}
              onClick={() => isActive && onSelectCounty && onSelectCounty(county)}
            >
              <title>{county}{row ? ` - ${row.launchGroup}` : ""}</title>
            </path>
          );
        })}
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {Object.entries(priorityColors).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span className="h-3 w-3 rounded-full bg-slate-300" />
          Not in plan
        </div>
      </div>
    </div>
  );
}
