import React, { useState } from "react";
import { useDarkMode } from "./DarkModeContext.jsx";
import cmsMeta from "../data/cmsMeta.js";

export default function DataSourceBanner() {
  const { dark } = useDarkMode();
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className={`mx-auto mb-4 max-w-7xl rounded-xl border px-4 transition-colors duration-300 ${
      dark
        ? "border-slate-700 bg-slate-900/60"
        : "border-slate-200 bg-slate-50"
    } ${collapsed ? "py-2.5" : "py-4"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${dark ? "text-slate-500" : "text-slate-400"}`}>
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
          {collapsed ? (
            <button
              onClick={() => setCollapsed(false)}
              className={`text-xs font-semibold hover:underline transition-colors ${dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"}`}
            >
              Data sources &amp; methodology
              <span className={`ml-2 text-[10px] font-medium rounded px-1.5 py-0.5 ${dark ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-400"}`}>
                Model {cmsMeta.modelDate}
              </span>
            </button>
          ) : (
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <p className={`text-xs font-medium uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>
                  Data sources &amp; methodology
                </p>
                <span className={`rounded px-2 py-0.5 text-[10px] font-medium ${dark ? "bg-blue-900/60 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                  Model as of {cmsMeta.modelDate}
                </span>
              </div>
              <div className={`mt-1.5 grid gap-1 text-xs leading-5 ${dark ? "text-blue-200/80" : "text-blue-900/70"}`}>
                <p>
                  <span className="font-semibold">Market data:</span> CMS {cmsMeta.datasetYear} Home Health &amp; Hospice Public Use File (PUF) · Medicare Provider of Service File · County-level Fee-For-Service (FFS) beneficiary counts
                </p>
                <p>
                  <span className="font-semibold">Coverage:</span> {cmsMeta.coverage.counties.length} of 16 Maine counties in CMS dataset. Missing: {cmsMeta.coverage.missingCounties.join(", ")}.
                </p>
                <p>
                  <span className="font-semibold">Methodology:</span> Referral math uses a 75% conversion baseline (NAHC 2023 industry median: 72–78%). Capture rates are internal Andwell planning assumptions (HH Y1: 10%, industry median range: 8–15%). Competitive scores are composite weighted averages across provider density, market share, and national chain presence. "Est." badges indicate figures derived from proxies, not direct CMS county data.
                </p>
                <p>
                  <span className="font-semibold">Important:</span> Provider file share figures reflect share of CMS provider file beneficiary volume — they are <span className="font-bold">not</span> equivalent to true county market share, which requires county-attributed claims data not available in this dataset.
                </p>
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition ${
              dark
                ? "text-blue-400 hover:bg-blue-900/50"
                : "text-blue-600 hover:bg-blue-100"
            }`}
            aria-label="Collapse data sources"
          >
            Collapse
          </button>
        )}
      </div>
    </div>
  );
}
