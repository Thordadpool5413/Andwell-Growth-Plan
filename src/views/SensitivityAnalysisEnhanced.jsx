import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS, SENSITIVITY_VARIABLES } from "../data/constants.js";
import { currency } from "../utils/formatters.js";

export default function SensitivityAnalysis({ totals, scenario }) {
  const { dark } = useDarkMode();
  const [selectedVariable, setSelectedVariable] = useState(SENSITIVITY_VARIABLES[0].key);

  const variable = SENSITIVITY_VARIABLES.find((v) => v.key === selectedVariable);

  const generateTornadoData = () => {
    return SENSITIVITY_VARIABLES.slice(0, 5).map((v) => {
      const baseValue = totals.y1Revenue;
      // Simplified tornado calculation
      const lowImpact = baseValue * 0.9;
      const highImpact = baseValue * 1.1;
      return {
        name: v.label,
        low: lowImpact,
        high: highImpact,
        range: highImpact - lowImpact,
      };
    });
  };

  const generateSensitivityCurve = () => {
    if (!variable) return [];
    const points = [];
    const steps = 11;
    const range = variable.high - variable.low;

    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const value = variable.low + range * ratio;
      const impact = value / variable.base;
      points.push({
        name: (value * 100).toFixed(0) + "%",
        revenue: totals.y1Revenue * impact,
        value,
      });
    }

    return points;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Metric
          label="Base Year 1 Revenue"
          value={currency(totals.y1Revenue)}
          detail="Your current scenario revenue"
        />
        <Metric
          label="Best Case (+10%)"
          value={currency(totals.y1Revenue * 1.1)}
          detail="If variables move favorably"
          confidence="high"
        />
        <Metric
          label="Worst Case (-10%)"
          value={currency(totals.y1Revenue * 0.9)}
          detail="If variables move unfavorably"
          confidence="low"
        />
      </div>

      <Card title="Revenue sensitivity tornado" eyebrow="Impact analysis">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={generateTornadoData()} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis type="number" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: dark ? "#94a3b8" : "#475569" }} />
              <Tooltip
                formatter={(value) => currency(value)}
                contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined}
              />
              <Bar dataKey="low" name="Low" fill={COLORS.red} stackId="range" />
              <Bar dataKey="high" name="High" fill={COLORS.green} stackId="range" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Variable selector" eyebrow="One-way analysis">
          <div className="space-y-2">
            {SENSITIVITY_VARIABLES.map((v) => (
              <button
                key={v.key}
                onClick={() => setSelectedVariable(v.key)}
                className={`
                  w-full text-left px-4 py-2 rounded-lg border transition-colors
                  ${
                    selectedVariable === v.key
                      ? dark
                        ? "border-blue-500 bg-blue-950/50 text-blue-300"
                        : "border-blue-500 bg-blue-50 text-blue-900"
                      : dark
                        ? "border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-650"
                        : "border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
                  }
                `}
              >
                <p className="font-semibold text-sm">{v.label}</p>
                <p className="text-xs opacity-75">{v.format === "percent" ? `${(v.base * 100).toFixed(1)}%` : `${v.base}`}</p>
              </button>
            ))}
          </div>
        </Card>

        <Card title="Single variable sensitivity" eyebrow={variable?.label}>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={generateSensitivityCurve()}>
                <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: dark ? "#94a3b8" : "#475569" }} />
                <YAxis tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
                <Tooltip
                  formatter={(value) => currency(value)}
                  contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined}
                />
                <Line type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card title="Two-way sensitivity table" eyebrow="Conversion rate vs HH Capture">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                <th className="text-left px-4 py-2 font-semibold">Conversion →</th>
                {[0.55, 0.65, 0.75, 0.85, 0.95].map((cr) => (
                  <th key={cr} className="text-right px-4 py-2 font-semibold">
                    {(cr * 100).toFixed(0)}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[0.05, 0.10, 0.15, 0.20].map((hh) => (
                <tr key={hh} className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                  <td className="px-4 py-2 font-semibold">{(hh * 100).toFixed(0)}%</td>
                  {[0.55, 0.65, 0.75, 0.85, 0.95].map((cr) => (
                    <td key={`${hh}-${cr}`} className="text-right px-4 py-2">
                      <div className={`
                        rounded px-2 py-1 text-xs font-semibold
                        ${dark ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-900"}
                      `}>
                        {currency((totals.y1Revenue * (cr / 0.75) * (hh / 0.1)))}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
