import React, { useState } from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { useScenarioStore } from "../store/scenarioStore.js";
import { currency, percent } from "../utils/formatters.js";

export default function ComparisonView({ buildRows, currentTotals, currentScenario }) {
  const { dark } = useDarkMode();
  const { scenarios, currentScenario: storedCurrent } = useScenarioStore();
  const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);

  const toggleScenario = (id) => {
    setSelectedScenarioIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const compareScenarios = () => {
    const selected = scenarios.filter((s) => selectedScenarioIds.includes(s.id));
    return {
      current: { name: "Current", data: currentScenario },
      selected: selected.map((s) => ({ name: s.name, data: s.data })),
    };
  };

  const comparison = compareScenarios();
  const allScenarios = [
    { name: "Current", data: currentScenario },
    ...comparison.selected,
  ];

  return (
    <div className="space-y-6">
      <Card title="Select scenarios to compare" eyebrow="Comparison setup">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => toggleScenario(scenario.id)}
              className={`
                rounded-lg border p-3 text-left transition-colors
                ${
                  selectedScenarioIds.includes(scenario.id)
                    ? dark
                      ? "border-blue-500 bg-blue-950/50"
                      : "border-blue-500 bg-blue-50"
                    : dark
                      ? "border-slate-600 bg-slate-700 hover:border-slate-500"
                      : "border-slate-300 bg-white hover:border-slate-400"
                }
              `}
            >
              <p className={`font-semibold text-sm ${dark ? "text-white" : "text-slate-900"}`}>
                {scenario.name}
              </p>
              <p className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                {scenario.description}
              </p>
              <input
                type="checkbox"
                checked={selectedScenarioIds.includes(scenario.id)}
                onChange={() => {}}
                className="mt-2"
              />
            </button>
          ))}
        </div>
      </Card>

      {allScenarios.length > 1 && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {allScenarios.map((scenario, idx) => (
              <Metric
                key={idx}
                label={scenario.name}
                value={scenario.data.conversionRate ? `${(scenario.data.conversionRate * 100).toFixed(0)}%` : "N/A"}
                detail="Conversion rate"
              />
            ))}
          </div>

          <Card title="Scenario metrics comparison" eyebrow="Side-by-side analysis">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                    <th className="text-left px-4 py-2 font-semibold">Metric</th>
                    {allScenarios.map((s, idx) => (
                      <th key={idx} className="text-right px-4 py-2 font-semibold">
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                    <td className="px-4 py-2 font-semibold">Conversion Rate</td>
                    {allScenarios.map((s, idx) => (
                      <td key={idx} className="text-right px-4 py-2">
                        {percent(s.data.conversionRate || 0)}
                      </td>
                    ))}
                  </tr>
                  <tr className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                    <td className="px-4 py-2 font-semibold">HH Y1 Capture</td>
                    {allScenarios.map((s, idx) => (
                      <td key={idx} className="text-right px-4 py-2">
                        {percent(s.data.hhCapture?.[0] || 0)}
                      </td>
                    ))}
                  </tr>
                  <tr className={dark ? "border-b border-slate-700" : "border-b border-slate-200"}>
                    <td className="px-4 py-2 font-semibold">Wound Y1 Capture</td>
                    {allScenarios.map((s, idx) => (
                      <td key={idx} className="text-right px-4 py-2">
                        {percent(s.data.woundCapture?.[0] || 0)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-semibold">Therapy Y1 Capture</td>
                    {allScenarios.map((s, idx) => (
                      <td key={idx} className="text-right px-4 py-2">
                        {percent(s.data.therapyCapture?.[0] || 0)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Key differences" eyebrow="Variance analysis">
            <div className="space-y-2">
              {allScenarios.length === 2 && (
                <>
                  {Math.abs(
                    (allScenarios[1].data.conversionRate || 0) -
                      (allScenarios[0].data.conversionRate || 0)
                  ) > 0.05 && (
                    <div
                      className={`p-3 rounded-lg ${
                        dark
                          ? "bg-amber-950/30 text-amber-200"
                          : "bg-amber-50 text-amber-900"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        Conversion rate differs by{" "}
                        {(
                          Math.abs(
                            (allScenarios[1].data.conversionRate || 0) -
                              (allScenarios[0].data.conversionRate || 0)
                          ) * 100
                        ).toFixed(1)}
                        %
                      </p>
                    </div>
                  )}
                  <p
                    className={`text-sm ${
                      dark ? "text-slate-400" : "text-slate-600"
                    }`}
                  >
                    Compare your scenarios to identify which assumptions drive the
                    biggest revenue impact.
                  </p>
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {allScenarios.length === 1 && (
        <div
          className={`rounded-lg border p-6 text-center ${
            dark
              ? "border-slate-700 bg-slate-800"
              : "border-slate-200 bg-slate-50"
          }`}
        >
          <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Select at least one scenario to compare with the current scenario
          </p>
        </div>
      )}
    </div>
  );
}
