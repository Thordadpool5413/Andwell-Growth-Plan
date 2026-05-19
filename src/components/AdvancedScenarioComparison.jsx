import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { MetricCard, ComparisonMetric } from "./MetricVariants.jsx";
import { WaterfallChart } from "./AdvancedCharts.jsx";

export function AdvancedScenarioComparison({
  scenarios = [],
  baselineIndex = 0,
  onClose = () => {},
  className = "",
}) {
  const { dark } = useDarkMode();
  const [selectedCompareIndex, setSelectedCompareIndex] = useState(1);
  const [viewMode, setViewMode] = useState("variance"); // variance | waterfall | matrix

  if (scenarios.length < 2) {
    return (
      <div className={`
        rounded-2xl border p-12 text-center
        ${dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}
      `}>
        <p className={dark ? "text-slate-400" : "text-slate-600"}>
          Add at least 2 scenarios to compare
        </p>
      </div>
    );
  }

  const baseline = scenarios[baselineIndex];
  const comparison = scenarios[selectedCompareIndex];

  // Calculate variances
  const variances = {
    y1Revenue: comparison.revenue?.[0] - baseline.revenue?.[0] || 0,
    y2Revenue: comparison.revenue?.[1] - baseline.revenue?.[1] || 0,
    y3Revenue: comparison.revenue?.[2] - baseline.revenue?.[2] || 0,
    totalContribution: comparison.totalContribution - baseline.totalContribution,
  };

  // Waterfall data
  const waterfallData = [
    { label: "Baseline", value: baseline.totalContribution },
    { label: "Scenario Difference", value: variances.totalContribution },
    { label: "Projected Total", value: comparison.totalContribution },
  ];

  return (
    <div className={className}>
      {/* Header */}
      <div className={`
        rounded-t-2xl border-b p-6 flex items-center justify-between
        ${dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}
      `}>
        <div>
          <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
            Scenario Comparison Analysis
          </h3>
          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Compare {baseline.name} vs {comparison.name}
          </p>
        </div>

        {/* View mode selector */}
        <div className="flex items-center gap-2">
          {["variance", "waterfall", "matrix"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors
                ${viewMode === mode
                  ? dark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                  : dark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }
              `}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={`
        rounded-b-2xl border p-6 border-t-0
        ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
      `}>
        {/* Scenario selector */}
        <div className="mb-6 flex items-center gap-4">
          <span className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Compare against:
          </span>
          <select
            value={selectedCompareIndex}
            onChange={(e) => setSelectedCompareIndex(Number(e.target.value))}
            className={`
              px-3 py-2 rounded-lg border font-medium transition-colors
              ${dark
                ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500"
                : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
              }
            `}
          >
            {scenarios.map((scenario, idx) => (
              <option key={idx} value={idx} disabled={idx === baselineIndex}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>

        {/* Variance view */}
        {viewMode === "variance" && (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <ComparisonMetric
                label="Year 1 Revenue"
                current={comparison.revenue?.[0] || 0}
                target={baseline.revenue?.[0] || 0}
                unit="$"
                showVariance
              />
              <ComparisonMetric
                label="Year 2 Revenue"
                current={comparison.revenue?.[1] || 0}
                target={baseline.revenue?.[1] || 0}
                unit="$"
                showVariance
              />
              <ComparisonMetric
                label="Year 3 Revenue"
                current={comparison.revenue?.[2] || 0}
                target={baseline.revenue?.[2] || 0}
                unit="$"
                showVariance
              />
              <ComparisonMetric
                label="Total Contribution"
                current={comparison.totalContribution}
                target={baseline.totalContribution}
                unit="$"
                showVariance
              />
            </div>

            {/* Variance detail */}
            <div className={`
              rounded-xl border p-4
              ${dark ? "bg-slate-700 border-slate-600" : "bg-slate-50 border-slate-200"}
            `}>
              <p className={`text-sm font-semibold mb-4 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                Variance Summary
              </p>
              <div className="space-y-3">
                {Object.entries(variances).map(([key, value]) => {
                  const percentage = baseline[key] === 0 ? 0 : (value / baseline[key]) * 100;
                  const isPositive = value > 0;

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <span className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className={`font-semibold ${isPositive ? "text-positive" : "text-negative"}`}>
                          {isPositive ? "+" : ""}{value.toFixed(0)}
                        </span>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                          isPositive
                            ? dark ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                            : dark ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                        }`}>
                          {isPositive ? "+" : ""}{percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Waterfall view */}
        {viewMode === "waterfall" && (
          <WaterfallChart
            data={waterfallData}
            title="Revenue Waterfall Analysis"
            positiveColor="#10b981"
            negativeColor="#ef4444"
          />
        )}

        {/* Matrix view */}
        {viewMode === "matrix" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={dark ? "bg-slate-700" : "bg-slate-100"}>
                  <th className={`text-left p-4 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Metric</th>
                  <th className={`text-right p-4 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{baseline.name}</th>
                  <th className={`text-right p-4 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>{comparison.name}</th>
                  <th className={`text-right p-4 font-semibold ${dark ? "text-slate-300" : "text-slate-700"}`}>Variance</th>
                </tr>
              </thead>
              <tbody className={dark ? "divide-y divide-slate-700" : "divide-y divide-slate-200"}>
                {[
                  { label: "Y1 Revenue", key: "revenue", index: 0 },
                  { label: "Y2 Revenue", key: "revenue", index: 1 },
                  { label: "Y3 Revenue", key: "revenue", index: 2 },
                  { label: "Total Contribution", key: "totalContribution" },
                ].map((row, idx) => {
                  const baselineValue = row.index !== undefined
                    ? baseline[row.key]?.[row.index] || 0
                    : baseline[row.key] || 0;
                  const comparisonValue = row.index !== undefined
                    ? comparison[row.key]?.[row.index] || 0
                    : comparison[row.key] || 0;
                  const variance = comparisonValue - baselineValue;
                  const isPositive = variance > 0;

                  return (
                    <tr key={idx} className={dark ? "hover:bg-slate-700" : "hover:bg-slate-50"}>
                      <td className={`p-4 font-medium ${dark ? "text-slate-300" : "text-slate-700"}`}>
                        {row.label}
                      </td>
                      <td className={`text-right p-4 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        ${baselineValue.toFixed(0)}
                      </td>
                      <td className={`text-right p-4 font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                        ${comparisonValue.toFixed(0)}
                      </td>
                      <td className={`text-right p-4 font-bold ${isPositive ? "text-positive" : "text-negative"}`}>
                        {isPositive ? "+" : ""}${variance.toFixed(0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
