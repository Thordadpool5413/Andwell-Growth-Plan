import React, { useMemo, useState } from "react";
import { TABS, DEFAULT_SCENARIO } from "./data/constants.js";
import { buildRows } from "./utils/calculations.js";
import ScenarioPanel from "./components/ScenarioPanel.jsx";
import ExportButton from "./components/ExportButton.jsx";
import ExecutiveView from "./views/ExecutiveView.jsx";
import CountyPlan from "./views/CountyPlan.jsx";
import ReferralPlan from "./views/ReferralPlan.jsx";
import CompetitiveView from "./views/CompetitiveView.jsx";
import ServiceLines from "./views/ServiceLines.jsx";
import CmsData from "./views/CmsData.jsx";
import FinancialModel from "./views/FinancialModel.jsx";
import LaunchChecklist from "./views/LaunchChecklist.jsx";

export default function AndwellGrowthPlanApp() {
  const [activeTab, setActiveTab] = useState("Executive View");
  const [selectedCounty, setSelectedCounty] = useState("York");
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [showScenario, setShowScenario] = useState(false);

  const rows = useMemo(() => buildRows(scenario), [scenario]);
  const totals = useMemo(
    () => ({
      y1Revenue: rows.reduce((sum, row) => sum + row.revenue[0], 0),
      y1Referrals: rows.reduce((sum, row) => sum + row.referrals[0], 0),
    }),
    [rows],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 sm:px-6 lg:px-10">
      <header className="mx-auto mb-8 max-w-7xl rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-12 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Andwell Maine Innovation and Growth Plan</p>
        <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight md:text-5xl">
          Innovation and growth vision with competitor intelligence.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
          A leadership ready dashboard connecting county opportunity, referral requirements, CMS market data, named competitors, provider file share, financial upside, and launch validation.
        </p>
      </header>

      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2.5 text-sm font-black transition ${activeTab === tab ? "bg-slate-900 text-white shadow-md" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}
            >
              {tab}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowScenario((prev) => !prev)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${showScenario ? "bg-blue-600 text-white" : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"}`}
            >
              {showScenario ? "Hide Scenarios" : "Scenario Model"}
            </button>
            <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
          </div>
        </div>

        {showScenario && <ScenarioPanel scenario={scenario} setScenario={setScenario} />}

        <div id="tab-content">
          {activeTab === "Executive View" && <ExecutiveView rows={rows} totals={totals} />}
          {activeTab === "County Plan" && <CountyPlan rows={rows} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
          {activeTab === "Referral Plan" && <ReferralPlan rows={rows} />}
          {activeTab === "Competitive View" && <CompetitiveView selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
          {activeTab === "Service Lines" && <ServiceLines />}
          {activeTab === "CMS Data" && <CmsData />}
          {activeTab === "Financial Model" && <FinancialModel rows={rows} />}
          {activeTab === "Launch Checklist" && <LaunchChecklist />}
        </div>
      </div>
    </div>
  );
}
