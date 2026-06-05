import React, { useState, useCallback } from "react";
import Button from "./Button.jsx";
import { exportToCSV } from "../utils/dataExport.js";

function FileText({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DropdownChevron({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function ExportButton({
  targetId,
  filename,
  variant = "secondary",
  size = "md",
  className = "",
  rows = [],
}) {
  const [open, setOpen] = useState(false);

  const handlePrint = useCallback(() => {
    const element = document.getElementById(targetId);
    if (!element) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((node) => node.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename || "Andwell Growth Plan"}</title>
          ${styles}
          <style>
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            body { background: #f8fafc; padding: 24px; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => { setTimeout(() => printWindow.print(), 500); };
  }, [targetId, filename]);

  const handleCSV = useCallback(() => {
    if (!rows.length) return;
    const flat = rows.map((r) => ({
      County: r.county,
      Service: r.service,
      "Launch group": r.launchGroup,
      "Y1 starts": r.starts[0],
      "Y2 starts": r.starts[1],
      "Y3 starts": r.starts[2],
      "Y1 revenue": r.revenue[0],
      "Y2 revenue": r.revenue[1],
      "Y3 revenue": r.revenue[2],
      "Y1 referrals": r.referrals[0],
      "Y2 referrals": r.referrals[1],
      "Y3 referrals": r.referrals[2],
      "Total contribution": r.totalContribution,
      Margin: r.meta?.margin,
      "Market (beneficiaries)": r.market,
      "Demand pool": r.demandPool,
      "Reimbursement": r.reimbursement,
    }));
    exportToCSV(flat, `${filename || "Andwell"}.csv`);
  }, [rows, filename]);

  return (
    <div className="relative">
      <div className="flex items-center">
        <Button
          variant={variant}
          size={size}
          onClick={handlePrint}
          icon={<FileText className="h-4 w-4" />}
          className={`${className} rounded-r-none`}
        >
          Print
        </Button>
        <button
          onClick={() => setOpen((p) => !p)}
          className={`rounded-r-lg border-l px-2 py-2 text-sm transition ${
            variant === "outline"
              ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              : "border-violet-600 bg-violet-600 text-white hover:bg-violet-500"
          }`}
        >
          <DropdownChevron className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-44 rounded-xl border bg-white shadow-lg ring-1 ring-black/5">
            <button
              onClick={() => { handleCSV(); setOpen(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">CSV</span>
              Export data as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
