import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import Badge from "./Badge.jsx";
import { AlertCircle, TrendingUp, Lightbulb, Shield } from "lucide-react";

export default function InsightsPanel({ insights, onActionClick }) {
  const { dark } = useDarkMode();
  const [expandedCategory, setExpandedCategory] = useState("recommendations");

  const categories = [
    { id: "recommendations", label: "Recommendations", icon: Lightbulb, color: "blue" },
    { id: "anomalies", label: "Anomalies", icon: AlertCircle, color: "amber" },
    { id: "risks", label: "Risks", icon: Shield, color: "red" },
    { id: "trends", label: "Trends", icon: TrendingUp, color: "green" },
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "red";
      case "medium":
        return "amber";
      case "low":
        return "blue";
      default:
        return "slate";
    }
  };

  const renderRecommendations = () => (
    <div className="space-y-3">
      {insights.recommendations?.map((rec) => (
        <div
          key={rec.id}
          className={`
            rounded-lg border p-3 space-y-2
            ${dark ? "border-blue-900 bg-blue-950/30" : "border-blue-200 bg-blue-50"}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${dark ? "text-blue-300" : "text-blue-900"}`}>
              {rec.title}
            </h4>
            <Badge tone={rec.priority === "high" ? "red" : "blue"}>{rec.priority}</Badge>
          </div>
          <p className={`text-xs ${dark ? "text-blue-200" : "text-blue-800"}`}>
            {rec.message}
          </p>
          {rec.action && (
            <button
              onClick={() => onActionClick?.(rec.actionValue)}
              className={`
                text-xs font-semibold px-2 py-1 rounded transition-colors
                ${dark
                  ? "bg-blue-900 text-blue-300 hover:bg-blue-800"
                  : "bg-blue-200 text-blue-900 hover:bg-blue-300"}
              `}
            >
              {rec.action}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-3">
      {insights.anomalies?.map((anomaly) => (
        <div
          key={anomaly.id}
          className={`
            rounded-lg border p-3 space-y-2
            ${dark ? "border-amber-900 bg-amber-950/30" : "border-amber-200 bg-amber-50"}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${dark ? "text-amber-300" : "text-amber-900"}`}>
              {anomaly.title}
            </h4>
            <Badge tone={getSeverityColor(anomaly.severity)}>
              {anomaly.severity}
            </Badge>
          </div>
          <p className={`text-xs ${dark ? "text-amber-200" : "text-amber-800"}`}>
            {anomaly.message}
          </p>
        </div>
      ))}
    </div>
  );

  const renderRisks = () => (
    <div className="space-y-3">
      {insights.risks?.map((risk) => (
        <div
          key={risk.id}
          className={`
            rounded-lg border p-3 space-y-2
            ${dark ? "border-red-900 bg-red-950/30" : "border-red-200 bg-red-50"}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-semibold ${dark ? "text-red-300" : "text-red-900"}`}>
              {risk.title}
            </h4>
            <Badge tone={getSeverityColor(risk.severity)}>
              {risk.severity}
            </Badge>
          </div>
          <p className={`text-xs ${dark ? "text-red-200" : "text-red-800"}`}>
            {risk.message}
          </p>
        </div>
      ))}
    </div>
  );

  const renderTrends = () => {
    const trends = insights.trends || {};
    return (
      <div className="space-y-3">
        <div
          className={`
            rounded-lg border p-3 space-y-2
            ${dark ? "border-green-900 bg-green-950/30" : "border-green-200 bg-green-50"}
          `}
        >
          <p className={`text-sm font-semibold ${dark ? "text-green-300" : "text-green-900"}`}>
            Growth Metrics
          </p>
          <div className="space-y-1">
            <p className={`text-xs ${dark ? "text-green-200" : "text-green-800"}`}>
              Avg Annual Growth: {(trends.avgAnnualGrowth || 0).toFixed(1)}%
            </p>
            <p className={`text-xs ${dark ? "text-green-200" : "text-green-800"}`}>
              Y1→Y2: {((trends.y1ToY2Growth || 0) * 100).toFixed(1)}%
            </p>
            <p className={`text-xs ${dark ? "text-green-200" : "text-green-800"}`}>
              Y2→Y3: {((trends.y2ToY3Growth || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  const categoryContent = {
    recommendations: renderRecommendations(),
    anomalies: renderAnomalies(),
    risks: renderRisks(),
    trends: renderTrends(),
  };

  return (
    <div
      className={`
        rounded-2xl border shadow-md
        ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}
      `}
    >
      {/* Header */}
      <div
        className={`
          border-b p-4
          ${dark ? "border-slate-700" : "border-slate-200"}
        `}
      >
        <h2 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
          Insights & Analytics
        </h2>
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
          AI-powered recommendations and analysis
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b overflow-x-auto">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const count = insights[cat.id]?.length || 0;
          return (
            <button
              key={cat.id}
              onClick={() => setExpandedCategory(cat.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap
                border-b-2 -mb-px transition-colors
                ${
                  expandedCategory === cat.id
                    ? dark
                      ? `border-${cat.color}-500 text-${cat.color}-400`
                      : `border-${cat.color}-600 text-${cat.color}-600`
                    : dark
                      ? "border-transparent text-slate-400 hover:text-slate-300"
                      : "border-transparent text-slate-600 hover:text-slate-700"
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {count > 0 && <span className="text-xs">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {categoryContent[expandedCategory] || (
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
            No insights available
          </p>
        )}
      </div>
    </div>
  );
}
