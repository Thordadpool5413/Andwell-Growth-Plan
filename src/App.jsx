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
    <div className={`min-h-screen transition-smooth ${dark ? "bg-slate-950 text-slate-100" : "bg-gradient-to-b from-slate-50 via-blue-50 to-white text-slate-900"}`}>
      <div className="px-4 py-8 sm:px-6 lg:px-10">
        {/* Professional Header with Hero Section */}
        <header className={`mx-auto mb-12 max-w-7xl rounded-2xl overflow-hidden shadow-xl transition-smooth ${dark ? "bg-gradient-to-br from-blue-950/80 via-slate-900/80 to-slate-950/80 border border-slate-800/50 backdrop-blur-sm" : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"}`}>
          <div className="px-8 py-14 flex items-start justify-between gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-caption text-blue-300 mb-3 animate-fade-in">Andwell Maine Innovation and Growth Plan</p>
              <h1 className="text-heading-xl text-white mb-4 animate-slide-in">
                Innovation and growth vision with competitor intelligence
              </h1>
              <p className="text-lg leading-relaxed text-slate-300 max-w-3xl animate-slide-in" style={{ animationDelay: '100ms' }}>
                A leadership ready dashboard connecting county opportunity, referral requirements, CMS market data, named competitors, provider file share, financial upside, and launch validation.
              </p>
            </div>
            <button
              onClick={toggle}
              className={`shrink-0 rounded-full p-4 transition-all duration-300 hover:scale-110 ${dark ? "bg-slate-700/60 text-amber-300 hover:bg-slate-600 hover:shadow-lg" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8">
          {/* Tab Navigation with Enhanced Styling */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-5 py-2.5 text-sm font-bold transition-all duration-200 focus-ring ${
                    activeTab === tab
                      ? dark ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30" : "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md"
                      : dark ? "bg-slate-800/60 text-slate-300 hover:bg-slate-700/80 hover:text-slate-100 border border-slate-700/50" : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            {/* Action Buttons */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 focus-ring ${showCompare ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : dark ? "bg-slate-800/60 text-indigo-400 hover:bg-slate-700/80 border border-slate-700/50" : "bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200"}`}
              >
                {showCompare ? "✓ Compare" : "Compare"}
              </button>
              <button
                onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 focus-ring ${showScenario ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : dark ? "bg-slate-800/60 text-blue-400 hover:bg-slate-700/80 border border-slate-700/50" : "bg-white text-blue-700 hover:bg-blue-50 border border-blue-200"}`}
              >
                {showScenario ? "✓ Model" : "Scenario"}
              </button>
              <button
                onClick={() => setShowInsights((p) => !p)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all duration-200 focus-ring ${showInsights ? "bg-green-600 text-white shadow-lg shadow-green-600/30" : dark ? "bg-slate-800/60 text-green-400 hover:bg-slate-700/80 border border-slate-700/50" : "bg-white text-green-700 hover:bg-green-50 border border-green-200"}`}
              >
                {showInsights ? "✓ Insights" : "Insights"}
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
