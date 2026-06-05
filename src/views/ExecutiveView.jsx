import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowRight,
  Compass,
  Database,
  Map,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import CustomTooltip from "../components/CustomTooltip.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import Abbr from "../components/Abbr.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import EstBadge from "../components/EstBadge.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import { namedProviderRows } from "../data/providers.js";
import { getCompetitiveThreatScore, rollupByService } from "../utils/calculations.js";
import { getCountyMarket, getFreshness } from "../data/dashboardData.js";
import { currency, number, percent } from "../utils/formatters.js";
import { getNodeApiToken } from "../utils/ai.js";

const HOME_QUOTE = "Innovation and Growth is where Andwell Health Partners turns vision into infrastructure. We are building the future of high acuity community care, creating post acute partnerships that make us essential to Maine, connecting complex services through technology, and developing the value based contracting model that allows us to take risk, deliver better outcomes, save payers money, and grow because we are built for the complexity others cannot manage.";

const HOME_PILLARS = [
  {
    eyebrow: "Why this exists",
    title: "Turn strategy into an operating case leadership can trust",
    body: "This workspace was created so Andwell can explain why high-acuity community care expansion matters, where the opportunity is strongest, and what evidence supports the case.",
  },
  {
    eyebrow: "How to use it",
    title: "Start here, then move from orientation to decision-making",
    body: "Use this home page to align on the mission, then move into county, competitive, financial, and operational views to test the plan and make decisions.",
  },
  {
    eyebrow: "What it contains",
    title: "One place for market context, model logic, and execution planning",
    body: "The site combines CMS-backed market data, modeled referral and revenue assumptions, competitor detail, staffing logic, and launch planning into a single leadership workspace.",
  },
];

const WORKSPACE_TRACKS = [
  {
    eyebrow: "Planning",
    title: "Where should Andwell go first?",
    body: "County sequencing, referral planning, and opportunity scoring clarify where the launch path is strongest.",
    icon: Map,
    tone: "emerald",
  },
  {
    eyebrow: "Competitive",
    title: "Who already owns each market?",
    body: "Competitive and CMS views show provider presence, local pressure, and the evidence behind each market readout.",
    icon: ShieldCheck,
    tone: "amber",
  },
  {
    eyebrow: "Financial",
    title: "What happens if assumptions change?",
    body: "Financial and sensitivity views pressure-test the model so leadership can see what drives revenue, referrals, and risk.",
    icon: TrendingUp,
    tone: "blue",
  },
  {
    eyebrow: "Operations",
    title: "What does execution require?",
    body: "Staffing, timeline, board, and checklist views convert the growth thesis into an execution plan the organization can actually run.",
    icon: Users,
    tone: "slate",
  },
];

const LEADERSHIP_QUESTIONS = [
  "Why should Andwell build this capability now, and what makes the strategy mission-critical?",
  "Which counties, competitors, and service lines matter most to the first phase of growth?",
  "How much of the story is observed CMS evidence versus modeled planning logic?",
  "What operational and financial decisions should leadership make next if the thesis is approved?",
];

const START_ACTIONS = [
  {
    label: "Open County Plan",
    description: "See where Andwell should sequence entry first and why.",
    tab: "County Plan",
  },
  {
    label: "Review Competitive View",
    description: "Understand local provider pressure before committing to a market.",
    tab: "Competitive View",
  },
  {
    label: "Stress-test the Financial Model",
    description: "Pressure-test modeled revenue and contribution assumptions.",
    tab: "Financial Model",
  },
  {
    label: "Inspect CMS Data",
    description: "Trace the bundled provider and beneficiary evidence behind the plan.",
    tab: "CMS Data",
  },
];

