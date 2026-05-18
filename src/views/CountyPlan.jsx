import React from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import MaineMap from "../components/MaineMap.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getCountyIntelligence } from "../utils/calculations.js";
import { currency, number, percent } from "../utils/formatters.js";

export default function CountyPlan({ rows, selectedCounty, setSelectedCounty }) {
  const { dark } = useDarkMode();
  const selected = rows.find((row) => row.county === selectedCounty) || rows[0];
  const intel = getCountyIntelligence(selected.county, rows);

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card title="Maine county map" eyebrow="Geographic view">
          <MaineMap rows={rows} selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} />
        </Card>
        <Card title="County launch queue" eyebrow="Prioritization">
          <div className="space-y-3">
            {rows.map((row) => {
              const rowIntel = getCountyIntelligence(row.county, rows);
              return (
                <button
                  key={row.county}
                  onClick={() => setSelectedCounty(row.county)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedCounty === row.county
                      ? dark ? "border-blue-500 bg-blue-950/50" : "border-blue-500 bg-blue-50"
                      : dark ? "border-slate-700 bg-slate-800 hover:border-blue-600" : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{row.county}</p>
                      <ServiceBadge service={row.service} />
                    </div>
                    <div className="flex items-center gap-2">
                      {rowIntel?.threat && (
                        <Badge tone={rowIntel.threat.score >= 50 ? "red" : rowIntel.threat.score >= 30 ? "amber" : "green"}>
                          Threat {rowIntel.threat.score}
                        </Badge>
                      )}
                      <Badge tone={row.launchGroup.includes("1") ? "green" : row.launchGroup.includes("2") ? "blue" : "amber"}>
                        {row.launchGroup}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
      <div className="space-y-6">
        <Card title={`${selected.county} County`} eyebrow="County detail">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric
              label="Year 1 goal"
              value={number(selected.starts[0])}
              detail={selected.meta.unit}
              sparkData={selected.starts}
              sparkColor="#2563eb"
            />
            <Metric
              label="Year 1 referrals"
              value={number(selected.referrals[0])}
              detail="At 75 percent modeled conversion."
              sparkData={selected.referrals}
              sparkColor="#f59e0b"
            />
            <Metric
              label="Year 1 revenue"
              value={currency(selected.revenue[0])}
              detail={selected.basis}
              sparkData={selected.revenue}
              sparkColor="#16a34a"
            />
          </div>
          <div className="mt-5 space-y-4">
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Why this county</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.reason}</p>
            </div>
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Current Andwell presence</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.current}</p>
            </div>
            <div className={`rounded-2xl p-4 ${dark ? "bg-slate-700/50" : "bg-slate-50"}`}>
              <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>Missing service lines</p>
              <p className={`mt-2 leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{selected.missing}</p>
            </div>
            <div className="grid gap-2">
              {selected.accounts.map((account) => (
                <div key={account} className={`rounded-xl border px-4 py-3 text-sm font-semibold ${dark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-200 bg-white text-slate-700"}`}>
                  {account}
                </div>
              ))}
            </div>
          </div>
        </Card>

        {intel && (
          <Card title="County intelligence" eyebrow="Smart analytics">
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Competitive threat</p>
                <div className="mt-2 flex items-center gap-2">
                  <p className={`text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{intel.threat?.score ?? "—"}/100</p>
                  {intel.threat && (
                    <Badge tone={intel.threat.level === "Fortress" ? "red" : intel.threat.level === "High" ? "amber" : intel.threat.level === "Moderate" ? "blue" : "green"}>
                      {intel.threat.level}
                    </Badge>
                  )}
                </div>
                {intel.threat?.hasNationalChain && (
                  <p className={`mt-1 text-xs font-semibold ${dark ? "text-red-400" : "text-red-600"}`}>National chain present</p>
                )}
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Market penetration</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
                  {intel.penetration ? percent(intel.penetration.y1Penetration) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>
                  Y3 target: {intel.penetration ? percent(intel.penetration.y3Penetration) : "—"}
                </p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>HH provider density</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{intel.providerDensityHH}</p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Providers per 10K FFS beneficiaries</p>
              </div>
              <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-100 bg-slate-50"}`}>
                <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>Revenue per beneficiary</p>
                <p className={`mt-2 text-2xl font-black ${dark ? "text-white" : "text-slate-950"}`}>
                  {intel.penetration ? currency(intel.penetration.revenuePerBeneficiary) : "—"}
                </p>
                <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Y1 revenue / {number(intel.ffs)} FFS</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </section>
  );
}
