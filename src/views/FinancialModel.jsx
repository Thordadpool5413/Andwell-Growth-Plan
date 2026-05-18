import React from "react";
import {
  CartesianGrid, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import { COLORS } from "../data/constants.js";
import { currency, number } from "../utils/formatters.js";

export default function FinancialModel({ rows }) {
  const yearRows = [0, 1, 2].map((index) => ({
    year: `Year ${index + 1}`,
    starts: rows.reduce((sum, row) => sum + row.starts[index], 0),
    referrals: rows.reduce((sum, row) => sum + row.referrals[index], 0),
    revenue: rows.reduce((sum, row) => sum + row.revenue[index], 0),
  }));

  return (
    <Card title="Three year financial and referral outlook" eyebrow="Financial impact">
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={yearRows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis yAxisId="left" tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip formatter={(value, name) => name === "Revenue" ? currency(value) : number(value)} />
            <Line yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.blue} strokeWidth={3} />
            <Line yAxisId="right" type="monotone" dataKey="referrals" name="Referrals" stroke={COLORS.amber} strokeWidth={3} />
            <Line yAxisId="right" type="monotone" dataKey="starts" name="Starts" stroke={COLORS.green} strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
