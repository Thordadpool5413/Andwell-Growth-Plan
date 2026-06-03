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
import { ArrowRightLeft, Download, Lightbulb, MoonStar, SlidersHorizontal, Sparkles, SunMedium } from "lucide-react";

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
  const headerMetrics = useMemo(() => ([
    { label: "Year 1 revenue", value: currency(totals.y1Revenue), detail: "Modeled revenue run-rate" },
    { label: "Year 1 starts", value: number(totals.y1Starts), detail: "Projected patient starts" },
    { label: "Year 1 referrals", value: number(totals.y1Referrals), detail: "Required gross referrals" },
    { label: "3-year revenue", value: currency(totals.y1Revenue + totals.y2Revenue + totals.y3Revenue), detail: "Cumulative modeled upside" },
  ]), [totals]);
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
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${
                    dark ? "border-blue-500/20 bg-blue-500/10 text-blue-200" : "border-blue-200 bg-blue-50 text-blue-700"
                  }`}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Strategic planning workspace
                  </span>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] ${
                    dark ? "bg-slate-800/90 text-slate-400" : "bg-slate-100 text-slate-500"
                  }`}>
                    {activeTab}
                  </span>
                  {scenarioRestored && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      dark ? "border-amber-500/25 bg-amber-500/10 text-amber-200" : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      Custom scenario active
                    </span>
                  )}
                </div>
                <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  Andwell Maine — Innovation and Growth Plan
                </p>
                <h1 className={`mt-2 max-w-3xl text-2xl font-semibold leading-tight tracking-tight md:text-[2rem] ${dark ? "text-white" : "text-slate-950"}`}>
                  Home Health and Hospice Market Intelligence Dashboard
                </h1>
                <p className={`mt-3 max-w-3xl text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                  County opportunity, referral planning, competitor intelligence, and modeled financial upside in one executive workspace.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[28rem] xl:max-w-[32rem]">
                {headerMetrics.map((metric) => (
                  <div
                    key={metric.label}
                    className={`rounded-2xl border px-4 py-3 backdrop-blur-sm ${
                      dark
                        ? "border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "border-slate-200 bg-white/80 shadow-sm shadow-slate-200/60"
                    }`}
                  >
                    <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                      {metric.label}
                    </p>
                    <p className={`mt-2 text-xl font-bold tabular-nums ${dark ? "text-white" : "text-slate-900"}`}>
                      {metric.value}
                    </p>
                    <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{metric.detail}</p>
                  </div>
                ))}
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
          <div className="print:hidden sticky top-3 z-20 space-y-3">
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

            {/* ── Tools bar ── */}
            <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-3 ${dark ? "border-slate-800 bg-slate-900/80 backdrop-blur-sm" : "border-slate-200 bg-white/90 backdrop-blur-sm"} shadow-lg shadow-slate-900/5`}>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                <Lightbulb className="h-3.5 w-3.5" />
                Workspace tools
              </div>
              <button
                onClick={() => { setShowCompare((p) => !p); if (showScenario) setShowScenario(false); }}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-100 ${
                  showCompare
                    ? "bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <ArrowRightLeft className="h-3.5 w-3.5" />
                {showCompare ? "Hide Compare" : "Compare scenarios"}
              </button>
              <button
                onClick={() => { setShowScenario((p) => !p); if (showCompare) setShowCompare(false); }}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-100 ${
                  showScenario
                    ? "bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {showScenario ? "Hide scenario model" : "Scenario model"}
              </button>
              <button
                onClick={() => setShowInsights((p) => !p)}
                className={`relative inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors duration-100 ${
                  showInsights
                    ? "bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                    : dark
                      ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showInsights ? "Hide insights" : "Insights"}
                {!showInsights && insightCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                    {insightCount}
                  </span>
                )}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className={`hidden items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] md:inline-flex ${dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
                  <Download className="h-3.5 w-3.5" />
                  Export
                </span>
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

      <AskPanel rows={rows} totals={totals} activeTab={activeTab} selectedCounty={selectedCounty} />

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
