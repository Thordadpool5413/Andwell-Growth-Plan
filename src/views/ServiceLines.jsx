import React from "react";
import Card from "../components/Card.jsx";
import ServiceBadge from "../components/ServiceBadge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import services from "../data/services.js";
import { currency, percent } from "../utils/formatters.js";

export default function ServiceLines() {
  const { dark } = useDarkMode();
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Service lines" title="Andwell service line definitions and reimbursement assumptions">
        Each service line card shows the clinical role, modeled Medicare reimbursement rate, target contribution margin, and billing unit. Reimbursement figures are internal planning assumptions based on <Abbr term="CMS">CMS</Abbr> rate schedules — actual rates vary by patient acuity, geography, and payer mix. "Validate" indicates a line where reimbursement has not yet been confirmed.
      </SectionHeader>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {Object.entries(services).map(([service, meta]) => (
        <Card key={service} title={service} eyebrow={meta.role}>
          <div className="space-y-3">
            <ServiceBadge service={service} />
            <p className={`text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Modeled reimbursement: {meta.reimbursement ? currency(meta.reimbursement) : "Validation only"}</p>
            <p className={`text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Margin: {meta.margin ? percent(meta.margin) : "Validate"}</p>
            <p className={`text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>Unit: {meta.unit}</p>
          </div>
        </Card>
      ))}
      </div>
    </div>
  );
}
