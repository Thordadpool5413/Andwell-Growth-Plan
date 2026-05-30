import React, { useState, useEffect } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell,
  Tooltip, XAxis, YAxis,
} from "recharts";
import Card from "../components/Card.jsx";
import ChartContainer from "../components/ChartContainer.jsx";
import Metric from "../components/Metric.jsx";
import Badge from "../components/Badge.jsx";
import Abbr from "../components/Abbr.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import FreshnessChip from "../components/FreshnessChip.jsx";
import MethodologyCallout from "../components/MethodologyCallout.jsx";
import VerificationBadge from "../components/VerificationBadge.jsx";
import CmsEvidenceCard from "../components/CmsEvidenceCard.jsx";
import CompetitorGrid from "./CompetitorGrid.jsx";
import { useDarkMode } from "../components/DarkModeContext.jsx";
import { COLORS } from "../data/constants.js";
import cmsCountyMarket from "../data/cmsCountyMarket.js";
import { namedProviderRows, marketShareBuildRows, marketShareFormulaRows } from "../data/providers.js";
import { getProviderSummary, getCompetitiveThreatScore } from "../utils/calculations.js";
import { currency, number, percent, badgeTone } from "../utils/formatters.js";
import { exportCompetitiveCSV } from "../utils/csvExport.js";

const CMS_LAST_SYNCED = "2026-05-01";

const NATIONAL_CHAINS = [
  "amedisys", "centerwell", "gentiva", "kindred", "compassus",
  "elara", "constellation", "enhabit", "lhc group", "bayada",
];

function isNationalChain(name) {
  const lower = (name || "").toLowerCase();
  return NATIONAL_CHAINS.some((c) => lower.includes(c));
}

const COMPETITIVE_TABS = [
  { id: "providers", label: "Provider file" },
  { id: "grid", label: "Andwell comparison grid" },
  { id: "methodology", label: "Methodology" },
];

