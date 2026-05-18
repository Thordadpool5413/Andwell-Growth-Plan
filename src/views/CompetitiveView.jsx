import React, { useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { namedProviderRows, marketShareBuildRows, marketShareFormulaRows } from "../data/providers.js";
import { getProviderSummary } from "../utils/calculations.js";
import { currency, number, percent, badgeTone } from "../utils/formatters.js";

export default function CompetitiveView({ selectedCounty, setSelectedCounty }) {
  const [service, setService] = useState("Home Healthcare");
  const summary = getProviderSummary(service);
  const providers = namedProviderRows.filter((row) => row.service === service).sort((a, b) => b.beneficiaries - a.beneficiaries);
  const countyProviders = providers.filter((row) => row.locationCounty === selectedCounty);
  const chartRows = providers.slice(0, 10).map((provider) => ({ ...provider, sharePct: Number((provider.providerVolumeShare * 100).toFixed(1)) }));

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Competitive view" title="Named provider competitor layer">
        This section is built from the named Home Healthcare and Hospice provider rows in the uploaded code. It shows Andwell's provider file rank, provider file share, named competitors, and the limits of what can and cannot be called true county market share without county attributed volume.
      </SectionHeader>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={`${service} providers`} value={summary.providers} detail="Named Maine provider rows loaded." />
        <Metric label="Total beneficiaries" value={number(summary.beneficiaries)} detail="Provider file beneficiary volume." />
        <Metric label="Andwell rank" value={summary.andwellRank ? `#${summary.andwellRank}` : "N/A"} detail="Ranked by beneficiary volume in the provider file." />
        <Metric label="Andwell provider file share" value={percent(summary.andwellShare)} detail="Not county market share. This is provider file share." />
      </div>
      <div className="flex flex-wrap gap-2">
        {["Home Healthcare", "Hospice"].map((item) => (
          <button key={item} onClick={() => setService(item)} className={`rounded-full px-4 py-2 text-sm font-black transition ${service === item ? "bg-blue-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50"}`}>
            {item}
          </button>
        ))}
        {Object.keys(cmsCountyMarket).map((county) => (
          <button key={county} onClick={() => setSelectedCounty(county)} className={`rounded-full px-4 py-2 text-sm font-black transition ${selectedCounty === county ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
            {county}
          </button>
        ))}
      </div>
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card title={`Top ${service} providers`} eyebrow="Provider file share">
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartRows} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `${value}%`} />
                <YAxis type="category" dataKey="providerName" width={170} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value, name) => name === "sharePct" ? `${value}%` : number(value)} />
                <Bar dataKey="sharePct" name="Provider file share" radius={[0, 8, 8, 0]}>
                  {chartRows.map((row) => <Cell key={row.providerName} fill={row.isAndwellCmsRecord ? COLORS.blue : COLORS.slate} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title={`${selectedCounty} named providers`} eyebrow="County located providers">
          <div className="space-y-3">
            {countyProviders.length ? countyProviders.map((provider) => (
              <div key={`${provider.service}-${provider.providerName}`} className={`rounded-2xl border p-4 ${provider.isAndwellCmsRecord ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{provider.providerName}</p>
                    <p className="text-sm text-slate-500">{provider.service} located in {provider.locationCounty}</p>
                  </div>
                  {provider.isAndwellCmsRecord ? <Badge tone="blue">Andwell CMS record</Badge> : <Badge tone="slate">Competitor</Badge>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                  <div><p className="text-slate-500">Beneficiaries</p><p className="font-black">{number(provider.beneficiaries)}</p></div>
                  <div><p className="text-slate-500">Episodes</p><p className="font-black">{number(provider.episodes)}</p></div>
                  <div><p className="text-slate-500">Payment</p><p className="font-black">{currency(provider.payment)}</p></div>
                </div>
              </div>
            )) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                <p className="font-black">No named provider row located in {selectedCounty} for {service}.</p>
                <p className="mt-2 text-sm leading-6">This does not mean no provider serves the county. It means the uploaded provider file does not have a provider headquarters row located in that county for this selected service.</p>
              </div>
            )}
          </div>
        </Card>
      </section>
      <Card title="Market share build path" eyebrow="What is built versus what is still needed">
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Layer</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Current data</th>
                <th className="px-5 py-4">Limitation</th>
                <th className="px-5 py-4">Required for full picture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketShareBuildRows.map((row) => (
                <tr key={row.layer} className="align-top hover:bg-slate-50">
                  <td className="px-5 py-4 font-black">{row.layer}</td>
                  <td className="px-5 py-4"><Badge tone={badgeTone(row.status)}>{row.status}</Badge></td>
                  <td className="px-5 py-4 text-slate-700">{row.data}</td>
                  <td className="px-5 py-4 text-slate-600">{row.limitation}</td>
                  <td className="px-5 py-4 text-slate-600">{row.need}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Market share formulas" eyebrow="Formula transparency">
        <div className="grid gap-3 md:grid-cols-2">
          {marketShareFormulaRows.map((row) => (
            <div key={row.metric} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-black text-slate-950">{row.metric}</p>
                <Badge tone={row.state.includes("Built") ? "green" : "amber"}>{row.state}</Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{row.formula}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
