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
          className={`rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
        >
          Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className={`w-full min-w-[1050px] text-left text-sm ${dark ? "border-slate-700" : ""}`}>
          <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
            <tr>
              <th className="px-5 py-4">County</th>
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
    </Card>
  );
}
