import React, { useState } from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line,
  Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { number, currency } from "../utils/formatters.js";
import { exportCmsCSV } from "../utils/csvExport.js";
import CmsDataPanel from "../components/CmsDataPanel.jsx";

export default function CmsData() {
  const { dark } = useDarkMode();
  const [activeTab, setActiveTab] = useState("market");
  const rows = Object.entries(cmsCountyMarket)
    .map(([county, market]) => ({
      county,
      ...market,
      providerDensity: Math.round((market.hh.prov / (market.ffs / 10000)) * 10) / 10,
      revenuePerUser: Math.round(market.hh.pay / market.hh.users),
    }))
    .sort((a, b) => b.ffs - a.ffs);

  const totalHHPay = rows.reduce((sum, row) => sum + row.hh.pay, 0);

  const tabs = [
    { id: "market", label: "CMS 2022 PUF Market Data" },
    { id: "catalog", label: "CMS Data Connection" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="CMS data" title="County-level Medicare market data + live catalog">
        Market data from the CMS 2022 Home Health and Hospice <Abbr term="PUF">Public Use File (PUF)</Abbr>. The CMS Data Connection tab links to the live CMS Provider Data Catalog API for real-time competitor verification and quality benchmarks.
      </SectionHeader>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-5 py-2 text-sm font-black transition ${activeTab === t.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "market" && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="CMS counties loaded" value={rows.length} detail="County market rows from CMS 2022 PUF included in this model." />
            <Metric label="HH users" value={number(rows.reduce((sum, row) => sum + row.hh.users, 0))} detail="Medicare home health users across all loaded counties." />
            <Metric label="Hospice users" value={number(rows.reduce((sum, row) => sum + row.hos.users, 0))} detail="Medicare hospice users across all loaded counties." />
            <Metric label="Total HH payments" value={currency(totalHHPay)} detail="Aggregate Medicare home health payments across all counties." />
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => exportCmsCSV(cmsCountyMarket)}
              className={`rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
            >
              Export CSV
            </button>
          </div>

          <Card title="HH users vs. Hospice users by county" eyebrow="CMS 2022 PUF — beneficiary volumes">
            <ChartContainer height="h-96">
                <ComposedChart data={rows} margin={{ left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis
                    dataKey="county"
                    tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }}
                    label={{ value: "County", position: "insideBottom", offset: -12, fontSize: 11, fill: dark ? "#64748b" : "#94a3b8" }}
                  />
                  <YAxis
                    tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                    label={{ value: "Beneficiary users", angle: -90, position: "insideLeft", offset: -8, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                  />
                  <Tooltip contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                  <Legend />
                  <Bar dataKey="hh.users" name="HH users" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="hos.users" name="Hospice users" stroke="#9333ea" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
            </ChartContainer>
          </Card>

          <Card title="Provider density and revenue efficiency" eyebrow="Market intelligence">
            <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <table className="w-full text-left text-sm">
                <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  <tr>
                    <th className="px-5 py-4">County</th>
                    <th className="px-5 py-4 text-right"><Abbr term="FFS">FFS</Abbr> beneficiaries</th>
                    <th className="px-5 py-4 text-right"><Abbr term="HH">HH</Abbr> providers</th>
                    <th className="px-5 py-4 text-right">Provider density</th>
                    <th className="px-5 py-4 text-right"><Abbr term="HH">HH</Abbr> utilization</th>
                    <th className="px-5 py-4 text-right">Revenue per user</th>
                    <th className="px-5 py-4 text-right">Total <Abbr term="HH">HH</Abbr> payment</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                  {rows.map((row) => (
                    <tr key={row.county} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                      <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{row.county}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.ffs)}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{row.hh.prov}</td>
                      <td className={`px-5 py-4 text-right font-black ${row.providerDensity > 3 ? "text-amber-600" : dark ? "text-emerald-400" : "text-emerald-600"}`}>{row.providerDensity}/10K</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{(row.hh.rate * 100).toFixed(1)}%</td>
                      <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(row.revenuePerUser)}</td>
                      <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{currency(row.hh.pay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {activeTab === "catalog" && <CmsDataPanel />}
    </div>
  );
}
