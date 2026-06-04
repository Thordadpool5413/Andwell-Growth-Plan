import React, { useMemo, useState, useEffect, useCallback } from "react";
import { DEFAULT_SCENARIO } from "./data/constants.js";
import DataSourceBanner from "./components/DataSourceBanner.jsx";
import { buildRows } from "./utils/calculations.js";
import { DarkModeProvider, useDarkMode } from "./components/DarkModeContext.jsx";
import { ToastProvider, useToast } from "./components/ToastContainer.jsx";
import ScenarioPanel from "./components/ScenarioPanel.jsx";
import ScenarioCompare from "./components/ScenarioCompare.jsx";
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
import {
  Activity,
  ArrowRightLeft,
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  Database,
  FileText,
  LayoutDashboard,
  LineChart,
  Map,
  Menu,
  MoonStar,
  SlidersHorizontal,
  Sparkles,
  SunMedium,
  Target,
  Users,
  X,
} from "lucide-react";

const NAV_SECTIONS = [
  {
    label: "Planning",
    items: [
      {
        id: "Executive View",
        title: "Executive View",
        description: "Leadership summary across revenue, referrals, margin, and priority markets.",
        icon: LayoutDashboard,
      },
      {
        id: "County Plan",
        title: "County Plan",
        description: "County-by-county launch prioritization, map context, and local opportunity fit.",
        icon: Map,
      },
      {
        id: "Referral Plan",
        title: "Referral Plan",
        description: "Referral source planning, volume assumptions, and start targets.",
        icon: Users,
      },
      {
        id: "Opportunity Score",
        title: "Opportunity Score",
        description: "Composite scoring across market size, competition, and strategic fit.",
        icon: Target,
      },
    ],
  },
  {
    label: "Competitive",
    items: [
      {
        id: "Competitive View",
        title: "Competitive View",
        description: "Competitor presence, beneficiary share, and local threat by county.",
        icon: Building2,
      },
      {
        id: "Market Dynamics",
        title: "Market Dynamics",
        description: "Narrative market movement, share shifts, and positioning signals.",
        icon: Activity,
      },
      {
        id: "CMS Data",
        title: "CMS Data",
        description: "Raw provider and beneficiary context from CMS-certified market data.",
        icon: Database,
      },
    ],
  },
  {
    label: "Financial",
    items: [
      {
        id: "Financial Model",
        title: "Financial Model",
        description: "Modeled financial outcomes, scaling assumptions, and contribution view.",
        icon: BarChart3,
      },
      {
        id: "Sensitivity",
        title: "Sensitivity",
        description: "Assumption stress-testing across timing, capture, referrals, and revenue.",
        icon: LineChart,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "Staffing Model",
        title: "Staffing Model",
        description: "FTE planning, staffing ramp, and operational capacity requirements.",
        icon: Users,
      },
      {
        id: "Launch Timeline",
        title: "Launch Timeline",
        description: "Launch sequencing, milestones, and market activation timing.",
        icon: Calendar,
      },
      {
        id: "Board Report",
        title: "Board Report",
        description: "Board-ready narrative, growth case, risk framing, and decision summary.",
        icon: FileText,
      },
      {
        id: "Launch Checklist",
        title: "Launch Checklist",
        description: "Execution checklist covering compliance, operating readiness, and go-live tasks.",
        icon: CheckSquare,
      },
    ],
  },
];

const VIEW_INDEX = NAV_SECTIONS.flatMap((section) =>
  section.items.map((item) => ({ ...item, section: section.label })),
);

const VIEW_META = Object.fromEntries(VIEW_INDEX.map((item) => [item.id, item]));
const COUNTY_CONTEXT_VIEWS = new Set(["County Plan", "Competitive View", "Market Dynamics"]);
const EXPORTABLE_VIEWS = new Set([
  "Executive View",
  "County Plan",
  "Referral Plan",
  "Competitive View",
  "CMS Data",
  "Financial Model",
  "Sensitivity",
  "Board Report",
]);

