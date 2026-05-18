import React from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import MaineMap from "../components/MaineMap.jsx";
import { currency, number } from "../utils/formatters.js";

export default function CountyPlan({ rows, selectedCounty, setSelectedCounty }) {
  const selected = rows.find((row) => row.county === selectedCounty) || rows[0];
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card title="Maine county map" eyebrow="Geographic view">
          <MaineMap rows={rows} selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} />
        </Card>
        <Card title="County launch queue" eyebrow="Prioritization">
          <div className="space-y-3">
            {rows.map((row) => (
              <button
                key={row.county}
                onClick={() => setSelectedCounty(row.county)}
                className={`w-full rounded-2xl border p-4 text-left transition ${selectedCounty === row.county ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-300"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-slate-950">{row.county}</p>
                    <ServiceBadge service={row.service} />
                  </div>
                  <Badge tone={row.launchGroup.includes("1") ? "green" : row.launchGroup.includes("2") ? "blue" : "amber"}>
                    {row.launchGroup}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
      <Card title={`${selected.county} County`} eyebrow="County detail">
        <div className="grid gap-4 md:grid-cols-3">
          <Metric label="Year 1 goal" value={number(selected.starts[0])} detail={selected.meta.unit} />
          <Metric label="Year 1 referrals" value={number(selected.referrals[0])} detail="At 75 percent modeled conversion." />
          <Metric label="Year 1 revenue" value={currency(selected.revenue[0])} detail={selected.basis} />
        </div>
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Why this county</p>
            <p className="mt-2 leading-7 text-slate-700">{selected.reason}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Current Andwell presence</p>
            <p className="mt-2 leading-7 text-slate-700">{selected.current}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="font-black text-slate-950">Missing service lines</p>
            <p className="mt-2 leading-7 text-slate-700">{selected.missing}</p>
          </div>
          <div className="grid gap-2">
            {selected.accounts.map((account) => (
              <div key={account} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
                {account}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
}
