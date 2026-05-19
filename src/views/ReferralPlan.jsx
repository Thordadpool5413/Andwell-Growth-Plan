import React from "react";
import Card from "../components/Card.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { number } from "../utils/formatters.js";
import { exportReferralCSV } from "../utils/csvExport.js";

export default function ReferralPlan({ rows }) {
  const { dark } = useDarkMode();
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
