import React from "react";

export default function SourceBadge({ basis }) {
  if (!basis) return null;
  const isCms = basis.toLowerCase().includes("cms");
  return (
    <span
      title={basis}
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        isCms
          ? "bg-blue-100 text-blue-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {isCms ? "CMS" : "Est."}
    </span>
  );
}
