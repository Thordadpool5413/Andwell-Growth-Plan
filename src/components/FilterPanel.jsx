import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { ChevronDown } from "lucide-react";

export default function FilterPanel({
  title,
  filters = [],
  onFilterChange,
  onReset,
  className = "",
}) {
  const { dark } = useDarkMode();
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleCheckboxChange = (groupId, optionId, checked) => {
    onFilterChange?.(groupId, optionId, checked);
  };

  return (
    <div
      className={`
        rounded-2xl border p-4 shadow-sm
        ${dark
          ? "border-slate-700 bg-slate-800"
          : "border-slate-200 bg-white"}
        ${className}
      `}
    >
      <h3 className={`text-sm font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}>
        {title}
      </h3>

      <div className="space-y-3">
        {filters.map((filterGroup) => (
          <div key={filterGroup.id}>
            <button
              onClick={() => toggleGroup(filterGroup.id)}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-lg
                transition-colors text-sm font-semibold
                ${dark
                  ? "hover:bg-slate-700 text-slate-200"
                  : "hover:bg-slate-100 text-slate-900"}
              `}
            >
              <span>{filterGroup.label}</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expandedGroups[filterGroup.id] ? "rotate-180" : ""
                }`}
              />
            </button>

            {expandedGroups[filterGroup.id] && (
              <div className="mt-2 ml-3 space-y-2">
                {filterGroup.options.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 cursor-pointer py-1"
                  >
                    <input
                      type="checkbox"
                      checked={option.checked || false}
                      onChange={(e) =>
                        handleCheckboxChange(
                          filterGroup.id,
                          option.id,
                          e.target.checked
                        )
                      }
                      className="rounded h-4 w-4"
                    />
                    <span
                      className={`text-sm ${
                        dark
                          ? "text-slate-300"
                          : "text-slate-700"
                      }`}
                    >
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span
                        className={`text-xs ${
                          dark
                            ? "text-slate-500"
                            : "text-slate-500"
                        }`}
                      >
                        ({option.count})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className={`
            w-full mt-4 px-3 py-2 rounded-lg text-sm font-semibold
            transition-colors
            ${dark
              ? "bg-slate-700 hover:bg-slate-600 text-slate-200"
              : "bg-slate-100 hover:bg-slate-200 text-slate-900"}
          `}
        >
          Reset filters
        </button>
      )}
    </div>
  );
}
