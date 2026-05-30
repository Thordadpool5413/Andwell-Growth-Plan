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

      <Card title="FTE breakdown by service line" eyebrow="Staffing detail">
        <p className={`mb-2 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>Scroll right to see all columns →</p>
        <div className="relative">
          <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
          <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className="px-5 py-4">Service line</th>
                  <th className="px-5 py-4">Role</th>
                  <th className="px-5 py-4 text-right" title="Patients per Full-Time Equivalent — how many active patients one staff member is assumed to carry simultaneously">Pts/<Abbr term="FTE">FTE</Abbr></th>
                  <th className="px-5 py-4 text-right">Avg salary</th>
                  <th className="px-5 py-4 text-right">Y1 <Abbr term="FTE">FTE</Abbr></th>
                  <th className="px-5 py-4 text-right">Y2 <Abbr term="FTE">FTE</Abbr></th>
                  <th className="px-5 py-4 text-right">Y3 <Abbr term="FTE">FTE</Abbr></th>
                  <th className="px-5 py-4 text-right">Y1 cost</th>
                  <th className="px-5 py-4 text-right">Y3 cost</th>
                  <th className="px-5 py-4 text-right">Cost/start</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {Object.entries(model.byService).map(([service, data], i) => (
                  <tr key={service} className={dark ? i % 2 === 1 ? "bg-slate-800/60 hover:bg-slate-700/50" : "hover:bg-slate-700/50" : i % 2 === 1 ? "bg-slate-50/50 hover:bg-slate-50" : "hover:bg-slate-50"}>
                    <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{service}</td>
                    <td className={`px-5 py-4 ${dark ? "text-slate-300" : "text-slate-600"}`}>{data.role}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{data.patientsPerFTE}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(data.avgSalary)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{data.y1.fte}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{data.y2.fte}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-emerald-400" : "text-emerald-600"}`}>{data.y3.fte}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(data.y1.cost)}</td>
                    <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(data.y3.cost)}</td>
                    <td className={`px-5 py-4 text-right font-black ${dark ? "text-amber-400" : "text-amber-600"}`}>{currency(data.y1.costPerStart)}</td>
                  </tr>
                ))}
              </tbody>
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
