import React from "react";

export default function Sparkline({ data, color = "#2563eb", width = 80, height = 28 }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const trend = data[data.length - 1] > data[0] ? color : "#dc2626";

  return (
    <svg width={width} height={height} className="inline-block align-middle">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={trend}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].split(",")[0]}
        cy={points[points.length - 1].split(",")[1]}
        r={3}
        fill={trend}
      />
    </svg>
  );
}
