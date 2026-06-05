import React, { useMemo, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { PieChart, Pie, Cell } from "recharts";
import ChartContainer from "../components/ChartContainer.jsx";
import Card from "../components/Card.jsx";
import Badge from "../components/Badge.jsx";
import Abbr from "../components/Abbr.jsx";
import AiBadge from "../components/AiBadge.jsx";
import Metric from "../components/Metric.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { rollupByService, getOpportunityScore, getCompetitiveThreatScore, getMarketPenetration } from "../utils/calculations.js";
import { streamChat, buildBoardNarrativePrompt, AI_AVAILABLE } from "../utils/ai.js";
import { currency, number, percent } from "../utils/formatters.js";
import { useSortableTable, SortTh } from "../hooks/useSortableTable.jsx";

const CMS_LAST_SYNCED = "2026-05-01";
const CMS_DISPLAY_DATE = "May 2026";

const trafficLight = (value, thresholds) => {
  if (value >= thresholds.green) return { color: "bg-emerald-500", label: "On track", tone: "green" };
  if (value >= thresholds.amber) return { color: "bg-amber-500", label: "Watch", tone: "amber" };
  return { color: "bg-red-500", label: "At risk", tone: "red" };
};

const CONFIDENCE_INPUTS = [
  {
    name: "Market beneficiary volumes",
    type: "CMS verified",
    typeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    description: "CMS 2024 geographic data and 2023 provider files — FFS beneficiary counts by county and service type.",
    lastUpdated: CMS_DISPLAY_DATE,
  },
  {
    name: "Named competitor data",
    type: "CMS verified",
    typeClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    dot: "bg-emerald-500",
    description: "CMS provider file beneficiary volume, episodes, and payment data for named competitors.",
    lastUpdated: CMS_DISPLAY_DATE,
  },
  {
    name: "Revenue projections (Y1–Y3)",
    type: "Modeled assumption",
    typeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-400",
    description: "CMS volumes × internal capture rate × Medicare reimbursement rates. Adjust via Scenario Model.",
    lastUpdated: "Internal — current model version",
  },
  {
    name: "Referral conversion rate",
    type: "Industry benchmark",
    typeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    dot: "bg-blue-400",
    description: "75% referral-to-start rate — NAHC 2023 median for home health and hospice providers.",
    lastUpdated: "NAHC 2023",
  },
  {
    name: "Contribution margin rates",
    type: "Modeled assumption",
    typeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    dot: "bg-amber-400",
    description: "Service-line margins applied to modeled gross revenue — internal planning assumptions, not audited financials.",
    lastUpdated: "Internal — current model version",
  },
];

export default function BoardReport({ rows, totals }) {
  const { dark } = useDarkMode();
  const reportRef = useRef(null);
  const counties = [...new Set(rows.map((r) => r.county))];
  const serviceMix = useMemo(() => rollupByService(rows), [rows]);

  const [narrativeText, setNarrativeText] = useState("");
  const [narrativeGenerating, setNarrativeGenerating] = useState(false);
  const [narrativeError, setNarrativeError] = useState(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(null);

  const countyStatus = useMemo(() => {
    return counties.map((county) => {
      const threat = getCompetitiveThreatScore(county);
      const pen = getMarketPenetration(county, rows);
      const opp = getOpportunityScore(county, rows);
      const countyRows = rows.filter((r) => r.county === county);
      const y1Rev = countyRows.reduce((s, r) => s + r.revenue[0], 0);
      const y3Rev = countyRows.reduce((s, r) => s + r.revenue[2], 0);

      const threatStatus = trafficLight(100 - (threat?.score || 0), { green: 60, amber: 40 });
      const penStatus = trafficLight((pen?.y1Penetration || 0) * 100, { green: 5, amber: 2 });

      return {
        county,
        launchGroup: countyRows[0]?.launchGroup || "—",
        y1Rev,
        y3Rev,
        threatScore: threat?.score || 0,
        threatLevel: threat?.level || "—",
        threatStatus,
        penetration: pen?.y1Penetration || 0,
        penStatus,
        oppScore: opp?.score || 0,
      };
    }).sort((a, b) => b.oppScore - a.oppScore);
  }, [rows]);

  const riskCounties = countyStatus.filter((c) => c.threatScore > 60 || c.penetration < 0.02);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const { sorted: sortedCounties, sortKey: cSortKey, sortDir: cSortDir, toggleSort: cToggleSort } = useSortableTable(countyStatus, "oppScore", "desc");

  const generateNarrative = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setNarrativeText("");
    setNarrativeError(null);
    setNarrativeGenerating(true);
    setCopied(false);

    streamChat({
      messages: buildBoardNarrativePrompt(countyStatus, totals),
      signal: controller.signal,
      onChunk: (_, full) => setNarrativeText(full),
      onDone: () => setNarrativeGenerating(false),
      onError: (err) => {
        setNarrativeError(err.message);
        setNarrativeGenerating(false);
      },
    });
  }, [countyStatus, totals]);

  const handleCopy = useCallback(() => {
    if (!narrativeText) return;
    navigator.clipboard.writeText(narrativeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [narrativeText]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-semibold uppercase tracking-wide ${dark ? "text-blue-400" : "text-blue-600"}`}>Board report</p>
          <h2 className={`text-xl font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>Andwell Growth Plan — Executive Summary</h2>
        </div>
        <div className="flex items-center gap-2">
          {AI_AVAILABLE && (
            <button
              onClick={generateNarrative}
              disabled={narrativeGenerating}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-100 disabled:opacity-50 ${
                dark
                  ? "bg-blue-700 text-white hover:bg-blue-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {narrativeGenerating ? "Drafting…" : "Draft narrative"}
            </button>
          )}
          <button
            onClick={handlePrint}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-100 ${dark ? "bg-blue-600 text-white hover:bg-blue-500" : "bg-blue-600 text-white hover:bg-blue-700"}`}
          >
            Print / PDF
          </button>
        </div>
      </div>

      {(narrativeText || narrativeGenerating || narrativeError) && (
        <AiBadge
          label="Board narrative"
          generating={narrativeGenerating}
          onRegenerate={!narrativeGenerating ? generateNarrative : undefined}
          prose
        >
          {narrativeError ? (
            <p className={`text-sm ${dark ? "text-red-400" : "text-red-600"}`}>{narrativeError}</p>
          ) : narrativeText ? (
            <>
              <ReactMarkdown>{narrativeText}</ReactMarkdown>
              {narrativeGenerating && (
                <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-violet-400" />
              )}
              {!narrativeGenerating && (
                <button
                  onClick={handleCopy}
                  className={`mt-3 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    copied
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : dark
                      ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                      : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {copied ? "✓ Copied" : "Copy to clipboard"}
                </button>
              )}
            </>
          ) : (
            <p className={`text-sm ${dark ? "text-slate-500" : "text-slate-400"}`}>Drafting executive summary…</p>
          )}
        </AiBadge>
      )}

      <div ref={reportRef} className="space-y-6 print:space-y-4">
        <div className="board-report-cover grid gap-4 md:grid-cols-4">
          <Metric
            label="Active counties"
            value={counties.length}
            detail="County markets in phased launch plan"
            color="blue"
          />
          <Metric
            label="Year 1 revenue"
            value={currency(totals.y1Revenue)}
            detail="Projected first-year net revenue"
            sparkData={[totals.y1Revenue, totals.y2Revenue, totals.y3Revenue]}
            sparkColor={COLORS.blue}
            color="blue"
          />
          <Metric
            label="Year 3 revenue"
            value={currency(totals.y3Revenue)}
            detail="Full-ramp revenue by end of Year 3"
            color="emerald"
          />
          <Metric
            label="3-year contribution"
            value={currency(totals.totalContribution)}
            detail="Cumulative operating contribution margin"
            color="blue"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr] print:break-after-page">
          <Card title="County status matrix" eyebrow="Traffic light indicators">
            <div className={`mb-3 rounded-xl border px-4 py-2.5 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-100 bg-slate-50"}`}>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <p className={`text-[10px] font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-500" : "text-slate-400"}`}>Traffic light key</p>
                {[
                  { color: "bg-emerald-500", label: "On track", sub: "≥60% position (threat ≤40)" },
                  { color: "bg-amber-500", label: "Watch", sub: "40–59% position (threat 41–60)" },
                  { color: "bg-red-500", label: "At risk", sub: "<40% position (threat >60)" },
                ].map(({ color, label, sub }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${color}`} />
                    <span className={`text-[10px] font-semibold ${dark ? "text-slate-300" : "text-slate-600"}`}>{label}</span>
                    <span className={`text-[10px] ${dark ? "text-slate-500" : "text-slate-400"}`}>{sub}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`mb-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${dark ? "border-amber-900/40 bg-amber-950/30 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
              <span><span className="font-semibold"><Abbr term="Provider File Share">Provider file share</Abbr> ≠ market share.</span> Revenue figures are modeled from <Abbr term="CMS">CMS</Abbr> provider file beneficiary volume — a proxy for relative market position, not independently verified county market share. True market share requires county-attributed claims data not available in this dataset.</span>
            </div>
            <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
              <table className="w-full text-left text-sm">
                <thead className={`sticky top-0 z-10 text-xs uppercase tracking-wide ${dark ? "bg-slate-700/80 text-slate-400 backdrop-blur" : "bg-slate-50 text-slate-500 shadow-sm"}`}>
                  <tr>
                    <SortTh sortKey="county" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3">County</SortTh>
                    <SortTh sortKey="launchGroup" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3">Priority</SortTh>
                    <SortTh sortKey="y1Rev" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3 text-right">Y1 rev</SortTh>
                    <SortTh sortKey="threatScore" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3 text-center">Competition</SortTh>
                    <SortTh sortKey="penetration" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3 text-center"><Abbr term="Market Penetration">Penetration</Abbr></SortTh>
                    <SortTh sortKey="oppScore" currentKey={cSortKey} currentDir={cSortDir} onSort={cToggleSort} className="px-4 py-3 text-center">Opp score</SortTh>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                  {sortedCounties.map((c, i) => (
                    <tr key={c.county} className={dark ? i % 2 === 1 ? "bg-slate-800/60 hover:bg-slate-700/50" : "hover:bg-slate-700/50" : i % 2 === 1 ? "bg-slate-50/60 hover:bg-slate-50" : "hover:bg-slate-50"}>
                      <td className={`px-4 py-3 font-semibold ${dark ? "text-slate-100" : "text-slate-800"}`}>{c.county}</td>
                      <td className="px-4 py-3">
                        <Badge tone={c.launchGroup.includes("1") ? "green" : c.launchGroup.includes("2") ? "blue" : "amber"}>
                          {c.launchGroup}
                        </Badge>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${dark ? "text-blue-400" : "text-blue-700"}`}>{currency(c.y1Rev)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.threatStatus.color}`} />
                          <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{c.threatScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${c.penStatus.color}`} />
                          <span className={`text-xs ${dark ? "text-slate-300" : "text-slate-600"}`}>{percent(c.penetration)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge tone={c.oppScore >= 70 ? "green" : c.oppScore >= 50 ? "blue" : c.oppScore >= 35 ? "amber" : "slate"}>
                          {c.oppScore}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="space-y-6">
            <Card title="Y1 service mix" eyebrow="Revenue breakdown">
              <ChartContainer height="h-52" caption="Source: scenario model — Y1 projected revenue by service line">
                <PieChart>
                  <Pie data={serviceMix} dataKey="revenue" nameKey="service" cx="50%" cy="50%" outerRadius={80} label={({ service, revenue }) => `${service}: ${currency(revenue)}`}>
                    {serviceMix.map((entry) => (
                      <Cell key={entry.service} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
            </Card>

            {riskCounties.length > 0 && (
              <Card title="Risk flags" eyebrow="Requires attention" accent="red">
                <div className="space-y-2">
                  {riskCounties.map((c) => (
                    <div key={c.county} className={`rounded-xl border p-3 ${dark ? "border-red-900 bg-red-950/30" : "border-red-200 bg-red-50"}`}>
                      <p className={`text-sm font-semibold ${dark ? "text-red-400" : "text-red-700"}`}>{c.county}</p>
                      <p className={`text-xs mt-1 ${dark ? "text-red-400/70" : "text-red-600"}`}>
                        {c.threatScore > 60 ? `Threat score ${c.threatScore}/100 (${c.threatLevel}). ` : ""}
                        {c.penetration < 0.02 ? `Penetration ${percent(c.penetration)} below 2% threshold.` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>

        <Card title="Financial trajectory" eyebrow="3-year revenue projection" className="print:break-before-page">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Year 1", value: totals.y1Revenue, color: dark ? "text-blue-400" : "text-blue-700", accent: "border-l-4 border-l-blue-500" },
              { label: "Year 2", value: totals.y2Revenue, color: dark ? "text-slate-300" : "text-slate-600", accent: "border-l-4 border-l-slate-400" },
              { label: "Year 3", value: totals.y3Revenue, color: dark ? "text-emerald-400" : "text-emerald-600", accent: "border-l-4 border-l-emerald-500" },
            ].map((yr) => (
              <div key={yr.label} className={`rounded-xl border p-5 text-center ${yr.accent} ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-200 bg-slate-50"}`}>
                <p className={`text-xs font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>{yr.label}</p>
                <p className={`mt-2 text-2xl font-bold tabular-nums ${yr.color}`}>{currency(yr.value)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className={`rounded-xl border p-4 text-center border-l-4 border-l-slate-300 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Y1→Y2 growth</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">
                +{totals.y1Revenue > 0 ? Math.round((totals.y2Revenue - totals.y1Revenue) / totals.y1Revenue * 100) : 0}%
              </p>
            </div>
            <div className={`rounded-xl border p-4 text-center border-l-4 border-l-slate-300 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>Y2→Y3 growth</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-emerald-600">
                +{totals.y2Revenue > 0 ? Math.round((totals.y3Revenue - totals.y2Revenue) / totals.y2Revenue * 100) : 0}%
              </p>
            </div>
            <div className={`rounded-xl border p-4 text-center border-l-4 border-l-slate-400 ${dark ? "border-slate-700/60 bg-slate-700/20" : "border-slate-200 bg-slate-50"}`}>
              <p className={`text-xs font-medium uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-500"}`}>3-year total revenue</p>
              <p className={`mt-1 text-xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-800"}`}>
                {currency(totals.y1Revenue + totals.y2Revenue + totals.y3Revenue)}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Data confidence summary" eyebrow="Source transparency for board review" className="print:break-before-page">
          <p className={`mb-4 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>
            Before acting on the numbers above, board members should understand which inputs are independently verified versus modeled planning assumptions. The table below summarizes the confidence level and provenance for each key input.
          </p>
          <div className={`overflow-x-auto rounded-lg border ${dark ? "border-slate-700/60" : "border-slate-200"}`}>
            <table className="w-full text-left text-sm">
              <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                <tr>
                  <th className="px-4 py-3">Input</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Last updated</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                {CONFIDENCE_INPUTS.map((input, i) => (
                  <tr key={input.name} className={dark ? i % 2 === 1 ? "bg-slate-800/60" : "" : i % 2 === 1 ? "bg-slate-50/60" : ""}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${input.dot}`} />
                        <span className={`font-semibold text-sm ${dark ? "text-slate-100" : "text-slate-800"}`}>{input.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium ${input.typeClass}`}>
                        {input.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>{input.description}</td>
                    <td className={`px-4 py-3 text-right text-[10px] font-semibold ${dark ? "text-slate-500" : "text-slate-400"}`}>{input.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className={`mt-4 flex flex-wrap items-center gap-4 rounded-xl border px-4 py-3 text-xs ${dark ? "border-slate-700 bg-slate-800/40 text-slate-400" : "border-slate-200 bg-white text-slate-500"}`}>
            <span className="font-semibold">Legend:</span>
            {[
              { dot: "bg-emerald-500", label: "CMS verified — sourced directly from CMS certification or provider files" },
              { dot: "bg-amber-400", label: "Modeled assumption — internal planning figure, not externally verified" },
              { dot: "bg-blue-400", label: "Industry benchmark — published third-party standard" },
            ].map(({ dot, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                {label}
              </span>
            ))}
          </div>
        </Card>

        <div className={`text-center text-xs print:mt-8 ${dark ? "text-slate-600" : "text-slate-400"}`}>
          <p>Andwell Maine Innovation and Growth Plan — Board Report</p>
          <p>Generated {today} | Data sources: CMS Provider Files, County Market Data, Modeled Projections</p>
          <p className="mt-1">Key assumptions: 75% <Abbr term="Conversion Rate">conversion rate</Abbr>, Priority 1–3 phased launch, <Abbr term="CMS">CMS</Abbr> reimbursement rates</p>
        </div>
      </div>
    </div>
  );
}
