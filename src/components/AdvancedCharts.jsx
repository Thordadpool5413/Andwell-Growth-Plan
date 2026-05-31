import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";

export function WaterfallChart({
  data = [],
  title = "Variance Waterfall",
  baseColor = "#3b82f6",
  positiveColor = "#10b981",
  negativeColor = "#ef4444",
  className = "",
}) {
  const { dark } = useDarkMode();

  if (!data || data.length === 0) {
    return <div className="text-sm text-slate-500">No data available</div>;
  }

  // Calculate cumulative values for positioning
  const chartData = data.map((item, idx) => {
    const prevSum = idx === 0 ? 0 : data.slice(0, idx).reduce((sum, d) => sum + d.value, 0);
    return { ...item, cumulative: prevSum, isPositive: item.value > 0 };
  });

  const maxValue = Math.max(...chartData.map(d => d.cumulative + d.value), 0) || 100;
  const scale = 100 / (maxValue * 1.2);

  return (
    <div className={`rounded-2xl border p-6 shadow-shadow-md ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} ${className}`}>
      <h3 className={`text-lg font-bold mb-6 ${dark ? "text-white" : "text-slate-900"}`}>
        {title}
      </h3>

      <div className="space-y-4">
        {chartData.map((item, idx) => {
          const height = Math.max(Math.abs(item.value) * scale, 5);
          const barColor = idx === 0 || idx === chartData.length - 1 
            ? baseColor 
            : item.isPositive ? positiveColor : negativeColor;

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  {item.label}
                </span>
                <span className={`text-sm font-bold ${item.isPositive ? "text-positive" : "text-negative"}`}>
                  {item.isPositive ? "+" : ""}{item.value}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(Math.abs(item.value) * scale, 100)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Heatmap({
  data = [],
  title = "Heatmap",
  rows = [],
  columns = [],
  colorScheme = "blue",
  className = "",
}) {
  const { dark } = useDarkMode();

  const getColor = (value, max) => {
    const intensity = Math.max(0, Math.min(value / max, 1));
    
    const colorSchemes = {
      blue: {
        light: `rgba(59, 130, 246, ${intensity * 0.7})`,
        dark: `rgba(96, 165, 250, ${intensity * 0.7})`,
      },
      green: {
        light: `rgba(16, 185, 129, ${intensity * 0.7})`,
        dark: `rgba(52, 211, 153, ${intensity * 0.7})`,
      },
      red: {
        light: `rgba(239, 68, 68, ${intensity * 0.7})`,
        dark: `rgba(248, 113, 113, ${intensity * 0.7})`,
      },
    };

    return dark ? colorSchemes[colorScheme].dark : colorSchemes[colorScheme].light;
  };

  const maxValue = Math.max(...data.flat());

  return (
    <div className={`rounded-2xl border p-6 shadow-shadow-md ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} ${className} overflow-x-auto`}>
      {title && (
        <h3 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className={`text-left p-2 font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}></th>
            {columns.map((col, idx) => (
              <th key={idx} className={`text-center p-2 font-semibold ${dark ? "text-slate-400" : "text-slate-600"} whitespace-nowrap`}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              <td className={`p-2 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
                {rows[rowIdx]}
              </td>
              {row.map((value, colIdx) => (
                <td
                  key={colIdx}
                  className="p-2 text-center rounded transition-colors duration-200"
                  style={{ backgroundColor: getColor(value, maxValue) }}
                  title={`${rows[rowIdx]} - ${columns[colIdx]}: ${value}`}
                >
                  <span className={`font-semibold ${dark ? "text-white" : "text-slate-900"}`}>
                    {value}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SparklineChart({
  data = [],
  height = 40,
  color = "#3b82f6",
  showDots = false,
  className = "",
}) {
  if (!data || data.length < 2) return null;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, idx) => {
    const x = (idx / (data.length - 1)) * 100;
    const y = 100 - ((value - minValue) / range) * 100;
    return { x, y, value };
  });

  const pathD = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      height={height}
      className={className}
    >
      {/* Fill area */}
      <path
        d={`${pathD} L 100 100 L 0 100 Z`}
        fill={color}
        opacity="0.2"
      />

      {/* Line */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth="2"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />

      {/* Data points */}
      {showDots && points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r="1.5"
          fill={color}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

export function ProgressIndicator({
  value = 0,
  max = 100,
  label = "",
  showPercent = true,
  variant = "standard",
  className = "",
}) {
  const { dark } = useDarkMode();
  const percentage = Math.min((value / max) * 100, 100);

  const variants = {
    standard: { bg: dark ? "bg-slate-700" : "bg-slate-200", bar: "bg-blue-500" },
    success: { bg: dark ? "bg-slate-700" : "bg-slate-200", bar: "bg-success-500" },
    warning: { bg: dark ? "bg-slate-700" : "bg-slate-200", bar: "bg-warning-500" },
    error: { bg: dark ? "bg-slate-700" : "bg-slate-200", bar: "bg-error-500" },
  };

  const colors = variants[variant] || variants.standard;

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className={`text-sm font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>
            {label}
          </span>
          {showPercent && (
            <span className={`text-sm font-bold ${dark ? "text-slate-400" : "text-slate-600"}`}>
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>
      )}
      <div className={`w-full h-2 rounded-full overflow-hidden ${colors.bg}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colors.bar}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
