import React from "react";
import Card from "../components/Card.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import { number } from "../utils/formatters.js";

export default function ReferralPlan({ rows }) {
  return (
    <Card title="Referral requirements by county" eyebrow="Referral plan">
      <div className="overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4">County</th>
              <th className="px-5 py-4">Service</th>
              <th className="px-5 py-4 text-right">Year 1 goal</th>
              <th className="px-5 py-4 text-right">Year 1 referrals</th>
              <th className="px-5 py-4 text-right">Year 2 goal</th>
              <th className="px-5 py-4 text-right">Year 2 referrals</th>
              <th className="px-5 py-4 text-right">Year 3 goal</th>
              <th className="px-5 py-4 text-right">Year 3 referrals</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.county} className="hover:bg-slate-50">
                <td className="px-5 py-4 font-black">{row.county}</td>
                <td className="px-5 py-4"><ServiceBadge service={row.service} /></td>
                <td className="px-5 py-4 text-right">{number(row.starts[0])}</td>
                <td className="px-5 py-4 text-right font-black text-blue-700">{number(row.referrals[0])}</td>
                <td className="px-5 py-4 text-right">{number(row.starts[1])}</td>
                <td className="px-5 py-4 text-right">{number(row.referrals[1])}</td>
                <td className="px-5 py-4 text-right">{number(row.starts[2])}</td>
                <td className="px-5 py-4 text-right">{number(row.referrals[2])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
