import React, { useMemo, useState } from "react";
import { TABS, DEFAULT_SCENARIO } from "./data/constants.js";
import { buildRows } from "./utils/calculations.js";
import { DarkModeProvider, useDarkMode } from "./components/DarkModeContext.jsx";
import { ToastProvider, useToast } from "./components/ToastContainer.jsx";
import ScenarioPanel from "./components/ScenarioPanel.jsx";
import ScenarioCompare from "./components/ScenarioCompare.jsx";
import ScenarioManager from "./components/ScenarioManager.jsx";
import ExportButton from "./components/ExportButton.jsx";
import InsightsPanel from "./components/InsightsPanel.jsx";
import { InsightsEngine } from "./utils/insights.js";
import ExecutiveView from "./views/ExecutiveView.jsx";
import CountyPlan from "./views/CountyPlan.jsx";
import ReferralPlan from "./views/ReferralPlan.jsx";
import CompetitiveView from "./views/CompetitiveView.jsx";
import ServiceLines from "./views/ServiceLines.jsx";
import CmsData from "./views/CmsData.jsx";
import FinancialModel from "./views/FinancialModel.jsx";
import StaffingModel from "./views/StaffingModel.jsx";
import SensitivityAnalysis from "./views/SensitivityAnalysis.jsx";
import OpportunityScore from "./views/OpportunityScore.jsx";
import LaunchTimeline from "./views/LaunchTimeline.jsx";
import BoardReport from "./views/BoardReport.jsx";
import LaunchChecklist from "./views/LaunchChecklist.jsx";

function Dashboard() {
  const { dark, toggle } = useDarkMode();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("Executive View");
  const [selectedCounty, setSelectedCounty] = useState("York");
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);
  const [showScenario, setShowScenario] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  const rows = useMemo(() => buildRows(scenario), [scenario]);
  const totals = useMemo(
    () => ({
      y1Revenue: rows.reduce((sum, row) => sum + row.revenue[0], 0),
      y2Revenue: rows.reduce((sum, row) => sum + row.revenue[1], 0),
      y3Revenue: rows.reduce((sum, row) => sum + row.revenue[2], 0),
      y1Referrals: rows.reduce((sum, row) => sum + row.referrals[0], 0),
      y2Referrals: rows.reduce((sum, row) => sum + row.referrals[1], 0),
      y3Referrals: rows.reduce((sum, row) => sum + row.referrals[2], 0),
      y1Starts: rows.reduce((sum, row) => sum + row.starts[0], 0),
      y2Starts: rows.reduce((sum, row) => sum + row.starts[1], 0),
      y3Starts: rows.reduce((sum, row) => sum + row.starts[2], 0),
      totalContribution: rows.reduce((sum, row) => sum + row.totalContribution, 0),
    }),
    [rows],
  );

  // Generate insights
  const insightsEngine = useMemo(() => new InsightsEngine(rows, totals), [rows, totals]);
  const insights = useMemo(() => insightsEngine.getAllInsights(), [insightsEngine]);

  const handleExportSuccess = () => {
    showToast("Export started!", "success");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-slate-950 text-slate-100" : "bg-gradient-to-b from-slate-50 to-white text-slate-900"}`}>
      <div className="px-4 py-10 sm:px-6 lg:px-10">
        <header className={`mx-auto mb-8 max-w-7xl rounded-3xl px-8 py-12 shadow-xl transition-colors duration-300 ${dark ? "bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 border border-slate-800" : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-300">Andwell Maine Innovation and Growth Plan</p>
              <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight text-white md:text-5xl">
                Innovation and growth vision with competitor intelligence.
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                A leadership ready dashboard connecting county opportunity, referral requirements, CMS market data, named competitors, provider file share, financial upside, and launch validation.
              </p>
            </div>
            <button
              onClick={toggle}
              className={`shrink-0 rounded-full p-3 transition-all duration-300 ${dark ? "bg-slate-700 text-amber-300 hover:bg-slate-600" : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"}`}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-5 py-2.5 text-sm font-black transition-all duration-200 ${
                  activeTab === tab
                    ? dark ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" : "bg-slate-900 text-white shadow-md"
                    : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${showCompare ? "bg-indigo-600 text-white" : dark ? "bg-slate-800 text-indigo-400 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50"}`}
              >
                {showCompare ? "Hide Compare" : "Compare"}
              </button>
              <button
                onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${showScenario ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-blue-400 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-blue-700 ring-1 ring-blue-200 hover:bg-blue-50"}`}
              >
                {showScenario ? "Hide Scenarios" : "Scenario Model"}
              </button>
              <button
                onClick={() => setShowInsights((p) => !p)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${showInsights ? "bg-green-600 text-white" : dark ? "bg-slate-800 text-green-400 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-green-700 ring-1 ring-green-200 hover:bg-green-50"}`}
              >
                {showInsights ? "Hide Insights" : "Insights"}
              </button>
              <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
            </div>
          </div>

          {showScenario && (
            <div className="space-y-4">
              <ScenarioPanel scenario={scenario} setScenario={setScenario} />
              <ScenarioManager />
            </div>
          )}
          {showCompare && <ScenarioCompare currentScenario={scenario} />}
          {showInsights && <InsightsPanel insights={insights} onActionClick={(county) => setSelectedCounty(county)} />}

          <div id="tab-content">
            {activeTab === "Executive View" && <ExecutiveView rows={rows} totals={totals} />}
            {activeTab === "County Plan" && <CountyPlan rows={rows} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
            {activeTab === "Referral Plan" && <ReferralPlan rows={rows} />}
            {activeTab === "Competitive View" && <CompetitiveView selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
            {activeTab === "Service Lines" && <ServiceLines />}
            {activeTab === "CMS Data" && <CmsData />}
            {activeTab === "Financial Model" && <FinancialModel rows={rows} />}
            {activeTab === "Staffing Model" && <StaffingModel rows={rows} />}
            {activeTab === "Sensitivity" && <SensitivityAnalysis rows={rows} />}
            {activeTab === "Opportunity Score" && <OpportunityScore rows={rows} />}
            {activeTab === "Launch Timeline" && <LaunchTimeline rows={rows} />}
            {activeTab === "Board Report" && <BoardReport rows={rows} totals={totals} />}
            {activeTab === "Launch Checklist" && <LaunchChecklist />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AndwellGrowthPlanApp() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </DarkModeProvider>
  );
}