function AtAGlanceIndicator({ label, status, dark }) {
  const colorMap = {
    green: {
      dot: "bg-emerald-500",
      text: dark ? "text-emerald-300" : "text-emerald-800",
      bg: dark ? "bg-emerald-950/30 border-emerald-800/40" : "bg-emerald-100/80 border-emerald-300/70",
    },
    amber: {
      dot: "bg-amber-500",
      text: dark ? "text-amber-300" : "text-amber-800",
      bg: dark ? "bg-amber-950/30 border-amber-800/40" : "bg-amber-100/80 border-amber-300/70",
    },
    red: {
      dot: "bg-red-500",
      text: dark ? "text-red-300" : "text-red-800",
      bg: dark ? "bg-red-950/30 border-red-800/40" : "bg-red-100/80 border-red-300/70",
    },
  };
  const c = colorMap[status] || colorMap.amber;
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-2 ${c.bg}`}>
      <span className={`h-2 w-2 flex-shrink-0 rounded-full ${c.dot}`} />
      <span className={`text-xs font-semibold ${c.text}`}>{label}</span>
    </div>
  );
}

function HomePillar({ eyebrow, title, body, dark }) {
  return (
    <div className={`rounded-[24px] border p-5 ${dark ? "border-slate-800 bg-slate-900/75" : "border-slate-200 bg-white/90"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${dark ? "text-slate-500" : "text-slate-500"}`}>{eyebrow}</p>
      <h3 className={`mt-2 text-lg font-semibold leading-snug ${dark ? "text-white" : "text-slate-950"}`}>{title}</h3>
      <p className={`mt-3 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>{body}</p>
    </div>
  );
}

function WorkspaceTrack({ eyebrow, title, body, icon: Icon, tone, dark }) {
  const toneMap = {
    emerald: dark
      ? "border-emerald-900/60 bg-emerald-950/20 text-emerald-300"
      : "border-emerald-300/80 bg-emerald-100/80 text-emerald-800",
    amber: dark
      ? "border-amber-900/60 bg-amber-950/20 text-amber-300"
      : "border-amber-300/80 bg-amber-100/80 text-amber-800",
    blue: dark
      ? "border-blue-900/60 bg-blue-950/20 text-blue-300"
      : "border-blue-300/80 bg-blue-100/80 text-blue-800",
    slate: dark
      ? "border-slate-700 bg-slate-900/60 text-slate-300"
      : "border-slate-300/80 bg-slate-100/80 text-slate-700",
  };

  return (
    <div className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-slate-50/80"}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${toneMap[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-500"}`}>{eyebrow}</p>
          <h4 className={`mt-1 text-sm font-semibold leading-6 ${dark ? "text-white" : "text-slate-950"}`}>{title}</h4>
          <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-300" : "text-slate-700"}`}>{body}</p>
        </div>
      </div>
    </div>
  );
}

function QualityKPI({ label, value, sub, dark, color = "emerald" }) {
  const colorMap = {
    emerald: {
      bg: dark ? "border-emerald-900/50 bg-emerald-950/18" : "border-emerald-200 bg-emerald-50/85",
      label: dark ? "text-emerald-300" : "text-emerald-800",
      sub: dark ? "text-slate-400" : "text-emerald-900/70",
    },
    blue: {
      bg: dark ? "border-blue-900/50 bg-blue-950/18" : "border-blue-200 bg-blue-50/85",
      label: dark ? "text-blue-300" : "text-blue-800",
      sub: dark ? "text-slate-400" : "text-blue-900/70",
    },
    amber: {
      bg: dark ? "border-amber-900/50 bg-amber-950/18" : "border-amber-200 bg-amber-50/85",
      label: dark ? "text-amber-300" : "text-amber-800",
      sub: dark ? "text-slate-400" : "text-amber-900/70",
    },
    violet: {
      bg: dark ? "border-violet-900/50 bg-violet-950/18" : "border-violet-200 bg-violet-50/85",
      label: dark ? "text-violet-300" : "text-violet-800",
      sub: dark ? "text-slate-400" : "text-violet-900/70",
    },
  };
  const c = colorMap[color] || colorMap.emerald;
  return (
    <div className={`rounded-2xl border p-4 ${c.bg}`}>
      <p className={`text-[11px] font-semibold uppercase tracking-[0.12em] ${c.label}`}>{label}</p>
      <p className={`mt-1.5 text-xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-950"}`}>{value}</p>
      {sub && <p className={`mt-1.5 text-xs leading-5 ${c.sub}`}>{sub}</p>}
    </div>
  );
}

