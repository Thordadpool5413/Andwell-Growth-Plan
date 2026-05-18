import React from "react";
import Card from "../components/Card.jsx";

const items = [
  "Confirm service footprint by county",
  "Confirm referral source commitment",
  "Confirm staffing capacity and routing",
  "Validate reimbursement, payer mix, cost to serve, and margin",
  "Add Andwell actual county volume for true market share",
  "Add competitor county attribution for true competitor share",
];

export default function LaunchChecklist() {
  return (
    <Card title="Validation checklist" eyebrow="Before launch approval">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{index + 1}. {item}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
