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

  const totalY1Referrals = rows.reduce((s, r) => s + r.referrals[0], 0);
  const totalY1Starts = rows.reduce((s, r) => s + r.starts[0], 0);

  return (
    <Card title="Referral requirements by county" eyebrow="Referral plan">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => exportReferralCSV(rows)}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition-all duration-200 ${dark ? "bg-gradient-to-r from-emerald-900/60 to-emerald-800/60 text-emerald-300 hover:from-emerald-900/80 hover:to-emerald-800/80 border border-emerald-700/50" : "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200"}`}
        >
          ↓ Export CSV
        </button>
      </div>
      <div className={`overflow-x-auto rounded-lg border shadow-md ${dark ? "border-slate-700/50 bg-slate-800/30" : "border-slate-200/50 bg-white/50"}`}>
        <table className={`w-full min-w-[1050px] text-sm ${dark ? "border-slate-700" : ""}`}>
          <thead className={`text-xs uppercase tracking-wider font-bold ${dark ? "bg-gradient-to-r from-slate-800/60 to-slate-700/60 text-slate-300 border-b border-slate-700/50" : "bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 border-b border-slate-200/50"}`}>
            <tr>
              <th className="px-5 py-4 text-left">County</th>
              <th className="px-5 py-4 text-left">Service</th>
              <th className="px-5 py-4 text-right">Y1 Goal</th>
              <th className="px-5 py-4 text-right">Y1 Referrals</th>
              <th className="px-5 py-4 text-right">Y2 Goal</th>
              <th className="px-5 py-4 text-right">Y2 Referrals</th>
              <th className="px-5 py-4 text-right">Y3 Goal</th>
              <th className="px-5 py-4 text-right">Y3 Referrals</th>
              <th className="px-5 py-4 text-right">Growth</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${dark ? "divide-slate-700/30" : "divide-slate-100/50"}`}>
            {rows.map((row, idx) => {
              const growth = row.starts[0] > 0 ? ((row.starts[2] - row.starts[0]) / row.starts[0]) * 100 : 0;
              return (
                <tr 
                  key={row.county} 
                  className={`transition-colors ${dark ? "hover:bg-slate-700/40" : "hover:bg-slate-50/80"} ${idx % 2 === 0 ? dark ? "bg-slate-800/20" : "bg-slate-50/30" : ""}`}
                >
                  <td className={`px-5 py-4 font-bold ${dark ? "text-white" : "text-slate-950"}`}>{row.county}</td>
                  <td className="px-5 py-4"><ServiceBadge service={row.service} /></td>
                  <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-700"}`}>{number(row.starts[0])}</td>
                  <td className={`px-5 py-4 text-right font-bold tabular-nums bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded px-2 ${dark ? "text-blue-300" : "text-blue-700"}`}>{number(row.referrals[0])}</td>
                  <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-700"}`}>{number(row.starts[1])}</td>
                  <td className={`px-5 py-4 text-right font-bold tabular-nums bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded px-2 ${dark ? "text-blue-300" : "text-blue-700"}`}>{number(row.referrals[1])}</td>
                  <td className={`px-5 py-4 text-right tabular-nums ${dark ? "text-slate-300" : "text-slate-700"}`}>{number(row.starts[2])}</td>
                  <td className={`px-5 py-4 text-right font-bold tabular-nums bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded px-2 ${dark ? "text-blue-300" : "text-blue-700"}`}>{number(row.referrals[2])}</td>
                  <td className={`px-5 py-4 text-right font-bold tabular-nums ${growth > 15 ? dark ? "text-success-300" : "text-success-700" : growth > 0 ? dark ? "text-info-300" : "text-info-700" : dark ? "text-slate-400" : "text-slate-600"}`}>
                    {growth > 0 ? `↑ ${Math.round(growth)}%` : "—"}
                  </td>
    <div className="space-y-6">
      <SectionHeader eyebrow="Referral plan" icon="📋" title="Required referrals by county and service line">
        Referral requirements are derived from patient start goals using a 75% <Abbr term="Conversion Rate">conversion</Abbr> baseline (industry median: 72–78% per <Abbr term="NAHC">NAHC</Abbr> 2023). For every 100 referrals, ~75 are expected to convert to patient starts. Adjust the Scenario Model to see how different conversion rates affect the referral load.
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={`rounded-2xl border-l-4 border-l-blue-500 border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-700"}`}>Gross referrals needed</p>
          <p className={`mt-2 text-5xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{number(totalY1Referrals)}</p>
          <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Year 1 gross referral target across all counties</p>
        </div>
        <div className={`rounded-2xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <p className={`text-xs font-black uppercase tracking-wide ${dark ? "text-emerald-400" : "text-emerald-700"}`}>Net patient starts</p>
          <p className={`mt-2 text-5xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{number(totalY1Starts)}</p>
          <p className={`mt-1 text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>Year 1 net starts after 75% conversion (NAHC median)</p>
        </div>
      </div>

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
              <thead className={`sticky top-0 text-xs uppercase tracking-wide ${dark ? "bg-slate-700 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className={`px-5 py-4 font-black border-r ${dark ? "border-slate-600" : "border-slate-200"}`}>County</th>
                  <th className="px-5 py-4">Source</th>
                  <th className="px-5 py-4">Service</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>Year 1 goal</th>
                  <th className="px-5 py-4 text-right">Year 1 referrals</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>Year 2 goal</th>
                  <th className="px-5 py-4 text-right">Year 2 referrals</th>
                  <th className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>Year 3 goal</th>
                  <th className="px-5 py-4 text-right">Year 3 referrals</th>
                  <th className="px-5 py-4 text-right">Y1→Y3 growth</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {rows.map((row, i) => {
                  const growth = row.starts[0] > 0 ? ((row.starts[2] - row.starts[0]) / row.starts[0]) * 100 : 0;
                  const isAlt = i % 2 === 1;
                  return (
                    <tr key={row.county} className={`${dark ? isAlt ? "bg-slate-800/60 hover:bg-slate-700/50" : "hover:bg-slate-700/50" : isAlt ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}`}>
                      <td className={`px-5 py-4 font-black border-r ${dark ? "text-white border-slate-700" : "border-slate-100"}`}>{row.county}</td>
                      <td className="px-5 py-4"><SourceBadge basis={row.basis} /></td>
                      <td className="px-5 py-4"><ServiceBadge service={row.service} /></td>
                      <td className={`px-5 py-4 text-right border-l ${dark ? "text-slate-300 border-slate-700" : "border-slate-100"}`}>{number(row.starts[0])}</td>
                      <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[0])}</td>
                      <td className={`px-5 py-4 text-right border-l ${dark ? "text-slate-300 border-slate-700" : "border-slate-100"}`}>{number(row.starts[1])}</td>
                      <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[1])}</td>
                      <td className={`px-5 py-4 text-right border-l ${dark ? "text-slate-300 border-slate-700" : "border-slate-100"}`}>{number(row.starts[2])}</td>
                      <td className={`px-5 py-4 text-right font-black ${dark ? "text-blue-400" : "text-blue-700"}`}>{number(row.referrals[2])}</td>
                      <td className={`px-5 py-4 text-right font-black ${growth > 0 ? "text-emerald-600" : "text-slate-400"}`}>
                        {growth > 0 ? `+${Math.round(growth)}%` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className={`font-black text-sm border-t-2 ${dark ? "border-slate-600 bg-slate-700/60 text-white" : "border-slate-300 bg-slate-100 text-slate-900"}`}>
                  <td colSpan={3} className={`px-5 py-4 border-r ${dark ? "border-slate-600" : "border-slate-200"}`}>Totals</td>
                  <td className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[0], 0))}</td>
                  <td className="px-5 py-4 text-right">{number(rows.reduce((s, r) => s + r.referrals[0], 0))}</td>
                  <td className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[1], 0))}</td>
                  <td className="px-5 py-4 text-right">{number(rows.reduce((s, r) => s + r.referrals[1], 0))}</td>
                  <td className={`px-5 py-4 text-right border-l ${dark ? "border-slate-600" : "border-slate-200"}`}>{number(rows.reduce((s, r) => s + r.starts[2], 0))}</td>
                  <td className="px-5 py-4 text-right">{number(rows.reduce((s, r) => s + r.referrals[2], 0))}</td>
                  <td className="px-5 py-4 text-right text-emerald-600">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
