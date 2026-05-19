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

  const insightsEngine = useMemo(() => new InsightsEngine(rows, totals), [rows, totals]);
  const insights = useMemo(() => insightsEngine.getAllInsights(), [insightsEngine]);

  return (
    <div className="container-page">
      {/* Sidebar */}
      <aside className="container-sidebar">
        {/* Header */}
        <div style={{ padding: "2rem 1.5rem", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>Andwell</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-tertiary)", margin: "0.5rem 0 0 0" }}>Growth Plan</p>
          </div>
          <button
            onClick={toggle}
            style={{
              padding: "0.5rem",
              borderRadius: "0.5rem",
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              color: dark ? "#fbbf24" : "#94a3b8",
              cursor: "pointer",
              transition: "all 250ms ease",
              fontSize: "1rem"
            }}
          >
            {dark ? "☀" : "🌙"}
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0.75rem" }}>
          <h6 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", padding: "0 1rem", marginBottom: "1rem", margin: 0 }}>
            Views
          </h6>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`nav-item w-full text-left ${activeTab === tab ? "active" : ""}`}
                style={{
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: activeTab === tab ? 500 : 400,
                  borderRadius: "0.5rem",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        {/* Actions */}
        <div style={{ borderTop: "1px solid var(--color-border)", padding: "1rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <button
            onClick={() => {
              setShowScenario((p) => !p);
              if (showCompare) setShowCompare(false);
            }}
            className={`nav-item w-full text-left ${showScenario ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
          >
            {showScenario ? "✓" : "○"} Scenario Model
          </button>
          <button
            onClick={() => {
              setShowCompare((p) => !p);
              if (showScenario) setShowScenario(false);
            }}
            className={`nav-item w-full text-left ${showCompare ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
          >
            {showCompare ? "✓" : "○"} Compare
          </button>
          <button
            onClick={() => setShowInsights((p) => !p)}
            className={`nav-item w-full text-left ${showInsights ? "active" : ""}`}
            style={{ padding: "0.75rem 1rem", fontSize: "0.875rem" }}
          >
            {showInsights ? "✓" : "○"} Insights
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="container-main">
        {/* Header */}
        <header className="container-header" style={{ background: "linear-gradient(135deg, rgba(31, 41, 55, 0.3) 0%, rgba(15, 23, 42, 0.15) 100%)" }}>
          <div>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>{activeTab}</h1>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-tertiary)", margin: "0.5rem 0 0 0" }}>Professional healthcare analytics & insights</p>
          </div>
          <ExportButton targetId="tab-content" filename={`Andwell - ${activeTab}`} />
        </header>

        {/* Content */}
        <div className="container-content">
          <div className="content-area">
            {showScenario && (
              <div style={{ marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                <ScenarioPanel scenario={scenario} setScenario={setScenario} />
                <ScenarioManager />
              </div>
            )}

            {showCompare && (
              <div style={{ marginBottom: "2rem" }}>
                <ScenarioCompare currentScenario={scenario} />
              </div>
            )}

            {showInsights && (
              <div style={{ marginBottom: "2rem" }}>
                <InsightsPanel insights={insights} onActionClick={(county) => setSelectedCounty(county)} />
              </div>
            )}

            <div id="tab-content" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
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
