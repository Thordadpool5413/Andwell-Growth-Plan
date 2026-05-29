import React from "react";
import Card from "../components/Card.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SourceBadge from "../components/SourceBadge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { number } from "../utils/formatters.js";
import { exportReferralCSV } from "../utils/csvExport.js";

export default function ReferralPlan({ rows }) {
  const { dark } = useDarkMode();
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Referral plan" title="Required referrals by county and service line">
        Referral requirements are derived from patient start goals using a 75% <Abbr term="Conversion Rate">conversion</Abbr> baseline (industry median: 72–78% per <Abbr term="NAHC">NAHC</Abbr> 2023). For every 100 referrals, ~75 are expected to convert to patient starts. Adjust the Scenario Model to see how different conversion rates affect the referral load.
      </SectionHeader>
      <Card title="Referral requirements by county" eyebrow="Referral plan">
      <div className="mb-4 flex items-center justify-between">
        <p className={`text-xs font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>Scroll right to see all years →</p>
        <button
          onClick={() => exportReferralCSV(rows)}
          className={`rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
        >
          Export CSV
        </button>
      </div>
      <div className="relative">
        <div className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 rounded-r-2xl bg-gradient-to-l ${dark ? "from-slate-800/90" : "from-white/90"}`} />
      <div className={`relative overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
        <table className={`w-full min-w-[1050px] text-left text-sm ${dark ? "border-slate-700" : ""}`}>
          <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-5 py-4">County</th>
              <th className="px-5 py-4">Source</th>
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4 text-right">Year 1 goal</th>
              <th className="px-5 py-4 text-right">Year 1 referrals</th>
              <th className="px-5 py-4 text-right">Year 2 goal</th>
              <th className="px-5 py-4 text-right">Year 2 referrals</th>
              <th className="px-5 py-4 text-right">Year 3 goal</th>
              <th className="px-5 py-4 text-right">Year 3 referrals</th>
              <th className="px-5 py-4 text-right">Y1→Y3 growth</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
            {rows.map((row) => {
              const growth = row.starts[0] > 0 ? ((row.starts[2] - row.starts[0]) / row.starts[0]) * 100 : 0;
              return (
                <tr key={row.county} className={dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}>
                  <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{row.county}</td>
                  <td className="px-5 py-4"><SourceBadge basis={row.basis} /></td>
                  <td className="px-5 py-4"><ServiceBadge service={row.service} /></td>
                  <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.starts[0])}</td>
                  <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[0])}</td>
                  <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.starts[1])}</td>
                  <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[1])}</td>
                  <td className={`px-5 py-4 text-right ${dark ? "text-slate-300" : ""}`}>{number(row.starts[2])}</td>
                  <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[2])}</td>
                  <td className={`px-5 py-4 text-right font-black ${growth > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                    {growth > 0 ? `+${Math.round(growth)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </Card>
    </div>
  );
}
