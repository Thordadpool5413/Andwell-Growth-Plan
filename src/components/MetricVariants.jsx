import React from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { TrendingUp, TrendingDown } from "lucide-react";
import AnimatedNumber, { AnimatedCurrency, AnimatedPercent } from "./AnimatedNumber.jsx";
import { TrendIndicator } from "./EnhancedTooltip.jsx";

export function MetricCard({
  label,
  value,
  previous = null,
  unit = "",
  status = "neutral",
  icon = null,
  footer = null,
  className = "",
}) {
  const { dark } = useDarkMode();
  
  const statusColors = {
    success: dark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200",
    warning: dark ? "bg-yellow-900/20 border-yellow-800" : "bg-yellow-50 border-yellow-200",
    error: dark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200",
    neutral: dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200",
  };

  return (
    <div className={`
      rounded-2xl border p-6 shadow-shadow-md transition-all duration-300
      ${statusColors[status] || statusColors.neutral}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-900"}`}>
              {value}
            </p>
            {unit && <span className={`text-lg ${dark ? "text-slate-400" : "text-slate-600"}`}>{unit}</span>}
          </div>
        </div>
        {icon && <div className="text-2xl">{icon}</div>}
      </div>

      {previous !== null && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-10">
          <TrendIndicator value={value} previousValue={previous} size="sm" />
        </div>
      )}

      {footer && (
        <div className={`mt-3 text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>
          {footer}
        </div>
      )}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  trend = null,
  compact = false,
  className = "",
}) {
  const { dark } = useDarkMode();
  const isTrendingUp = trend && trend > 0;

  return (
    <div className={`
      rounded-xl border shadow-shadow-sm p-4 transition-smooth
      ${dark ? "bg-slate-800 border-slate-700 hover:bg-slate-750" : "bg-white border-slate-200 hover:bg-slate-50"}
      ${className}
    `}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-600"}`}>
        {label}
      </p>
      <div className="flex items-end justify-between mt-2">
        <p className={`${compact ? "text-lg" : "text-2xl"} font-black ${dark ? "text-white" : "text-slate-900"}`}>
          {value}
        </p>
        {trend !== null && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${isTrendingUp ? "text-positive" : "text-negative"}`}>
            <span>{trend > 0 ? "+" : ""}{trend}%</span>
            {isTrendingUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ComparisonMetric({
  label,
  current,
  target,
  unit = "",
  showVariance = true,
  className = "",
}) {
  const { dark } = useDarkMode();
  const variance = current - target;
  const variancePercent = target === 0 ? 0 : (variance / target) * 100;
  const isPositive = variance > 0;

  return (
    <div className={`
      rounded-2xl border p-6 shadow-shadow-md
      ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
      ${className}
    `}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${dark ? "text-slate-400" : "text-slate-600"}`}>
        {label}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>Current</p>
          <p className={`text-2xl font-black mt-1 ${dark ? "text-white" : "text-slate-900"}`}>
            {current}{unit}
          </p>
        </div>
        <div>
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>Target</p>
          <p className={`text-2xl font-black mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            {target}{unit}
          </p>
        </div>
      </div>

      {showVariance && (
        <div className={`mt-4 pt-4 border-t border-current border-opacity-10`}>
          <div className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-semibold
            ${isPositive 
              ? dark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
              : dark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
            }
          `}>
            {isPositive ? "+" : ""}{variancePercent.toFixed(1)}%
          </div>
        </div>
      )}
    </div>
  );
}

export function MinimalMetric({
  label,
  value,
  trend = null,
  icon = null,
  className = "",
}) {
  const { dark } = useDarkMode();

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${dark ? "hover:bg-slate-800" : "hover:bg-slate-50"} transition-smooth ${className}`}>
      {icon && <div className="text-lg">{icon}</div>}
      <div className="flex-1">
        <p className={`text-xs font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>{label}</p>
        <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
      </div>
      {trend !== null && (
        <div className={`text-sm font-semibold ${trend > 0 ? "text-positive" : "text-negative"}`}>
          {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}

export function MetricGroup({
  title,
  metrics = [],
  columns = 3,
  className = "",
}) {
  const { dark } = useDarkMode();

  return (
    <div className={className}>
      {title && (
        <h3 className={`text-sm font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}>
          {title}
        </h3>
      )}
      <div className={`grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
        {metrics.map((metric, idx) => (
          <MetricTile key={idx} {...metric} />
        ))}
      </div>
    </div>
  );
}
