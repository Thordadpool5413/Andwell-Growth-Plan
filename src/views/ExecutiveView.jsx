import React from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import { COLORS } from "../data/constants.js";
import { namedProviderRows } from "../data/providers.js";
import { rollupByService } from "../utils/calculations.js";
import { currency, number } from "../utils/formatters.js";

export default function ExecutiveView({ rows, totals }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Active growth counties" value={rows.length} detail="County and service line recommendations in the active model." />
        <Metric label="Year 1 referrals" value={number(totals.y1Referrals)} detail="Gross referrals needed at a 75 percent conversion baseline." />
        <Metric label="Year 1 revenue" value={currency(totals.y1Revenue)} detail="Modeled Year 1 gross revenue from active lines." />
        <Metric label="Named competitors" value={namedProviderRows.length} detail="Home Healthcare and Hospice provider rows loaded into the competitive view." />
      </div>
      <Card title="Growth thesis" eyebrow="Executive summary">
        <p className="text-lg leading-8 text-slate-700">
          This dashboard connects Andwell service gaps, CMS market volume, referral math, financial upside, and named provider competition. The competitor layer now shows the actual named Home Healthcare and Hospice providers from the uploaded provider file, including Andwell provider file share and rank.
        </p>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Year 1 service mix" eyebrow="Revenue mix">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rollupByService(rows)} dataKey="revenue" nameKey="service" innerRadius={70} outerRadius={115} paddingAngle={3}>
                  {rollupByService(rows).map((row) => <Cell key={row.service} fill={row.color} />)}
                </Pie>
                <Tooltip formatter={(value) => currency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Year 1 referral ramp" eyebrow="Execution math">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="county" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey={(row) => row.referrals[0]} name="Year 1 referrals" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
