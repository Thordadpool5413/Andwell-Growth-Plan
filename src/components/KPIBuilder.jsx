import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import { GripVertical, Plus, X, Save } from "lucide-react";

const defaultKPIs = [
  { id: "revenue_y1", label: "Year 1 Revenue", category: "Financial", type: "currency" },
  { id: "revenue_y2", label: "Year 2 Revenue", category: "Financial", type: "currency" },
  { id: "revenue_y3", label: "Year 3 Revenue", category: "Financial", type: "currency" },
  { id: "referrals_y1", label: "Year 1 Referrals", category: "Growth", type: "number" },
  { id: "referrals_y2", label: "Year 2 Referrals", category: "Growth", type: "number" },
  { id: "starts_y1", label: "Year 1 Patient Starts", category: "Operations", type: "number" },
  { id: "contribution", label: "Total Contribution", category: "Financial", type: "currency" },
  { id: "growth_rate", label: "Growth Rate", category: "Analytics", type: "percent" },
];

export function KPIBuilder({
  selectedKPIs = ["revenue_y1", "revenue_y2", "revenue_y3"],
  onSave = () => {},
  onCancel = () => {},
  className = "",
}) {
  const { dark } = useDarkMode();
  const [kpis, setKpis] = useState(selectedKPIs);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [viewName, setViewName] = useState("Custom Dashboard");

  const availableKPIs = defaultKPIs.filter((kpi) => !kpis.includes(kpi.id));

  const handleDragStart = (index) => setDraggedIndex(index);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (targetIndex) => {
    if (draggedIndex === null) return;
    const newKpis = [...kpis];
    const [dragged] = newKpis.splice(draggedIndex, 1);
    newKpis.splice(targetIndex, 0, dragged);
    setKpis(newKpis);
    setDraggedIndex(null);
  };

  const handleRemoveKPI = (id) => {
    setKpis(kpis.filter((k) => k !== id));
  };

  const handleAddKPI = (id) => {
    setKpis([...kpis, id]);
  };

  return (
    <div className={`
      rounded-2xl border shadow-elevation-3 p-6 max-w-4xl
      ${dark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}
      ${className}
    `}>
      <div className="mb-6">
        <label className={`block text-sm font-semibold mb-2 ${dark ? "text-slate-300" : "text-slate-700"}`}>
          Dashboard Name
        </label>
        <input
          type="text"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
          className={`
            w-full px-4 py-2 rounded-lg border font-medium transition-colors
            ${dark
              ? "bg-slate-700 border-slate-600 text-white focus:border-blue-500"
              : "bg-white border-slate-300 text-slate-900 focus:border-blue-500"
            }
          `}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Selected KPIs */}
        <div className="md:col-span-2">
          <h3 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}>
            Selected KPIs ({kpis.length})
          </h3>

          <div className={`
            rounded-xl border p-4 space-y-2 min-h-64 max-h-96 overflow-y-auto
            ${dark ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}
          `}>
            {kpis.length === 0 ? (
              <p className={`text-center py-8 text-sm ${dark ? "text-slate-500" : "text-slate-500"}`}>
                No KPIs selected. Add some from the right panel.
              </p>
            ) : (
              kpis.map((kpiId, idx) => {
                const kpi = defaultKPIs.find((k) => k.id === kpiId);
                return (
                  <div
                    key={kpiId}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(idx)}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg cursor-move transition-colors
                      ${dark ? "bg-slate-800 hover:bg-slate-700 border border-slate-600" : "bg-white hover:bg-slate-100 border border-slate-200"}
                    `}
                  >
                    <GripVertical className="h-4 w-4 text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${dark ? "text-white" : "text-slate-900"}`}>
                        {kpi?.label}
                      </p>
                      <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        {kpi?.category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveKPI(kpiId)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        dark ? "hover:bg-red-900/30 text-red-400" : "hover:bg-red-100 text-red-600"
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Available KPIs */}
        <div>
          <h3 className={`text-lg font-bold mb-4 ${dark ? "text-white" : "text-slate-900"}`}>
            Available KPIs
          </h3>

          <div className={`
            rounded-xl border p-4 space-y-2 max-h-96 overflow-y-auto
            ${dark ? "bg-slate-700/50 border-slate-600" : "bg-slate-50 border-slate-200"}
          `}>
            {availableKPIs.map((kpi) => (
              <button
                key={kpi.id}
                onClick={() => handleAddKPI(kpi.id)}
                className={`
                  w-full text-left flex items-center gap-2 p-3 rounded-lg transition-colors text-sm
                  ${dark ? "bg-slate-800 hover:bg-blue-900/30 border border-slate-600" : "bg-white hover:bg-blue-50 border border-slate-200"}
                `}
              >
                <Plus className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className={`font-medium text-xs ${dark ? "text-white" : "text-slate-900"}`}>
                    {kpi.label}
                  </p>
                  <p className={`text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>
                    {kpi.category}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
          Configure your dashboard layout
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className={`
              px-4 py-2 rounded-lg font-semibold transition-colors
              ${dark
                ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }
            `}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ name: viewName, kpis })}
            className={`
              px-4 py-2 rounded-lg font-semibold text-white transition-colors flex items-center gap-2
              bg-blue-600 hover:bg-blue-700
            `}
          >
            <Save className="h-4 w-4" />
            Save View
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPreset({
  name,
  description,
  icon,
  kpis,
  selected = false,
  onSelect = () => {},
  className = "",
}) {
  const { dark } = useDarkMode();

  return (
    <button
      onClick={onSelect}
      className={`
        text-left p-6 rounded-2xl border transition-all duration-200
        ${selected
          ? dark ? "bg-blue-900 border-blue-700 shadow-elevation-3" : "bg-blue-50 border-blue-300 shadow-elevation-2"
          : dark ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-white border-slate-200 hover:border-slate-300"
        }
        ${className}
      `}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{icon}</span>
        {selected && (
          <div className="ml-auto w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
        )}
      </div>
      <h4 className={`font-bold mb-1 ${dark ? "text-white" : "text-slate-900"}`}>
        {name}
      </h4>
      <p className={`text-sm mb-3 ${dark ? "text-slate-400" : "text-slate-600"}`}>
        {description}
      </p>
      <div className={`text-xs font-semibold ${selected ? "text-blue-600" : dark ? "text-slate-500" : "text-slate-600"}`}>
        {kpis.length} KPIs
      </div>
    </button>
  );
}
