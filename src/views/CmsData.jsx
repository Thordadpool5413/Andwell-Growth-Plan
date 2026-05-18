import React from "react";
import {
  Bar, CartesianGrid, ComposedChart, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import Metric from "../components/Metric.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { number } from "../utils/formatters.js";

export default function CmsData() {
  const rows = Object.entries(cmsCountyMarket)
    .map(([county, market]) => ({ county, ...market }))
    .sort((a, b) => b.ffs - a.ffs);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="CMS counties loaded" value={rows.length} detail="County market rows included in this dashboard." />
        <Metric label="HH users" value={number(rows.reduce((sum, row) => sum + row.hh.users, 0))} detail="Home health users across loaded rows." />
        <Metric label="Hospice users" value={number(rows.reduce((sum, row) => sum + row.hos.users, 0))} detail="Hospice users across loaded rows." />
      </div>
      <Card title="CMS county market data" eyebrow="Market data">
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="county" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hh.users" name="HH users" fill={COLORS.blue} radius={[8, 8, 0, 0]} />
              <Line type="monotone" dataKey="hos.users" name="Hospice users" stroke="#9333ea" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
