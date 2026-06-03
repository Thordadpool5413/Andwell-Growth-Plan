import React, { useMemo, useState, useEffect, useCallback } from "react";
import { DEFAULT_SCENARIO } from "./data/constants.js";
import DataSourceBanner from "./components/DataSourceBanner.jsx";
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
import MarketDynamicsView from "./views/MarketDynamicsView.jsx";
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
import { ArrowRightLeft, Download, MoreHorizontal, MoonStar, SlidersHorizontal, Sparkles, SunMedium } from "lucide-react";

const TAB_GROUPS = [
  { label: "Planning", tabs: ["Executive View", "County Plan", "Referral Plan", "Opportunity Score"] },
  { label: "Competitive", tabs: ["Competitive View", "Market Dynamics", "CMS Data"] },
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
  const [mapLayer, setMapLayer] = useState("priority");

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
    if (tab) {
      setActiveTab(tab);
      window.setTimeout(() => setActiveTab(tab), 0);
    }
    setShowScenario(false);
    setShowCompare(false);
    setShowInsights(false);
    setShowScenarioSidebar(false);
    window.requestAnimationFrame(() => {
      document.getElementById("tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);
  const handleApplyScenario = useCallback((nextScenario) => {
    setScenario(nextScenario);
    addToast("Smart plan applied", "success");
  }, [addToast]);
  const financialActionPage = activeTab === "Financial Model" || activeTab === "Sensitivity";
  const exportActionPage = ["Executive View", "County Plan", "Referral Plan", "Competitive View", "CMS Data", "Financial Model", "Sensitivity", "Board Report"].includes(activeTab);

  return (
    <div className={`dashboard-shell min-h-screen transition-colors duration-300 ${dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}>
      <div className={`px-4 py-6 sm:px-6 lg:px-10 transition-all duration-300 ${showScenarioSidebar ? "2xl:pr-[22rem]" : ""}`}>

        {/* ── Header ── */}
        <header className={`relative mx-auto mb-6 max-w-7xl overflow-hidden rounded-[28px] border shadow-[0_24px_80px_-28px_rgba(15,23,42,0.55)] transition-colors duration-300 print:hidden ${
          dark ? "border-slate-800/80 bg-slate-900/90" : "border-slate-200 bg-white/90"
        }`}>
          <div className="pointer-events-none absolute inset-0">
            <div className={`absolute inset-x-0 top-0 h-32 ${dark ? "bg-gradient-to-r from-blue-500/12 via-violet-500/10 to-cyan-400/10" : "bg-gradient-to-r from-blue-100 via-violet-100 to-cyan-100"}`} />
            <div className={`absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${dark ? "bg-blue-500/10" : "bg-blue-200/70"}`} />
            <div className={`absolute -bottom-16 left-1/3 h-40 w-40 rounded-full blur-3xl ${dark ? "bg-violet-500/10" : "bg-violet-200/70"}`} />
          </div>
          <div className="relative px-6 py-6 lg:px-8">
            <div className="flex flex-col gap-4 pr-16">
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  Andwell Maine — Innovation and Growth Plan
                </p>
                <h1 className={`mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-[2rem] ${dark ? "text-white" : "text-slate-950"}`}>
                  Home Health and Hospice Market Intelligence Dashboard
                </h1>
                <p className={`mt-3 max-w-3xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                  County opportunity, referral planning, competitor intelligence, and modeled financial upside in one executive workspace.
                </p>
              </div>
            </div>

            <button
              onClick={toggle}
              className={`absolute right-6 top-6 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                dark
                  ? "border-slate-700 bg-slate-800/90 text-slate-300 hover:border-slate-600 hover:bg-slate-700"
                  : "border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50"
              }`}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
              <span className="hidden sm:inline">{dark ? "Light mode" : "Dark mode"}</span>
            </button>
          </div>
        </header>

        <div className="print:hidden"><DataSourceBanner /></div>

        <div className="mx-auto max-w-7xl space-y-4">
          {/* ── Navigation ── */}
          <div className="print:hidden space-y-3">
            <div className={`overflow-x-auto rounded-2xl border px-1 py-1 ${dark ? "border-slate-700/60 bg-slate-900/85 backdrop-blur-sm" : "border-slate-200 bg-white/90 backdrop-blur-sm"} shadow-lg shadow-slate-900/5`}>
              <div className="flex items-stretch min-w-max px-2 py-1.5 gap-0" role="tablist" aria-label="Dashboard views">
                {TAB_GROUPS.map((group, gi) => (
                  <React.Fragment key={group.label}>
                    {gi > 0 && (
                      <div className={`mx-2 my-2 w-px self-stretch ${dark ? "bg-slate-700/60" : "bg-slate-200"}`} />
                    )}
                    <div className="flex flex-col">
                      <span className={`px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? "text-slate-400" : "text-slate-500"}`}>
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
                                  ? "bg-slate-800 text-slate-100 shadow-inner shadow-white/5"
                                  : "bg-slate-100 text-slate-800 shadow-sm shadow-slate-200/70"
                                : dark
                                  ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {tab}
                            {activeTab === tab && (
                              <span className={`absolute bottom-0 left-2.5 right-2.5 h-0.5 rounded-full ${dark ? "bg-cyan-400" : "bg-blue-600"}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <details className="relative">
                <summary className={`flex cursor-pointer list-none items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${dark ? "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}>
                  <MoreHorizontal className="h-4 w-4" />
                  Page actions
                </summary>
                <div className={`absolute right-0 z-40 mt-2 w-60 rounded-2xl border p-2 shadow-xl ${dark ? "border-slate-700 bg-slate-900" : "border-slate-200 bg-white"}`}>
                  {financialActionPage && (
                    <>
                      <button onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium ${dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}>
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        {showCompare ? "Hide scenario comparison" : "Compare scenarios"}
                      </button>
                      <button onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium ${dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}>
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {showScenario ? "Hide scenario model" : "Scenario model"}
                      </button>
                    </>
                  )}
                  <button onClick={() => setShowInsights((p) => !p)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium ${dark ? "text-slate-300 hover:bg-slate-800" : "text-slate-700 hover:bg-slate-50"}`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    {showInsights ? "Hide insights" : `Insights${insightCount > 0 ? ` (${insightCount})` : ""}`}
                  </button>
                  {exportActionPage && (
                    <div className={`mt-1 border-t pt-2 ${dark ? "border-slate-800" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        <Download className="h-3.5 w-3.5" />
                        Export
                      </div>
                      <div className="px-2 py-1">
                        <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
                      </div>
                    </div>
                  )}
                  {!financialActionPage && !exportActionPage && (
                    <p className={`px-3 py-2 text-xs ${dark ? "text-slate-500" : "text-slate-400"}`}>No page actions for this view.</p>
                  )}
                </div>
              </details>
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
              {activeTab === "County Plan" && <CountyPlan rows={rows} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} competitorProviderType={competitorProviderType} setCompetitorProviderType={setCompetitorProviderType} mapLayer={mapLayer} setMapLayer={setMapLayer} />}
              {activeTab === "Referral Plan" && <ReferralPlan rows={rows} />}
              {activeTab === "Competitive View" && <CompetitiveView selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} competitorProviderType={competitorProviderType} setCompetitorProviderType={setCompetitorProviderType} />}
              {activeTab === "Market Dynamics" && <MarketDynamicsView setActiveTab={setActiveTab} selectedCounty={selectedCounty} setSelectedCounty={setSelectedCounty} />}
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

      <AskPanel rows={rows} totals={totals} activeTab={activeTab} selectedCounty={selectedCounty} mapLayer={mapLayer} competitorProviderType={competitorProviderType} />

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
