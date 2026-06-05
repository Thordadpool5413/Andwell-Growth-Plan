import React from "react";
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
import FreshnessChip from "../components/FreshnessChip.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { getFreshness } from "../data/dashboardData.js";

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

export default function ExecutiveView({ onNavigate }) {
  const { dark } = useDarkMode();
  const freshness = getFreshness();

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
    </div>
  );
}
