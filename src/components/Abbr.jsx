import React, { useState } from "react";

const DEFINITIONS = {
  FFS: "Fee-For-Service — Medicare beneficiaries in traditional (non-managed care) Medicare",
  CMS: "Centers for Medicare & Medicaid Services — the federal agency that administers Medicare and Medicaid",
  HH: "Home Health — skilled nursing and therapy services delivered in a patient's home",
  FTE: "Full-Time Equivalent — one full-time staff position (40 hrs/week), used to normalize headcount across part-time roles",
  PPU: "Payment Per User — average Medicare reimbursement per beneficiary for a given service",
  PUF: "Public Use File — de-identified CMS data file released for public research and analysis",
  NAHC: "National Association for Home Care & Hospice — the primary industry trade association for home health providers",
  "Contribution Margin": "Revenue minus variable costs; the amount each service line contributes to covering fixed costs and generating profit",
  "Provider File Share": "A provider's share of total beneficiary volume in the CMS provider file — NOT the same as county-level market share, which requires county-attributed claims data",
  "Market Penetration": "Modeled patient starts as a percentage of total addressable CMS beneficiaries in a county",
  "Conversion Rate": "The percentage of referrals that convert to patient starts (admissions); industry median is 72–78% (NAHC 2023)",
  "Capture Rate": "The percentage of the total addressable market (CMS beneficiaries) that Andwell targets to serve in a given year",
};

export default function Abbr({ term, children }) {
  const [visible, setVisible] = useState(false);
  const definition = DEFINITIONS[term] || DEFINITIONS[children];
  const display = children || term;

  if (!definition) return <span>{display}</span>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        className="cursor-help border-b border-dashed border-current opacity-80 hover:opacity-100"
        aria-describedby={`abbr-${term}`}
      >
        {display}
      </button>
      {visible && (
        <span
          id={`abbr-${term}`}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl bg-slate-900 px-3 py-2.5 text-xs leading-5 text-slate-100 shadow-xl"
        >
          <span className="font-semibold text-blue-300">{display}</span>
          <span className="mx-1 text-slate-500">—</span>
          {definition}
          <span className="absolute top-full left-1/2 -mt-1 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
