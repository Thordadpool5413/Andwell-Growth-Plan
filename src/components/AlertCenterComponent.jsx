import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { AlertCircle, AlertTriangle, CheckCircle, Info, X, Clock } from "lucide-react";

export function AlertCenter({
  alerts = [],
  onDismiss = () => {},
  onSnooze = () => {},
  className = "",
}) {
  const { dark } = useDarkMode();
  const [snoozedAlerts, setSnoozedAlerts] = useState(new Set());
  const [expandedAlerts, setExpandedAlerts] = useState(new Set());

  const getAlertIcon = (type) => {
    const iconClass = "h-5 w-5";
    const colorClass = {
      error: "text-error-500",
      warning: "text-warning-500",
      success: "text-success-500",
      info: "text-info-500",
    }[type] || "text-info-500";

    switch (type) {
      case "error":
        return <AlertCircle className={`${iconClass} ${colorClass}`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} ${colorClass}`} />;
      case "success":
        return <CheckCircle className={`${iconClass} ${colorClass}`} />;
      default:
        return <Info className={`${iconClass} ${colorClass}`} />;
    }
  };

  const getBgColor = (type) => {
    const variants = {
      error: dark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200",
      warning: dark ? "bg-yellow-900/20 border-yellow-800" : "bg-yellow-50 border-yellow-200",
      success: dark ? "bg-green-900/20 border-green-800" : "bg-green-50 border-green-200",
      info: dark ? "bg-blue-900/20 border-blue-800" : "bg-blue-50 border-blue-200",
    };
    return variants[type] || variants.info;
  };

  const getTextColor = (type) => {
    const variants = {
      error: dark ? "text-red-400" : "text-red-800",
      warning: dark ? "text-yellow-400" : "text-yellow-800",
      success: dark ? "text-green-400" : "text-green-800",
      info: dark ? "text-blue-400" : "text-blue-800",
    };
    return variants[type] || variants.info;
  };

  const activeAlerts = alerts.filter((a) => !snoozedAlerts.has(a.id));

  return (
    <div className={`rounded-2xl border shadow-shadow-md p-6 ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
            Alert Center
          </h3>
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
            {activeAlerts.length} active {activeAlerts.length === 1 ? "alert" : "alerts"}
          </p>
        </div>
        {snoozedAlerts.size > 0 && (
          <button
            onClick={() => setSnoozedAlerts(new Set())}
            className={`text-xs font-semibold px-3 py-1 rounded-full ${
              dark ? "text-blue-400 hover:bg-blue-900/20" : "text-blue-600 hover:bg-blue-50"
            }`}
          >
            Show snoozed ({snoozedAlerts.size})
          </button>
        )}
      </div>

      {activeAlerts.length === 0 ? (
        <div className={`py-8 text-center text-sm ${dark ? "text-slate-500" : "text-slate-500"}`}>
          No active alerts. Great job!
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activeAlerts.map((alert) => {
            const isExpanded = expandedAlerts.has(alert.id);

            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 transition-all duration-200 ${getBgColor(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold ${getTextColor(alert.type)}`}>
                          {alert.title}
                        </p>
                        {alert.message && (
                          <p className={`text-sm mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                            {isExpanded ? alert.message : `${alert.message.substring(0, 100)}...`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {alert.action && (
                          <button
                            onClick={() => alert.action?.onClick?.(alert.id)}
                            className={`text-xs font-semibold px-3 py-1 rounded-lg transition-colors ${
                              dark
                                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                          >
                            {alert.action.label}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            const newSnoozed = new Set(snoozedAlerts);
                            newSnoozed.add(alert.id);
                            setSnoozedAlerts(newSnoozed);
                            onSnooze?.(alert.id);
                          }}
                          className={`p-1 rounded-lg transition-colors ${
                            dark
                              ? "hover:bg-slate-700"
                              : "hover:bg-slate-300"
                          }`}
                          title="Snooze for 1 hour"
                        >
                          <Clock className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            onDismiss?.(alert.id);
                          }}
                          className={`p-1 rounded-lg transition-colors ${
                            dark
                              ? "hover:bg-slate-700"
                              : "hover:bg-slate-300"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {alert.timestamp && (
                      <p className={`text-xs mt-2 ${dark ? "text-slate-500" : "text-slate-500"}`}>
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                {alert.message && !isExpanded && (
                  <button
                    onClick={() => setExpandedAlerts(new Set([...expandedAlerts, alert.id]))}
                    className={`mt-2 text-xs font-semibold ${getTextColor(alert.type)}`}
                  >
                    Show more
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AlertBadge({
  count = 0,
  type = "error",
  animated = false,
  className = "",
}) {
  const { dark } = useDarkMode();

  if (count === 0) return null;

  const colors = {
    error: dark ? "bg-red-600 text-white" : "bg-red-500 text-white",
    warning: dark ? "bg-yellow-600 text-white" : "bg-yellow-500 text-white",
    success: dark ? "bg-green-600 text-white" : "bg-green-500 text-white",
    info: dark ? "bg-blue-600 text-white" : "bg-blue-500 text-white",
  };

  return (
    <div className={`
      inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
      ${colors[type]}
      ${animated ? "animate-pulse-soft" : ""}
      ${className}
    `}>
      {count > 9 ? "9+" : count}
    </div>
  );
}

export function AlertThreshold({
  label,
  current,
  threshold,
  unit = "",
  type = "error",
  className = "",
}) {
  const { dark } = useDarkMode();
  const isTriggered = current > threshold;

  return (
    <div className={`
      rounded-xl border p-4
      ${isTriggered
        ? dark ? "bg-red-900/20 border-red-800" : "bg-red-50 border-red-200"
        : dark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
      }
      ${className}
    `}>
      <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-600"}`}>
        {label}
      </p>
      <div className="mt-2 flex items-end gap-4">
        <div>
          <p className={`text-2xl font-bold ${isTriggered ? "text-red-600" : dark ? "text-white" : "text-slate-900"}`}>
            {current}{unit}
          </p>
          <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>
            Threshold: {threshold}{unit}
          </p>
        </div>
        {isTriggered && (
          <div className="flex-1 text-right">
            <AlertTriangle className="h-6 w-6 text-red-600 ml-auto" />
          </div>
        )}
      </div>
    </div>
  );
}
