import React, { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend,
  XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import CustomTooltip from "../components/CustomTooltip.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { getStaffingModel } from "../utils/calculations.js";
import { currency, number } from "../utils/formatters.js";
import { useSortableTable, SortTh } from "../hooks/useSortableTable.jsx";

const YEAR_COLORS = {
  "Y1 FTE": COLORS.blue,
  "Y2 FTE": COLORS.amber,
  "Y3 FTE": COLORS.green,
};

export default function StaffingModel({ rows }) {
  const { dark } = useDarkMode();
  const model = useMemo(() => getStaffingModel(rows), [rows]);

  const serviceChartData = Object.entries(model.byService).map(([service, data]) => ({
    service,
    "Y1 FTE": data.y1.fte,
    "Y2 FTE": data.y2.fte,
    "Y3 FTE": data.y3.fte,
  }));

  const fteTableRows = useMemo(() =>
    Object.entries(model.byService).map(([service, data]) => ({
      service,
      role: data.role,
      patientsPerFTE: data.patientsPerFTE,
      avgSalary: data.avgSalary,
      y1fte: data.y1.fte,
      y2fte: data.y2.fte,
      y3fte: data.y3.fte,
      y1cost: data.y1.cost,
      y3cost: data.y3.cost,
      costPerStart: data.y1.costPerStart,
      _data: data,
    })),
  [model]);

  const { sorted: sortedFte, sortKey: fteSortKey, sortDir: fteSortDir, toggleSort: fteToggleSort } = useSortableTable(fteTableRows, "y1fte", "desc");

  const countyChartData = Object.entries(model.byCounty)
    .sort((a, b) => b[1].y3 - a[1].y3)
    .map(([county, data]) => ({
      county,
      "Y1 FTE": data.y1,
      "Y2 FTE": data.y2,
      "Y3 FTE": data.y3,
    }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Staffing model" icon="👥" title="FTE requirements and cost-to-serve analysis">
        Estimates the clinical headcount needed to meet Y1, Y2, Y3 start targets based on configurable patients-per-FTE ratios. Adjust scenario sliders to see staffing impact in real time.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Y1 total FTEs" value={model.totalFTE[0]} detail="Clinical staff needed for Year 1 starts." sparkData={model.totalFTE} sparkColor={COLORS.blue} color="blue" />
        <Metric label="Y3 total FTEs" value={model.totalFTE[2]} detail="Full ramp headcount by Year 3." color="emerald" />
        <Metric label="Y1 staffing cost" value={currency(model.totalCost[0])} detail="Total salary cost at Year 1 FTE levels." sparkData={model.totalCost} sparkColor={COLORS.red} color="amber" />
        <Metric label="3-year staffing cost" value={currency(model.totalCost.reduce((s, c) => s + c, 0))} detail="Cumulative salary investment across all years." color="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.entries(model.byService).map(([service, data]) => (
          <div key={service} className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
            <p className={`text-xs font-black uppercase tracking-wide mb-3 ${dark ? "text-blue-400" : "text-blue-700"}`}>{service}</p>
            <p className={`text-sm font-semibold mb-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{data.role}</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { year: "Y1", fte: data.y1.fte, color: "bg-blue-500" },
                { year: "Y2", fte: data.y2.fte, color: "bg-amber-500" },
                { year: "Y3", fte: data.y3.fte, color: "bg-emerald-500" },
              ].map(({ year, fte, color }) => (
                <div key={year} className={`rounded-xl p-3 text-center ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
                  <div className={`mx-auto mb-2 h-1 rounded-full ${color}`} style={{ width: `${Math.min((fte / Math.max(data.y3.fte, 1)) * 100, 100)}%` }} />
                  <p className={`text-lg font-black ${dark ? "text-white" : "text-slate-950"}`}>{fte}</p>
                  <p className={`text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>{year} <Abbr term="FTE">FTE</Abbr></p>
                </div>
              ))}
            </div>
            <div className={`mt-3 pt-3 border-t text-sm ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <div className="flex justify-between">
                <span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 cost</span>
                <span className={`font-black ${dark ? "text-red-400" : "text-red-600"}`}>{currency(data.y1.cost)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className={dark ? "text-slate-400" : "text-slate-500"}>Pts/<Abbr term="FTE">FTE</Abbr></span>
                <span className="font-black">{data.patientsPerFTE}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Card title="FTE breakdown by service line" eyebrow="Staffing detail — click column headers to sort">
        <p className={`mb-2 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Scroll right to see all columns →</p>
        <div className="relative">
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
          <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
            <table className="w-full text-left text-sm">
              <thead className={`sticky top-0 z-10 text-xs uppercase tracking-wide ${dark ? "bg-slate-700/90 text-slate-400 backdrop-blur" : "bg-slate-50 text-slate-500 shadow-sm"}`}>
                <tr>
                  <SortTh sortKey="service" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4">Service line</SortTh>
                  <th className="px-5 py-4">Role</th>
                  <SortTh sortKey="patientsPerFTE" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right" title="Patients per Full-Time Equivalent">Pts/<Abbr term="FTE">FTE</Abbr></SortTh>
                  <SortTh sortKey="avgSalary" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Avg salary</SortTh>
                  <SortTh sortKey="y1fte" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Y1 <Abbr term="FTE">FTE</Abbr></SortTh>
                  <SortTh sortKey="y2fte" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Y2 <Abbr term="FTE">FTE</Abbr></SortTh>
                  <SortTh sortKey="y3fte" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Y3 <Abbr term="FTE">FTE</Abbr></SortTh>
                  <SortTh sortKey="y1cost" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Y1 cost</SortTh>
                  <SortTh sortKey="y3cost" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Y3 cost</SortTh>
                  <SortTh sortKey="costPerStart" currentKey={fteSortKey} currentDir={fteSortDir} onSort={fteToggleSort} className="px-5 py-4 text-right">Cost/start</SortTh>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {sortedFte.map((row, i) => (
                  <tr key={row.service} className={dark ? i % 2 === 1 ? "bg-slate-800/60 hover:bg-slate-700/50" : "hover:bg-slate-700/50" : i % 2 === 1 ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{row.service}</td>
                    <td className={`px-5 py-4 ${dark ? "text-slate-300" : "text-slate-600"}`}>{row.role}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{row.patientsPerFTE}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.avgSalary)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{row.y1fte}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{row.y2fte}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{row.y3fte}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.y1cost)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.y3cost)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-amber-400" : "text-amber-600"}`}>{currency(row.costPerStart)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`text-xs font-black border-t-2 ${dark ? "border-slate-600 bg-slate-700/60 text-white" : "border-slate-300 bg-slate-100 text-slate-900"}`}>
                  <td className="px-5 py-3" colSpan={4}>Totals</td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-blue-400" : "text-blue-700"}`}>{sortedFte.reduce((s, r) => s + r.y1fte, 0)}</td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-slate-300" : ""}`}>{sortedFte.reduce((s, r) => s + r.y2fte, 0)}</td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{sortedFte.reduce((s, r) => s + r.y3fte, 0)}</td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-slate-300" : ""}`}>{currency(sortedFte.reduce((s, r) => s + r.y1cost, 0))}</td>
                  <td className={`px-5 py-3 text-right ${dark ? "text-slate-300" : ""}`}>{currency(sortedFte.reduce((s, r) => s + r.y3cost, 0))}</td>
                  <td className="px-5 py-3 text-right">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <p className={`mt-2 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>
          * <Abbr term="FTE">FTE</Abbr> = Full-Time Equivalent (40 hrs/week). Ratios represent modeled clinical capacity assumptions — actual caseloads vary by acuity, geography, and payer mix. Salary figures are planning estimates; validate against current Maine market rates before budgeting.
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="FTE ramp by service" eyebrow="Hiring trajectory">
          <ChartContainer height="h-80" title="Y1 → Y2 → Y3 FTE buildup" caption="Staffing ladder — each group shows Y1/Y2/Y3 FTE targets">
            <BarChart data={serviceChartData} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="service" tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }} />
              <YAxis
                tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                label={{ value: "FTEs", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
              />
              <CustomTooltip />
              <Legend />
              <Bar dataKey="Y1 FTE" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Y2 FTE" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Y3 FTE" fill={COLORS.green} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
        <Card title="FTE distribution by county" eyebrow="Geographic staffing">
          <ChartContainer height="h-80">
            <BarChart data={countyChartData} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
              <XAxis type="number" tick={{ fill: dark ? "#94a3b8" : "#475569" }} />
              <YAxis type="category" dataKey="county" width={100} tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }} />
              <CustomTooltip />
              <Legend />
              <Bar dataKey="Y1 FTE" fill={COLORS.blue} radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="Y2 FTE" fill={COLORS.amber} radius={[0, 4, 4, 0]} stackId="a" />
              <Bar dataKey="Y3 FTE" fill={COLORS.green} radius={[0, 4, 4, 0]} stackId="a" />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      <Card title="Staffing efficiency metrics" eyebrow="Cost intelligence">
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(model.byService).map(([service, data]) => {
            const y1Rev = rows.filter((r) => r.service === service).reduce((s, r) => s + r.revenue[0], 0);
            const roi = data.y1.cost > 0 ? ((y1Rev - data.y1.cost) / data.y1.cost * 100) : 0;
            return (
              <div key={service} className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{service}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 revenue</span>
                    <span className={`font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(y1Rev)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Y1 staff cost</span>
                    <span className={`font-black ${dark ? "text-red-400" : "text-red-600"}`}>{currency(data.y1.cost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Staff ROI</span>
                    <span className={`font-black ${roi > 0 ? "text-emerald-600" : "text-red-600"}`}>{roi > 0 ? "+" : ""}{Math.round(roi)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={dark ? "text-slate-400" : "text-slate-500"}>Cost per start</span>
                    <span className="font-black">{currency(data.y1.costPerStart)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
