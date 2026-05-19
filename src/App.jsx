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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800 bg-black/40 backdrop-blur-sm p-6 flex flex-col gap-8 overflow-y-auto sticky top-0 h-screen">
        {/* Logo/Branding */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-white">Andwell</h1>
            <p className="text-xs text-slate-400 mt-1">Growth Plan</p>
          </div>
          <button
            onClick={toggle}
            className="rounded-full p-2 hover:bg-slate-800 transition-colors"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-amber-400">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-slate-400">
                <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Views</p>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === tab
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="space-y-2 border-t border-slate-800 pt-4">
          <button
            onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${showScenario ? "bg-blue-600/30 text-blue-300 border border-blue-500/40" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"}`}
          >
            {showScenario ? "✓" : "○"} Scenario Model
          </button>
          <button
            onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${showCompare ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/40" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"}`}
          >
            {showCompare ? "✓" : "○"} Compare
          </button>
          <button
            onClick={() => setShowInsights((p) => !p)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${showInsights ? "bg-emerald-600/30 text-emerald-300 border border-emerald-500/40" : "text-slate-400 hover:text-slate-300 hover:bg-slate-800/50"}`}
          >
            {showInsights ? "✓" : "○"} Insights
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="px-8 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">{activeTab}</h2>
              <p className="text-sm text-slate-400 mt-1">Professional growth analytics</p>
            </div>
            <div className="flex items-center gap-3">
              <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-8 py-8 max-w-7xl mx-auto">
            {showScenario && (
              <div className="mb-8 space-y-4">
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
      </main>
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