function NavRail({ dark, activeTab, onSelect, onClose }) {
  return (
    <nav className="space-y-6" aria-label="Workspace navigation">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className={`px-3 text-[10px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
            {section.label}
          </p>
          <div className="mt-2 space-y-1.5">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    onClose?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-200 ${
                    active
                      ? dark
                        ? "border-emerald-500/35 bg-slate-900 text-white shadow-[0_18px_40px_-28px_rgba(16,185,129,0.8)]"
                        : "border-emerald-200 bg-white text-slate-950 shadow-[0_20px_50px_-32px_rgba(15,118,110,0.45)]"
                      : dark
                        ? "border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-200"
                        : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-white/90 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                      active
                        ? dark
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : dark
                          ? "border-slate-800 bg-slate-950 text-slate-500 group-hover:text-slate-300"
                          : "border-slate-200 bg-slate-50 text-slate-500 group-hover:text-slate-700"
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-semibold ${active ? (dark ? "text-white" : "text-slate-950") : ""}`}>
                      {item.title}
                    </span>
                    <span className={`mt-1 block text-xs leading-5 ${dark ? (active ? "text-slate-300" : "text-slate-500") : active ? "text-slate-600" : "text-slate-500"}`}>
                      {item.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ContextChip({ dark, children, tone = "neutral" }) {
  const tones = {
    neutral: dark
      ? "border-slate-800 bg-slate-900/80 text-slate-300"
      : "border-slate-200 bg-white text-slate-600",
    accent: dark
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning: dark
      ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
      : "border-amber-200 bg-amber-50 text-amber-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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

  const activeView = VIEW_META[activeTab] ?? VIEW_META["Executive View"];
  const scenarioIsDefault = useMemo(
    () =>
      scenario.conversionRate === DEFAULT_SCENARIO.conversionRate &&
      JSON.stringify(scenario.hhCapture) === JSON.stringify(DEFAULT_SCENARIO.hhCapture) &&
      JSON.stringify(scenario.woundCapture) === JSON.stringify(DEFAULT_SCENARIO.woundCapture) &&
      JSON.stringify(scenario.therapyCapture) === JSON.stringify(DEFAULT_SCENARIO.therapyCapture),
    [scenario],
  );

  const insightsEngine = useMemo(() => new InsightsEngine(rows, totals), [rows, totals]);
  const insights = useMemo(() => insightsEngine.getAllInsights(), [insightsEngine]);
  const insightCount = useMemo(
    () => (insights.recommendations?.length || 0) + (insights.anomalies?.length || 0) + (insights.risks?.length || 0),
    [insights],
  );

  const activateView = useCallback((nextTab) => {
    setActiveTab(nextTab);
    setShowScenario(false);
    setShowCompare(false);
    setShowInsights(false);
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleNavigate = useCallback(({ tab, county }) => {
    if (county) setSelectedCounty(county);
    if (tab) {
      setActiveTab(tab);
    }
    setShowScenario(false);
    setShowCompare(false);
    setShowInsights(false);
    setShowScenarioSidebar(false);
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById("tab-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleApplyScenario = useCallback(
    (nextScenario) => {
      setScenario(nextScenario);
      addToast("Smart plan applied", "success");
    },
    [addToast],
  );

  const financialActionPage = activeTab === "Financial Model" || activeTab === "Sensitivity";
  const exportActionPage = EXPORTABLE_VIEWS.has(activeTab);

  const renderActiveView = () => {
    switch (activeTab) {
      case "Executive View":
        return <ExecutiveView rows={rows} totals={totals} />;
      case "County Plan":
        return (
          <CountyPlan
            rows={rows}
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
            competitorProviderType={competitorProviderType}
            setCompetitorProviderType={setCompetitorProviderType}
            mapLayer={mapLayer}
            setMapLayer={setMapLayer}
          />
        );
      case "Referral Plan":
        return <ReferralPlan rows={rows} />;
      case "Competitive View":
        return (
          <CompetitiveView
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
            competitorProviderType={competitorProviderType}
            setCompetitorProviderType={setCompetitorProviderType}
          />
        );
      case "Market Dynamics":
        return (
          <MarketDynamicsView
            setActiveTab={activateView}
            selectedCounty={selectedCounty}
            setSelectedCounty={setSelectedCounty}
          />
        );
      case "CMS Data":
        return <CmsData />;
      case "Financial Model":
        return <FinancialModel rows={rows} />;
      case "Staffing Model":
        return <StaffingModel rows={rows} />;
      case "Sensitivity":
        return <SensitivityAnalysis rows={rows} />;
      case "Opportunity Score":
        return <OpportunityScore rows={rows} />;
      case "Launch Timeline":
        return <LaunchTimeline rows={rows} />;
      case "Board Report":
        return <BoardReport rows={rows} totals={totals} />;
      case "Launch Checklist":
        return <LaunchChecklist />;
      default:
        return <ExecutiveView rows={rows} totals={totals} />;
    }
  };

  const actionButtonClass = dark
    ? "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/90 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
    : "inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900";

  return (
    <div className={`dashboard-shell min-h-screen transition-colors duration-300 ${dark ? "bg-slate-950 text-slate-100" : "bg-[#f7f5ef] text-slate-900"}`}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px]">
        <aside
          className={`sticky top-0 hidden h-screen w-[18.5rem] shrink-0 overflow-hidden border-r px-5 py-6 lg:flex lg:flex-col ${
            dark ? "border-slate-800 bg-slate-950/95" : "border-[#e3ddd0] bg-[#f6f1e7]/95"
          }`}
        >
          <div className="mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${dark ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-emerald-200 bg-white text-emerald-700"}`}>
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                  Andwell
                </p>
                <h2 className={`mt-1 text-lg font-semibold tracking-tight ${dark ? "text-white" : "text-slate-950"}`}>
                  Growth Workspace
                </h2>
              </div>
            </div>
            <p className={`mt-4 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
              Market intelligence, growth planning, and board-ready operating decisions in one executive workspace.
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <NavRail dark={dark} activeTab={activeTab} onSelect={activateView} />
          </div>

          <div className={`mt-6 shrink-0 rounded-[24px] border p-4 ${dark ? "border-slate-800 bg-slate-900/80" : "border-[#e4ddd1] bg-white/90"}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
              Live context
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Selected county</span>
                <span className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-900"}`}>{selectedCounty}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>Scenario mode</span>
                <span className={`text-sm font-semibold ${scenarioIsDefault ? (dark ? "text-slate-300" : "text-slate-700") : dark ? "text-amber-300" : "text-amber-700"}`}>
                  {scenarioIsDefault ? "Baseline" : "Custom"}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowScenarioSidebar(true)}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                dark ? "bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Scenario controls
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm lg:hidden" onClick={() => setMobileNavOpen(false)} aria-hidden="true" />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[20rem] max-w-[86vw] flex-col overflow-hidden border-r px-5 py-5 transition-transform duration-300 lg:hidden ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          } ${dark ? "border-slate-800 bg-slate-950" : "border-[#e3ddd0] bg-[#f6f1e7]"}`}
          aria-label="Mobile workspace navigation"
        >
          <div className="shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-400"}`}>
                  Andwell
                </p>
                <h2 className={`mt-1 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>
                  Growth Workspace
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className={`rounded-full p-2 ${dark ? "text-slate-400 hover:bg-slate-900 hover:text-white" : "text-slate-500 hover:bg-white hover:text-slate-900"}`}
                aria-label="Close navigation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div>
              <p className={`mt-3 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
                Navigate the full planning workspace with a persistent grouped view structure.
              </p>
            </div>
          </div>
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto overscroll-contain pb-10 pr-1">
            <NavRail dark={dark} activeTab={activeTab} onSelect={activateView} onClose={() => setMobileNavOpen(false)} />
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ${showScenarioSidebar ? "xl:pr-[22rem]" : ""}`}>
          <header
            className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
              dark ? "border-slate-800 bg-slate-950/85" : "border-[#e4ddd1] bg-[#f7f5ef]/90"
            }`}
          >
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(true)}
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border lg:hidden ${
                    dark ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                    {activeView.section}
                  </p>
                  <p className={`truncate text-sm font-semibold ${dark ? "text-white" : "text-slate-950"}`}>
                    {activeView.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowScenarioSidebar(true)}
                  className={actionButtonClass}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="hidden sm:inline">Scenario controls</span>
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className={actionButtonClass}
                  aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
                  title={dark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {dark ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                  <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
            <div className="mx-auto max-w-7xl space-y-4">
              <div className="print:hidden">
                <DataSourceBanner />
              </div>

              <section
                className={`rounded-[30px] border px-5 py-5 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.35)] transition-colors sm:px-6 sm:py-6 ${
                  dark ? "border-slate-800 bg-slate-900/90" : "border-[#e5ded2] bg-white/90"
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ContextChip dark={dark} tone="accent">{activeView.section}</ContextChip>
                      {COUNTY_CONTEXT_VIEWS.has(activeTab) && <ContextChip dark={dark}>{selectedCounty} County</ContextChip>}
                      {!scenarioIsDefault && <ContextChip dark={dark} tone="warning">Custom scenario active</ContextChip>}
                    </div>
                    <div className="mt-4">
                      <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                        Andwell Maine Growth Plan
                      </p>
                      <h1 className={`mt-2 text-3xl font-semibold tracking-tight sm:text-[2.2rem] ${dark ? "text-white" : "text-slate-950"}`}>
                        {activeView.title}
                      </h1>
                      <p className={`mt-3 max-w-3xl text-sm leading-6 sm:text-[15px] ${dark ? "text-slate-400" : "text-slate-600"}`}>
                        {activeView.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 xl:max-w-[30rem] xl:justify-end">
                    {financialActionPage && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowCompare((prev) => !prev);
                          if (showScenario) setShowScenario(false);
                        }}
                        className={actionButtonClass}
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                        {showCompare ? "Hide comparison" : "Compare scenarios"}
                      </button>
                    )}
                    {financialActionPage && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowScenario((prev) => !prev);
                          if (showCompare) setShowCompare(false);
                        }}
                        className={actionButtonClass}
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                        {showScenario ? "Hide model" : "Scenario model"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowInsights((prev) => !prev)}
                      className={actionButtonClass}
                    >
                      <Sparkles className="h-4 w-4" />
                      {showInsights ? "Hide insights" : `Insights${insightCount > 0 ? ` (${insightCount})` : ""}`}
                    </button>
                    {exportActionPage && (
                      <ExportButton
                        targetId="tab-content"
                        filename={`Andwell - ${activeTab}`}
                        variant="outline"
                        className={dark ? "rounded-full border-slate-700 bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white" : "rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"}
                      />
                    )}
                  </div>
                </div>
              </section>

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
                <div key={activeTab} className="tab-fade-in">
                  {renderActiveView()}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      <AskPanel
        rows={rows}
        totals={totals}
        activeTab={activeTab}
        selectedCounty={selectedCounty}
        mapLayer={mapLayer}
        competitorProviderType={competitorProviderType}
        scenarioOpen={showScenarioSidebar}
      />

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