export default function CompetitiveView({ selectedCounty, setSelectedCounty, competitorProviderType = "all", setCompetitorProviderType }) {
  const { dark } = useDarkMode();

  const derivedService = competitorProviderType === "hospice" ? "Hospice" : "Home Healthcare";
  const [service, setServiceState] = useState(derivedService);

  const setService = (svc) => {
    setServiceState(svc);
    if (setCompetitorProviderType) {
      setCompetitorProviderType(svc === "Hospice" ? "hospice" : "homehealth");
    }
  };

  React.useEffect(() => {
    if (competitorProviderType === "hospice") setServiceState("Hospice");
    else if (competitorProviderType === "homehealth") setServiceState("Home Healthcare");
  }, [competitorProviderType]);

  const [activeTab, setActiveTab] = useState("providers");
  const [cmsCompetitors, setCmsCompetitors] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const tr = await fetch("/api/ai/token");
        const { token } = tr.ok ? await tr.json() : { token: "" };
        const r = await fetch("/api/cms/competitors", { headers: { "x-ai-token": token } });
        if (r.ok) { const d = await r.json(); setCmsCompetitors(d.competitors || []); }
      } catch (_) {}
    })();
  }, []);

  const getCmsData = (providerName) =>
    cmsCompetitors.find((c) => c.name?.toLowerCase().includes(providerName.toLowerCase().slice(0, 10)) ||
      providerName.toLowerCase().includes((c.name || "").toLowerCase().slice(0, 10)));

  const summary = getProviderSummary(service);
  const providers = namedProviderRows.filter((row) => row.service === service).sort((a, b) => b.beneficiaries - a.beneficiaries);
  const countyProviders = providers.filter((row) => row.locationCounty === selectedCounty);
  const chartRows = providers.slice(0, 10).map((provider) => ({ ...provider, sharePct: Number((provider.providerVolumeShare * 100).toFixed(1)) }));
  const threat = getCompetitiveThreatScore(selectedCounty);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Competitive view" title="Named provider competitor layer">
        Provider file share, CMS-verified competitor matching, and the Andwell comparison grid. Use the comparison grid tab to see each competitor cross-referenced with CMS certification data and website intelligence.
      </SectionHeader>

      <div className="flex items-center gap-2 flex-wrap">
        <FreshnessChip lastSynced={CMS_LAST_SYNCED} label="CMS data" />
      </div>

      <MethodologyCallout title="How is the competitive threat score calculated?">
        <p className={`mb-3 ${dark ? "text-slate-300" : "text-slate-700"}`}>
          The Competitive Threat Score (0–100) measures how hard it will be for Andwell to enter a given county. It combines four factors:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { name: "Competitor count", weight: "30%", desc: "Number of active named providers in the county. More competitors = higher threat." },
            { name: "Competitor share concentration", weight: "30%", desc: "Combined provider file share held by competitors. High concentration signals entrenched incumbents." },
            { name: "National chain presence", weight: "20%", desc: "Whether a national chain (Amedisys, Gentiva, LHC Group, etc.) operates locally. National chains have significant scale advantages." },
            { name: "Provider density", weight: "20%", desc: "Providers per 10,000 FFS beneficiaries. High density indicates a crowded market." },
          ].map((f) => (
            <div key={f.name} className={`rounded-xl border p-3 ${dark ? "border-slate-700 bg-slate-800/60" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-xs font-black ${dark ? "text-white" : "text-slate-900"}`}>{f.name}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${dark ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-700"}`}>{f.weight}</span>
              </div>
              <p className={`mt-1 text-[11px] leading-4 ${dark ? "text-slate-400" : "text-slate-500"}`}>{f.desc}</p>
            </div>
          ))}
        </div>
        <p className={`mt-3 text-[11px] ${dark ? "text-slate-500" : "text-slate-400"}`}>
          Levels: Fortress ≥ 70 · High 50–69 · Moderate 30–49 · Low &lt; 30. Source: CMS provider file — provider file share ≠ county market share.
        </p>
      </MethodologyCallout>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label={`${service} providers`} value={summary.providers} detail="Named Maine provider rows loaded." color="blue" sourceType="cms" />
        <Metric label="Total beneficiaries" value={number(summary.beneficiaries)} detail="Provider file beneficiary volume." color="blue" sourceType="cms" />
        <Metric label="Andwell rank" value={summary.andwellRank ? `#${summary.andwellRank}` : "N/A"} detail="Ranked by beneficiary volume in the provider file." color="emerald" sourceType="cms" />
        <Metric label="Andwell provider file share" value={percent(summary.andwellShare)} detail={<span>Not county market share. This is <Abbr term="Provider File Share">provider file share</Abbr>.</span>} color="violet" sourceType="cms" />
      </div>

      {threat && (
        <div className={`rounded-3xl border p-5 ${dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-semibold ${dark ? "text-slate-400" : "text-slate-500"}`}>{selectedCounty} competitive threat score</p>
              <div className="mt-2 flex items-center gap-3">
                <p className={`text-3xl font-black ${dark ? "text-white" : "text-slate-950"}`}>{threat.score}/100</p>
                <Badge tone={threat.level === "Fortress" ? "red" : threat.level === "High" ? "amber" : threat.level === "Moderate" ? "blue" : "green"}>
                  {threat.level}
                </Badge>
                {threat.hasNationalChain && <Badge tone="red">National chain</Badge>}
              </div>
            </div>
            <div className={`grid grid-cols-3 gap-6 text-sm ${dark ? "text-slate-300" : "text-slate-700"}`}>
              <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Competitors</p><p className="font-black">{threat.competitorCount}</p></div>
              <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Competitor share</p><p className="font-black">{percent(threat.totalShare)}</p></div>
              <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Provider density</p><p className="font-black">{threat.providerDensity}/10K</p></div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {COMPETITIVE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${activeTab === t.id ? "bg-blue-600 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50"}`}
          >
            {t.label}
          </button>
        ))}
        {activeTab === "providers" && (
          <>
            {["Home Healthcare", "Hospice"].map((item) => (
              <button key={item} onClick={() => setService(item)} className={`rounded-full px-4 py-2 text-sm font-black transition ${service === item ? "bg-slate-700 text-white" : dark ? "bg-slate-800 text-slate-400 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                {item}
              </button>
            ))}
            {Object.keys(cmsCountyMarket).map((county) => (
              <button key={county} onClick={() => setSelectedCounty(county)} className={`rounded-full px-4 py-2 text-sm font-black transition ${selectedCounty === county ? dark ? "bg-slate-100 text-slate-950" : "bg-slate-950 text-white" : dark ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-700" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                {county}
              </button>
            ))}
            <button
              onClick={() => exportCompetitiveCSV(providers)}
              className={`ml-auto rounded-full px-4 py-2 text-xs font-black transition ${dark ? "bg-slate-700 text-emerald-400 ring-1 ring-slate-600 hover:bg-slate-600" : "bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"}`}
            >
              Export CSV
            </button>
          </>
        )}
      </div>

      {activeTab === "providers" && (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <Card title={`Top ${service} providers`} eyebrow="Provider file share">
            <ChartContainer height="h-96">
                <BarChart data={chartRows} layout="vertical" margin={{ left: 10, right: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#334155" : "#e2e8f0"} />
                  <XAxis
                    type="number"
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: dark ? "#94a3b8" : "#475569" }}
                    label={{ value: "Provider file share (%)", position: "insideBottom", offset: -12, fontSize: 10, fill: dark ? "#64748b" : "#94a3b8" }}
                  />
                  <YAxis type="category" dataKey="providerName" width={170} tick={{ fontSize: 11, fill: dark ? "#94a3b8" : "#475569" }} />
                  <Tooltip formatter={(value, name) => name === "sharePct" ? `${value}%` : number(value)} contentStyle={dark ? { backgroundColor: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" } : undefined} />
                  <Bar dataKey="sharePct" name="Provider file share" radius={[0, 8, 8, 0]}>
                    {chartRows.map((row) => <Cell key={row.providerName} fill={row.isAndwellCmsRecord ? COLORS.blue : COLORS.slate} />)}
                  </Bar>
                </BarChart>
            </ChartContainer>
          </Card>
          <Card title={`${selectedCounty} named providers`} eyebrow="County located providers">
            <div className="space-y-3">
              {countyProviders.length ? countyProviders.map((provider) => (
                <div key={`${provider.service}-${provider.providerName}`} className={`rounded-2xl border p-4 ${provider.isAndwellCmsRecord ? dark ? "border-blue-700 bg-blue-950/50" : "border-blue-300 bg-blue-50" : dark ? "border-slate-700 bg-slate-800" : "border-slate-200 bg-white"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{provider.providerName}</p>
                      <p className={`text-sm ${dark ? "text-slate-400" : "text-slate-500"}`}>{provider.service} located in {provider.locationCounty}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {provider.isAndwellCmsRecord ? <Badge tone="blue">Andwell CMS record</Badge> : <Badge tone="slate">Competitor</Badge>}
                      {!provider.isAndwellCmsRecord && isNationalChain(provider.providerName) && <Badge tone="red">National chain</Badge>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Beneficiaries</p><p className="font-black">{number(provider.beneficiaries)}</p></div>
                    <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Episodes</p><p className="font-black">{number(provider.episodes)}</p></div>
                    <div><p className={dark ? "text-slate-400" : "text-slate-500"}>Payment</p><p className="font-black">{currency(provider.payment)}</p></div>
                  </div>
                  {!provider.isAndwellCmsRecord && (() => {
                    const cmsData = getCmsData(provider.providerName);
                    return cmsData ? <div className="mt-3"><CmsEvidenceCard competitor={cmsData} compact /></div> : null;
                  })()}
                </div>
              )) : (
                <div className={`rounded-2xl border p-5 ${dark ? "border-amber-800 bg-amber-950/50 text-amber-300" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
                  <p className="font-black">No named provider row located in {selectedCounty} for {service}.</p>
                  <p className="mt-2 text-sm leading-6">This does not mean no provider serves the county. It means the uploaded provider file does not have a provider headquarters row located in that county for this selected service.</p>
                </div>
              )}
            </div>
          </Card>
        </section>
      )}

      {activeTab === "grid" && (
        <CompetitorGrid providerType={service === "Hospice" ? "hospice" : "homehealth"} />
      )}

      {activeTab === "methodology" && (
        <>
          <Card title="Market share build path" eyebrow="What is built versus what is still needed">
            <div className={`overflow-x-auto rounded-2xl border ${dark ? "border-slate-700" : "border-slate-100"}`}>
              <table className="w-full min-w-[1200px] text-left text-sm">
                <thead className={`text-xs uppercase tracking-wide ${dark ? "bg-slate-700/50 text-slate-400" : "bg-slate-50 text-slate-500"}`}>
                  <tr>
                    <th className="px-5 py-4">Layer</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Current data</th>
                    <th className="px-5 py-4">Limitation</th>
                    <th className="px-5 py-4">Required for full picture</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${dark ? "divide-slate-700" : "divide-slate-100"}`}>
                  {marketShareBuildRows.map((row) => (
                    <tr key={row.layer} className={`align-top ${dark ? "hover:bg-slate-700/50" : "hover:bg-slate-50"}`}>
                      <td className={`px-5 py-4 font-black ${dark ? "text-white" : ""}`}>{row.layer}</td>
                      <td className="px-5 py-4"><Badge tone={badgeTone(row.status)}>{row.status}</Badge></td>
                      <td className={`px-5 py-4 ${dark ? "text-slate-300" : "text-slate-700"}`}>{row.data}</td>
                      <td className={`px-5 py-4 ${dark ? "text-slate-400" : "text-slate-600"}`}>{row.limitation}</td>
                      <td className={`px-5 py-4 ${dark ? "text-slate-400" : "text-slate-600"}`}>{row.need}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Market share formulas" eyebrow="Formula transparency">
            <div className="grid gap-3 md:grid-cols-2">
              {marketShareFormulaRows.map((row) => (
                <div key={row.metric} className={`rounded-2xl border p-4 ${dark ? "border-slate-700 bg-slate-700/30" : "border-slate-200 bg-slate-50"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className={`font-black ${dark ? "text-white" : "text-slate-950"}`}>{row.metric}</p>
                    <Badge tone={row.state.includes("Built") ? "green" : "amber"}>{row.state}</Badge>
                  </div>
                  <p className={`mt-2 text-sm leading-6 ${dark ? "text-slate-400" : "text-slate-600"}`}>{row.formula}</p>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