async function getCmsToken() {
  try {
    return await getNodeApiToken();
  } catch {
    return "";
  }
}

export default function ExecutiveView({ rows, totals, onNavigate }) {
  const { dark } = useDarkMode();
  const [qualitySummary, setQualitySummary] = useState(null);
  const freshness = getFreshness();
  const activeCounties = [...new Set(rows.map((row) => row.county))];
  const countyMarkets = activeCounties.map((county) => getCountyMarket(county)).filter((market) => market?.ffs);

  useEffect(() => {
    (async () => {
      try {
        const token = await getCmsToken();
        const response = await fetch("/api/cms/quality-summary", { headers: { "x-ai-token": token } });
        if (response.ok) setQualitySummary(await response.json());
      } catch (_) {}
    })();
  }, []);

  const totalMarket = countyMarkets.reduce((sum, market) => sum + (market.home_health_users || 0) + (market.hospice_users || 0), 0);
  const y1Penetration = totalMarket > 0 ? totals.y1Starts / totalMarket : 0;

  const threatScores = activeCounties
    .map((county) => getCompetitiveThreatScore(county))
    .filter(Boolean);
  const avgThreat = threatScores.length
    ? threatScores.reduce((sum, threat) => sum + threat.score, 0) / threatScores.length
    : 0;

  const totalFFS = countyMarkets.reduce((sum, market) => sum + (market.ffs || 0), 0);
  const annualRevenuePerFfsBeneficiary = totalFFS > 0 ? totals.y1Revenue / totalFFS : 0;
  const annualRevenuePerFfsBeneficiaryDisplay = currency(annualRevenuePerFfsBeneficiary, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const serviceMix = rollupByService(rows)
    .map((row) => ({
      ...row,
      share: totals.y1Revenue > 0 ? row.revenue / totals.y1Revenue : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const marketStatus = y1Penetration >= 0.05 ? "green" : y1Penetration >= 0.02 ? "amber" : "red";
  const competitionStatus = avgThreat < 40 ? "green" : avgThreat < 60 ? "amber" : "red";
  const financialStatus = totals.y1Revenue > 5000000 ? "green" : totals.y1Revenue > 2000000 ? "amber" : "red";

  const homeActionClass = dark
    ? "group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left transition hover:border-slate-700 hover:bg-slate-900"
    : "group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-left transition hover:border-slate-300 hover:bg-slate-50";

  const homeActionDescriptionClass = dark ? "text-slate-400" : "text-slate-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={freshness.generatedAt} label="CMS/HRSA data" syncType="Bundled sources" />
      </div>

      <section className={`overflow-hidden rounded-[32px] border p-6 shadow-[0_28px_70px_-40px_rgba(15,23,42,0.4)] ${dark ? "border-slate-800 bg-slate-900/90" : "border-slate-200 bg-white/95"}`}>
        <div className="grid gap-6 xl:grid-cols-[1.35fr,0.95fr]">
          <div className="space-y-4">
            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${dark ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-emerald-300/80 bg-emerald-100/85 text-emerald-800"}`}>
              Innovation and Growth Home
            </div>
            <div className={`rounded-[28px] border px-5 py-5 ${dark ? "border-emerald-900/60 bg-emerald-950/18" : "border-emerald-200 bg-emerald-50/85"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.24em] ${dark ? "text-emerald-300" : "text-emerald-800"}`}>
                Andwell Vision
              </p>
              <blockquote className={`mt-3 max-w-4xl text-[1.35rem] font-semibold leading-[1.55] tracking-[-0.015em] sm:text-[1.55rem] ${dark ? "text-white" : "text-slate-950"}`}>
                "{HOME_QUOTE}"
              </blockquote>
              <p className={`mt-4 max-w-4xl text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                This home page exists to explain why the workspace was built, how leaders should use it, and what decisions it is meant to support before anyone drops into the deeper planning views.
              </p>
            </div>
          </div>

          <div className={`rounded-[28px] border p-5 ${dark ? "border-slate-800 bg-slate-950/70" : "border-slate-200 bg-slate-50/80"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${dark ? "border-blue-900/60 bg-blue-950/20 text-blue-300" : "border-blue-300/80 bg-blue-100/80 text-blue-800"}`}>
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                  Start here
                </p>
                <h3 className={`mt-1 text-lg font-semibold ${dark ? "text-white" : "text-slate-950"}`}>
                  Use the workspace in the right order
                </h3>
                <p className={`mt-2 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Begin on this page to align on the mission, then move into county, competitor, financial, and CMS evidence views to validate the plan.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2.5">
              {START_ACTIONS.map((action) => (
                <button
                  key={action.tab}
                  type="button"
                  onClick={() => onNavigate?.({ tab: action.tab })}
                  className={homeActionClass}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{action.label}</p>
                    <p className={`mt-1 text-xs leading-5 ${homeActionDescriptionClass}`}>{action.description}</p>
                  </div>
                  <ArrowRight className={`h-4 w-4 shrink-0 ${dark ? "text-slate-500 group-hover:text-slate-300" : "text-slate-500 group-hover:text-slate-800"}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {HOME_PILLARS.map((pillar) => (
          <HomePillar key={pillar.eyebrow} dark={dark} {...pillar} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.08fr,0.92fr]">
        <Card title="How the workspace is organized" eyebrow="Workspace map" accent="blue">
          <div className="grid gap-3 md:grid-cols-2">
            {WORKSPACE_TRACKS.map((track) => (
              <WorkspaceTrack key={track.eyebrow} dark={dark} {...track} />
            ))}
          </div>
        </Card>

        <Card title="Questions this home page should answer" eyebrow="Leadership use" accent="emerald">
          <ul className="space-y-3">
            {LEADERSHIP_QUESTIONS.map((question) => (
              <li key={question} className={`flex gap-3 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${dark ? "bg-emerald-400" : "bg-emerald-600"}`} />
                <span>{question}</span>
              </li>
            ))}
          </ul>

          <div className={`mt-5 rounded-2xl border px-4 py-4 ${dark ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-slate-50/90"}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${dark ? "border-blue-900/60 bg-blue-950/20 text-blue-300" : "border-blue-300/80 bg-blue-100/80 text-blue-800"}`}>
                <Database className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${dark ? "text-slate-500" : "text-slate-500"}`}>
                  Read the model correctly
                </p>
                <p className={`mt-2 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
                  Green and blue elements point to evidence or financial information. Amber elements flag modeled assumptions, caution, or competitive pressure. This page is meant to separate observed CMS evidence from planning logic, not blur them together.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <SectionHeader eyebrow="Current Snapshot" title="What the model says right now">
        This is the leadership snapshot for the current scenario. It summarizes the plan after the home-page orientation so you can move into deeper views with context.
      </SectionHeader>

      <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-4 py-3 ${dark ? "border-slate-700/60 bg-slate-800/40" : "border-slate-200 bg-slate-50/90"}`}>
        <p className={`text-[11px] font-semibold uppercase tracking-wide mr-1 ${dark ? "text-slate-500" : "text-slate-500"}`}>Status</p>
        <AtAGlanceIndicator label="Market Opportunity" status={marketStatus} dark={dark} />
        <AtAGlanceIndicator label="Competitive Position" status={competitionStatus} dark={dark} />
        <AtAGlanceIndicator label="Financial Readiness" status={financialStatus} dark={dark} />
      </div>

      <div className={`rounded-2xl px-5 py-4 ${dark ? "border border-slate-700/60 bg-slate-800/30" : "border border-slate-200 bg-slate-50/70"}`}>
        <div className="grid gap-4 md:grid-cols-4">
          <Metric
            label="Active growth counties"
            value={activeCounties.length}
            detail="Target counties included in the current modeled growth plan."
            color="emerald"
            sourceType="cms"
          />
          <Metric
            label="Year 1 referrals"
            value={number(totals.y1Referrals)}
            detail={<span>Gross referrals at a <EstBadge reason="75% referral-to-start conversion rate — NAHC 2023 median for home health and hospice providers.">Est.</EstBadge> 75% conversion baseline.</span>}
            color="amber"
            sourceType="modeled"
          />
          <Metric
            label="Year 1 revenue"
            value={currency(totals.y1Revenue)}
            detail="Modeled Year 1 gross revenue from all active service lines."
            color="blue"
            sourceType="modeled"
          />
          <Metric
            label="Named competitors"
            value={namedProviderRows.length}
            detail="Home health and hospice provider rows loaded into the competitive layer."
            color="amber"
            sourceType="cms"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className={`rounded-2xl border-l-4 border-l-emerald-500 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-600"}`}>Market penetration (Y1)</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-950"}`}>{percent(y1Penetration)}</p>
          <p className={`mt-2 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-700"}`}>
            <EstBadge reason="Modeled Y1 starts divided by total CMS addressable beneficiary volume — a planning proxy, not observed market share.">Est.</EstBadge>{" "}
            Y1 starts versus the addressable CMS market across {activeCounties.length} target counties ({number(totalMarket)} beneficiary users).
          </p>
        </div>

        <div className={`rounded-2xl border-l-4 border-l-amber-500 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-600"}`}>Average competitive threat</p>
          <div className="mt-2 flex items-center gap-3">
            <p className={`text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-950"}`}>
              {Math.round(avgThreat)}<span className={`text-base font-medium ${dark ? "text-slate-500" : "text-slate-500"}`}>/100</span>
            </p>
            <Badge tone={avgThreat >= 70 ? "red" : avgThreat >= 50 ? "amber" : avgThreat >= 30 ? "blue" : "green"}>
              {avgThreat >= 70 ? "Fortress" : avgThreat >= 50 ? "High" : avgThreat >= 30 ? "Moderate" : "Low"}
            </Badge>
          </div>
          <p className={`mt-2 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-700"}`}>
            Composite weighted pressure score across all {activeCounties.length} target counties.
          </p>
        </div>

        <div className={`rounded-2xl border-l-4 border-l-blue-500 border p-5 ${dark ? "border-slate-700/60 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? "text-slate-400" : "text-slate-600"}`}>Annual modeled Y1 revenue per Medicare <Abbr term="FFS">FFS</Abbr> beneficiary</p>
          <p className={`mt-2 text-3xl font-bold tabular-nums ${dark ? "text-slate-100" : "text-slate-950"}`}>{annualRevenuePerFfsBeneficiaryDisplay}</p>
          <p className={`mt-2 text-xs leading-5 ${dark ? "text-slate-500" : "text-slate-700"}`}>
            <EstBadge reason="Derived: Y1 modeled revenue divided by total CMS Fee-For-Service beneficiary count — not a verified billing figure.">Est.</EstBadge>{" "}
            Literal U.S. dollars per beneficiary per year across the {activeCounties.length}-county target plan, not hundreds or thousands: {currency(totals.y1Revenue)} / {number(totalFFS)} Medicare <Abbr term="FFS">Fee-For-Service</Abbr> beneficiaries = {annualRevenuePerFfsBeneficiaryDisplay}.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
        <Card title="What powers the model" eyebrow="Why the numbers exist" accent="blue">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50/90"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-500"}`}>Counties</p>
              <p className={`mt-2 text-xl font-bold ${dark ? "text-white" : "text-slate-950"}`}>{activeCounties.length}</p>
              <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>Launch counties represented in the active model.</p>
            </div>
            <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50/90"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-500"}`}>Service lines</p>
              <p className={`mt-2 text-xl font-bold ${dark ? "text-white" : "text-slate-950"}`}>{serviceMix.length}</p>
              <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>Modeled programs contributing to revenue and starts.</p>
            </div>
            <div className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-900/60" : "border-slate-200 bg-slate-50/90"}`}>
              <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-500"}`}>Conversion baseline</p>
              <p className={`mt-2 text-xl font-bold ${dark ? "text-white" : "text-slate-950"}`}>75%</p>
              <p className={`mt-1 text-xs leading-5 ${dark ? "text-slate-400" : "text-slate-600"}`}>Referral-to-start planning baseline used across the model.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {serviceMix.map((service) => (
              <div key={service.service} className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-white/90"}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className={`text-sm font-semibold ${dark ? "text-white" : "text-slate-950"}`}>{service.service}</p>
                    <p className={`mt-1 text-xs ${dark ? "text-slate-400" : "text-slate-600"}`}>{currency(service.revenue)} Year 1 modeled revenue</p>
                  </div>
                  <Badge tone={service.share >= 0.4 ? "blue" : service.share >= 0.25 ? "green" : "amber"}>
                    {percent(service.share)} of Y1 revenue
                  </Badge>
                </div>
                <div className={`mt-3 h-2 overflow-hidden rounded-full ${dark ? "bg-slate-800" : "bg-slate-200"}`}>
                  <div className="h-full rounded-full" style={{ width: `${Math.max(service.share * 100, 8)}%`, backgroundColor: service.color }} />
                </div>
              </div>
            ))}
          </div>

          <p className={`mt-5 text-sm leading-7 ${dark ? "text-slate-300" : "text-slate-700"}`}>
            The model combines CMS beneficiary counts, bundled provider-file context, internal capture assumptions, reimbursement assumptions, and a 75% referral conversion baseline. It is designed for planning, not as a substitute for observed claims attribution.
          </p>
        </Card>

        <Card title="3-year revenue trajectory" eyebrow="Growth forecast" accent="emerald">
          <ChartContainer height="h-72" caption="Source: modeled — CMS beneficiary volumes × capture rates × reimbursement rates">
            <AreaChart
              data={[
                { year: "Year 1", revenue: totals.y1Revenue },
                { year: "Year 2", revenue: totals.y2Revenue },
                { year: "Year 3", revenue: totals.y3Revenue },
              ]}
              margin={{ left: 10, right: 10, top: 5 }}
            >
              <defs>
                <linearGradient id="execRevGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.blue} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#dbe4f0"} />
              <XAxis dataKey="year" tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 12 }} />
              <YAxis tickFormatter={(value) => `$${Math.round(value / 1000000)}M`} tick={{ fill: dark ? "#94a3b8" : "#475569", fontSize: 11 }} />
              <CustomTooltip formatter={(value) => currency(value)} />
              <Area type="monotone" dataKey="revenue" stroke={COLORS.blue} strokeWidth={2.5} fill="url(#execRevGradient)" dot={{ r: 5, fill: COLORS.blue, strokeWidth: 2, stroke: dark ? "#0f172a" : "#ffffff" }} />
            </AreaChart>
          </ChartContainer>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { label: "Year 1", value: totals.y1Revenue },
              { label: "Year 2", value: totals.y2Revenue },
              { label: "Year 3", value: totals.y3Revenue },
            ].map((year, index) => (
              <div key={year.label} className={`rounded-2xl border p-4 ${dark ? "border-slate-800 bg-slate-950/50" : "border-slate-200 bg-slate-50/90"}`}>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${dark ? "text-slate-500" : "text-slate-500"}`}>{year.label}</p>
                <p className={`mt-2 text-xl font-bold tabular-nums ${dark ? "text-white" : "text-slate-950"}`}>{currency(year.value)}</p>
                {index > 0 && totals.y1Revenue > 0 && (
                  <p className={`mt-1 text-xs font-semibold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
                    +{(((year.value - totals.y1Revenue) / totals.y1Revenue) * 100).toFixed(0)}% vs Y1
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${dark ? "border-slate-700/60 bg-slate-900/60" : "border-slate-200 bg-slate-50/90"}`}>
            <span className={`text-sm font-semibold ${dark ? "text-emerald-400" : "text-emerald-700"}`}>
              +{totals.y1Revenue > 0 ? (((totals.y3Revenue - totals.y1Revenue) / totals.y1Revenue) * 100).toFixed(0) : 0}% cumulative growth by Year 3
            </span>
            <span className={`text-xs ${dark ? "text-slate-500" : "text-slate-600"}`}>
              {currency(totals.y1Revenue)} to {currency(totals.y3Revenue)}
            </span>
          </div>
        </Card>
      </div>

      {(qualitySummary || true) && (
        <Card title="Andwell quality position" eyebrow="Quality readout" accent="emerald">
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${dark ? "text-slate-100" : "text-slate-900"}`}>Bundled quality snapshot</p>
            <span className={`ml-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${dark ? "border-slate-700 bg-slate-800 text-slate-300" : "border-slate-300/80 bg-slate-100/80 text-slate-700"}`}>
              CMS source status
            </span>
            {qualitySummary?.andwell?.synced_at && (
              <FreshnessChip lastSynced={qualitySummary.andwell.synced_at} label="Quality" syncType="CMS 6jpm-sxkc" />
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <QualityKPI
              label="Quality Star Rating"
              value={qualitySummary?.andwell?.star_rating != null ? `${parseFloat(qualitySummary.andwell.star_rating)} ★` : "—"}
              sub="CMS Home Health Care Quality"
              dark={dark}
              color="emerald"
            />
            <QualityKPI
              label="Maine Ranking"
              value={qualitySummary?.andwell_rank != null ? `#${qualitySummary.andwell_rank} in Maine` : "—"}
              sub={qualitySummary?.total_maine_agencies != null ? `of ${qualitySummary.total_maine_agencies} agencies` : "CMS home health quality records bundled when available"}
              dark={dark}
              color="blue"
            />
            <QualityKPI
              label="Medicare Cost Index"
              value={qualitySummary?.andwell?.medicare_spend_ratio != null ? `${parseFloat(qualitySummary.andwell.medicare_spend_ratio).toFixed(2)}x` : "—"}
              sub={
                qualitySummary?.andwell?.medicare_spend_ratio != null
                  ? qualitySummary?.metric_sources?.medicare_spend_ratio === "modeled"
                    ? qualitySummary?.metric_notes?.medicare_spend_ratio || "Modeled peer efficiency index; lower is better."
                    : `CMS spend ratio. Maine peer average ${qualitySummary?.state_avg_spend != null ? `${parseFloat(qualitySummary.state_avg_spend).toFixed(2)}x` : "unavailable"}; lower is better.`
                  : "Unavailable: bundled data could not produce a spend index."
              }
              dark={dark}
              color="amber"
            />
            <QualityKPI
              label="Preventable Readmissions"
              value={qualitySummary?.andwell?.ppr_rate != null ? `${parseFloat(qualitySummary.andwell.ppr_rate).toFixed(2)}%` : "—"}
              sub={
                qualitySummary?.andwell?.ppr_rate != null
                  ? qualitySummary?.metric_sources?.ppr_rate === "modeled"
                    ? qualitySummary?.metric_notes?.ppr_rate || "Modeled readmissions proxy; lower is better."
                    : `CMS PPR rate. Maine peer average ${qualitySummary?.state_avg_ppr != null ? `${parseFloat(qualitySummary.state_avg_ppr).toFixed(2)}%` : "unavailable"}; lower is better.`
                  : "Unavailable: bundled data could not produce a readmissions proxy."
              }
              dark={dark}
              color="violet"
            />
          </div>
        </Card>
      )}

      <div className={`flex items-start gap-3 rounded-2xl border px-4 py-4 ${dark ? "border-amber-800/40 bg-amber-950/20 text-amber-300" : "border-amber-300/80 bg-amber-100/70 text-amber-900"}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 opacity-80">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <p className="text-sm leading-7">
          <strong>Decision guardrail:</strong> provider file share is not county market share. This workspace is strongest when used to orient leadership, compare markets, and pressure-test assumptions. County-attributed claims data would still be required for true market-share attribution.
        </p>
      </div>
    </div>
  );
}
