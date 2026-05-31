import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { Filter } from "lucide-react";

const formatTimeAgo = (timestamp) => {
  if (!timestamp) return "just now";
  const now = new Date();
  const then = new Date(timestamp);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default function ActivityFeed({ activities = [], maxItems = 10 }) {
  const { dark } = useDarkMode();
  const [filterType, setFilterType] = useState("all");

  const getActivityIcon = (type) => {
    switch (type) {
      case "created":
        return "✓";
      case "updated":
        return "◆";
      case "deleted":
        return "✕";
      default:
        return "•";
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case "created":
        return dark ? "text-green-400" : "text-green-600";
      case "updated":
        return dark ? "text-blue-400" : "text-blue-600";
      case "deleted":
        return dark ? "text-red-400" : "text-red-600";
      default:
        return dark ? "text-slate-400" : "text-slate-600";
    }
  };

  const filtered =
    filterType === "all"
      ? activities
      : activities.filter((a) => a.type === filterType);

  const displayActivities = filtered.slice(0, maxItems);

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
          border-b p-4 flex items-center justify-between
          ${dark ? "border-slate-700" : "border-slate-200"}
        `}
      >
        <div>
          <h3 className={`text-lg font-bold ${dark ? "text-white" : "text-slate-900"}`}>
            Activity Feed
          </h3>
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>
            Recent changes to your plan
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="px-4 pt-4 flex gap-2 flex-wrap">
        {["all", "created", "updated", "deleted"].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`
              px-3 py-1 rounded-full text-xs font-semibold transition-colors
              ${
                filterType === type
                  ? dark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-600 text-white"
                  : dark
                    ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }
            `}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Activity List */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity, index) => (
            <div key={activity.id || index} className="flex gap-3">
              {/* Icon */}
              <div
                className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm
                  ${dark ? "bg-slate-700" : "bg-slate-100"}
                  ${getActivityColor(activity.type)}
                `}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold ${
                    dark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {activity.message}
                </p>
                {activity.details && (
                  <p
                    className={`text-xs ${
                      dark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    {activity.details}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p
                    className={`text-xs ${
                      dark ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                  {activity.user && activity.user !== "System" && (
                    <p
                      className={`text-xs ${
                        dark ? "text-slate-500" : "text-slate-400"
                      }`}
                    >
                      by {activity.user}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`py-6 text-center text-sm ${
              dark ? "text-slate-400" : "text-slate-500"
            }`}
          >
            No activities to display
          </div>
        )}
      </div>
    </div>
  );
}

