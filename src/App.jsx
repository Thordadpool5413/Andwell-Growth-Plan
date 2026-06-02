import React, { useMemo, useState, useEffect, useCallback } from "react";
import { DEFAULT_SCENARIO } from "./data/constants.js";
import DataSourceBanner from "./components/DataSourceBanner.jsx";
import { buildRows } from "./utils/calculations.js";
import { DarkModeProvider, useDarkMode } from "./components/DarkModeContext.jsx";
import { ToastProvider, useToast } from "./components/ToastContainer.jsx";
import { currency, number } from "./utils/formatters.js";
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
import MarketDynamicsView from "./views/MarketDynamicsView.jsx";
import ServiceLines from "./views/ServiceLines.jsx";
import CmsData from "./views/CmsData.jsx";
import FinancialModel from "./views/FinancialModel.jsx";
import StaffingModel from "./views/StaffingModel.jsx";
import SensitivityAnalysis from "./views/SensitivityAnalysis.jsx";
import OpportunityScore from "./views/OpportunityScore.jsx";
import LaunchTimeline from "./views/LaunchTimeline.jsx";
import BoardReport from "./views/BoardReport.jsx";
import LaunchChecklist from "./views/LaunchChecklist.jsx";
import AskPanel from "./components/AskPanel.jsx";
import ScenarioSidebar from "./components/ScenarioSidebar.jsx";

const TAB_GROUPS = [
  { label: "Planning", tabs: ["Executive View", "County Plan", "Referral Plan", "Opportunity Score"] },
  { label: "Competitive", tabs: ["Competitive View", "Market Dynamics", "Service Lines", "CMS Data"] },
  { label: "Financial", tabs: ["Financial Model", "Sensitivity"] },
  { label: "Operations", tabs: ["Staffing Model", "Launch Timeline", "Board Report", "Launch Checklist"] },
];

