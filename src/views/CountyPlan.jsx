import React from "react";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import MaineMap from "../components/MaineMap.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getCountyIntelligence } from "../utils/calculations.js";
import { currency, number, percent } from "../utils/formatters.js";
import { themeClasses } from "../utils/themeClasses.js";

export default function CountyPlan({ rows, selectedCounty, setSelectedCounty }) {
  const { dark } = useDarkMode();
  const selected = rows.find((row) => row.county === selectedCounty) || rows[0];
  const intel = getCountyIntelligence(selected.county, rows);

  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        {/* Map Card */}
        <Card title="Maine county map" eyebrow="Geographic view">
          <MaineMap rows={rows} selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} />
        </Card>

        {/* County Selection List */}
        <Card title="County launch queue" eyebrow="Prioritization">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {rows.map((row) => {
              const rowIntel = getCountyIntelligence(row.county, rows);
              const isSelected = selectedCounty === row.county;
              
              return (
                <button
                  key={row.county}
                  onClick={() => setSelectedCounty(row.county)}
                  className={themeClasses.listItem(dark, isSelected)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`font-bold text-sm ${dark ? "text-white" : "text-slate-950"}`}>
                        {row.county}
                      </p>
                      <p className={`text-xs mt-1 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        {row.service}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {rowIntel?.threat && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                          rowIntel.threat.score >= 50 
                            ? dark ? "bg-error-900/40 border-error-700/50 text-error-300" : "bg-error-100 border-error-300 text-error-700"
                            : rowIntel.threat.score >= 30
                            ? dark ? "bg-warning-900/40 border-warning-700/50 text-warning-300" : "bg-warning-100 border-warning-300 text-warning-700"
                            : dark ? "bg-success-900/40 border-success-700/50 text-success-300" : "bg-success-100 border-success-300 text-success-700"
                        }`}>
                          {rowIntel.threat.score}
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border ${
                        row.launchGroup.includes("1")
                          ? dark ? "bg-success-900/40 border-success-700/50 text-success-300" : "bg-success-100 border-success-300 text-success-700"
                          : row.launchGroup.includes("2")
                          ? dark ? "bg-info-900/40 border-info-700/50 text-info-300" : "bg-info-100 border-info-300 text-info-700"
                          : dark ? "bg-warning-900/40 border-warning-700/50 text-warning-300" : "bg-warning-100 border-warning-300 text-warning-700"
                      }`}>
                        Wave {row.launchGroup}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* County Details Panel */}
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