function Dashboard() {
  const { dark, toggle } = useDarkMode();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState("Executive View");
  const [selectedCounty, setSelectedCounty] = useState("York");
  const [scenario, setScenario] = useState(() => {
    try {
      const saved = localStorage.getItem("andwell_scenario");
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SCENARIO, ...parsed };
      }
    } catch {}
    return DEFAULT_SCENARIO;
  });
  const [scenarioRestored, setScenarioRestored] = useState(() => {
    try {
      const saved = localStorage.getItem("andwell_scenario");
      if (!saved) return false;
      const parsed = JSON.parse(saved);
      const isDefault =
        parsed.conversionRate === DEFAULT_SCENARIO.conversionRate &&
        JSON.stringify(parsed.hhCapture) === JSON.stringify(DEFAULT_SCENARIO.hhCapture) &&
        JSON.stringify(parsed.woundCapture) === JSON.stringify(DEFAULT_SCENARIO.woundCapture) &&
        JSON.stringify(parsed.therapyCapture) === JSON.stringify(DEFAULT_SCENARIO.therapyCapture);
      return !isDefault;
    } catch {}
    return false;
  });
  const [showScenario, setShowScenario] = useState(false);
  const [showScenarioSidebar, setShowScenarioSidebar] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [competitorProviderType, setCompetitorProviderType] = useState("all");

  useEffect(() => {
    const isDefault =
      scenario.conversionRate === DEFAULT_SCENARIO.conversionRate &&
      JSON.stringify(scenario.hhCapture) === JSON.stringify(DEFAULT_SCENARIO.hhCapture) &&
      JSON.stringify(scenario.woundCapture) === JSON.stringify(DEFAULT_SCENARIO.woundCapture) &&
      JSON.stringify(scenario.therapyCapture) === JSON.stringify(DEFAULT_SCENARIO.therapyCapture);
    try {
      if (isDefault) {
        localStorage.removeItem("andwell_scenario");
      } else {
        localStorage.setItem("andwell_scenario", JSON.stringify(scenario));
      }
    } catch {}
  }, [scenario]);

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
  const defaultRows = useMemo(() => buildRows(DEFAULT_SCENARIO), []);
  const defaultTotals = useMemo(
    () => ({
      y1Revenue: defaultRows.reduce((sum, row) => sum + row.revenue[0], 0),
      y2Revenue: defaultRows.reduce((sum, row) => sum + row.revenue[1], 0),
      y3Revenue: defaultRows.reduce((sum, row) => sum + row.revenue[2], 0),
    }),
    [defaultRows],
  );

  const insightsEngine = useMemo(() => new InsightsEngine(rows, totals), [rows, totals]);
  const insights = useMemo(() => insightsEngine.getAllInsights(), [insightsEngine]);
  const insightCount = useMemo(
    () => (insights.recommendations?.length || 0) + (insights.anomalies?.length || 0) + (insights.risks?.length || 0),
    [insights],
  );
  const handleNavigate = useCallback(({ tab, county }) => {
    if (county) setSelectedCounty(county);
    if (tab) setActiveTab(tab);
  }, []);
  const handleApplyScenario = useCallback((nextScenario) => {
    setScenario(nextScenario);
    addToast("Smart plan applied", "success");
  }, [addToast]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className={`px-4 py-6 sm:px-6 lg:px-10 transition-all duration-300 ${showScenarioSidebar ? "2xl:pr-[22rem]" : ""}`}>

        {/* ── Header ── */}
        <header className={`mx-auto mb-6 max-w-7xl rounded-xl px-6 py-5 shadow-lg transition-colors duration-300 print:hidden ${dark ? "bg-slate-900 border border-slate-800" : "bg-slate-900"}`}>
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                Andwell Maine — Innovation and Growth Plan
              </p>
              <h1 className="mt-1 text-xl font-semibold leading-tight tracking-tight text-white md:text-2xl">
                Home Health and Hospice Market Intelligence Dashboard
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                County opportunity · referral requirements · CMS market data · competitor intelligence · financial upside · launch validation
              </p>

              {/* KPI strip */}
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Y1 Revenue</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{currency(totals.y1Revenue)}</p>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Y1 Starts</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{number(totals.y1Starts)}</p>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">Y1 Referrals</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{number(totals.y1Referrals)}</p>
                </div>
                <div className="h-7 w-px bg-slate-700" />
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">3-Year Revenue</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{currency(totals.y1Revenue + totals.y2Revenue + totals.y3Revenue)}</p>
                </div>
                {scenarioRestored && (
                  <>
                    <div className="h-7 w-px bg-slate-700" />
                    <div className="flex items-center gap-1.5 rounded border border-amber-700/50 bg-amber-900/30 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Custom scenario active
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={toggle}
              className="shrink-0 rounded-lg p-2.5 transition-colors duration-200 bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div className="print:hidden"><DataSourceBanner /></div>

        <div className="mx-auto max-w-7xl space-y-4">
          {/* ── Navigation ── */}
          <div className="print:hidden space-y-3">
            <div className={`overflow-x-auto rounded-xl border ${dark ? "border-slate-700/60 bg-slate-900" : "border-slate-200 bg-white"} shadow-sm`}>
              <div className="flex items-stretch min-w-max px-2 py-1.5 gap-0" role="tablist" aria-label="Dashboard views">
                {TAB_GROUPS.map((group, gi) => (
                  <React.Fragment key={group.label}>
                    {gi > 0 && (
                      <div className={`mx-2 my-2 w-px self-stretch ${dark ? "bg-slate-700/60" : "bg-slate-200"}`} />
                    )}
                    <div className="flex flex-col">
                      <span className={`px-3 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-widest ${dark ? "text-slate-500" : "text-slate-400"}`}>
                        {group.label}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {group.tabs.map((tab) => (
                          <button
                            key={tab}
                            role="tab"
                            aria-selected={activeTab === tab}
                            aria-controls={`panel-${tab.replace(/\s+/g, "-").toLowerCase()}`}
                            id={`tab-${tab.replace(/\s+/g, "-").toLowerCase()}`}
                            onClick={() => setActiveTab(tab)}
                            className={`relative rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-100 whitespace-nowrap ${
                              activeTab === tab
                                ? dark
                                  ? "text-slate-100"
                                  : "text-slate-800"
                                : dark
                                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {tab}
                            {activeTab === tab && (
                              <span className={`absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full ${dark ? "bg-blue-400" : "bg-blue-600"}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* ── Tools bar ── */}
            <div className={`flex flex-wrap items-center gap-2 border-t pt-2.5 ${dark ? "border-slate-800" : "border-slate-100"}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? "text-slate-600" : "text-slate-400"}`}>Tools</span>
              <button
                onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${
                  showCompare
                    ? "bg-blue-700 text-white"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {showCompare ? "Hide Compare" : "Compare scenarios"}
              </button>
              <button
                onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${
                  showScenario
                    ? "bg-blue-700 text-white"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {showScenario ? "Hide scenario model" : "Scenario model"}
              </button>
              <button
                onClick={() => setShowInsights((p) => !p)}
                className={`relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-100 ${
                  showInsights
                    ? "bg-blue-700 text-white"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {showInsights ? "Hide insights" : "Insights"}
                {!showInsights && insightCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                    {insightCount}
                  </span>
                )}
              </button>
              <div className="ml-auto">
                <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
              </div>
            </div>
          </div>

          {showScenario && (
            <div className="print:hidden">
              <ScenarioPanel
                scenario={scenario}
                setScenario={setScenario}
                onApplyScenario={handleApplyScenario}
                onNavigate={handleNavigate}
              />
            </div>
          )}
          {showCompare && <div className="print:hidden"><ScenarioCompare currentScenario={scenario} /></div>}
          {showInsights && (
            <div className="print:hidden">
              <InsightsPanel insights={insights} onActionClick={handleNavigate} />
            </div>
          )}

          <div id="tab-content">
            <div
              key={activeTab}
              className="tab-fade-in"
              role="tabpanel"
              id={`panel-${activeTab.replace(/\s+/g, "-").toLowerCase()}`}
              aria-labelledby={`tab-${activeTab.replace(/\s+/g, "-").toLowerCase()}`}
            >
              {activeTab === "Executive View" && <ExecutiveView rows={rows} totals={totals} />}
              {activeTab === "County Plan" && <CountyPlan rows={rows} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} competitorProviderType={competitorProviderType} setCompetitorProviderType={setCompetitorProviderType} />}
              {activeTab === "Referral Plan" && <ReferralPlan rows={rows} />}
              {activeTab === "Competitive View" && <CompetitiveView selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} competitorProviderType={competitorProviderType} setCompetitorProviderType={setCompetitorProviderType} />}
              {activeTab === "Market Dynamics" && <MarketDynamicsView setActiveTab={setActiveTab} />}
              {activeTab === "Service Lines" && <ServiceLines />}
              {activeTab === "CMS Data" && <CmsData />}
              {activeTab === "Financial Model" && <FinancialModel rows={rows} />}
              {activeTab === "Staffing Model" && <StaffingModel rows={rows} />}
              {activeTab === "Sensitivity" && <SensitivityAnalysis rows={rows} />}
              {activeTab === "Opportunity Score" && <OpportunityScore rows={rows} />}
              {activeTab === "Launch Timeline"   && <LaunchTimeline rows={rows} />}
              {activeTab === "Board Report"      && <BoardReport rows={rows} totals={totals} />}
              {activeTab === "Launch Checklist"  && <LaunchChecklist />}
            </div>
          </div>
        </div>
      </div>

      <AskPanel rows={rows} totals={totals} activeTab={activeTab} />

      {/* ── Scenario sidebar toggle ── */}
      <button
        onClick={() => setShowScenarioSidebar((p) => !p)}
        className={`fixed right-0 top-1/2 z-50 -translate-y-1/2 print:hidden transition-all duration-300 ${showScenarioSidebar ? "translate-x-80" : "translate-x-0"}`}
        aria-label="Open scenario controls"
        title="Scenario controls"
      >
        <div className={`flex flex-col items-center justify-center gap-1.5 rounded-l-xl px-2 py-4 shadow-lg border-y border-l transition-colors duration-200 ${
          showScenarioSidebar
            ? dark ? "bg-blue-900 border-blue-700 text-blue-200" : "bg-blue-700 border-blue-600 text-white"
            : dark ? "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-slate-200" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
            <path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-widest" style={{ writingMode: "vertical-rl", textOrientation: "mixed", transform: "rotate(180deg)" }}>
            Scenario
          </span>
        </div>
      </button>

      <ScenarioSidebar
        scenario={scenario}
        setScenario={setScenario}
        open={showScenarioSidebar}
        onClose={() => setShowScenarioSidebar(false)}
        wasRestored={scenarioRestored}
        onRestoredDismiss={() => setScenarioRestored(false)}
        totals={totals}
        defaultTotals={defaultTotals}
        onApplyScenario={handleApplyScenario}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <ToastProvider>
        <Dashboard />
      </ToastProvider>
    </DarkModeProvider>
  );
}
