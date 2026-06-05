import { buildDashboardAiContext } from "../data/dashboardData.js";

export const AI_AVAILABLE = true;

const TOKEN_TTL_MS = 3.5 * 60 * 60 * 1000;
const AI_BACKENDS = {
  native: {
    id: "native",
    token: "/api/ai/token",
    chat: "/api/ai/chat",
    cmsAnalyze: "/api/ai/cms-analyze",
  },
  php: {
    id: "php",
    token: "/api/ai/token.php",
    chat: "/api/ai/chat.php",
    cmsAnalyze: "/api/ai/cms-analyze.php",
  },
};
const TOKEN_CACHE = {
  native: { token: null, fetchedAt: 0 },
  php: { token: null, fetchedAt: 0 },
};

let _preferredAiBackend = "native";

async function readJsonSafe(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  const text = await res.text().catch(() => "");
  if (!text) return { error: `HTTP ${res.status}` };
  try {
    return JSON.parse(text);
  } catch (_) {
    if (/^\s*<!doctype html/i.test(text) || /^\s*<html/i.test(text)) {
      return { error: `Received an HTML ${res.status} response from the AI route instead of JSON.` };
    }
    return { error: text.slice(0, 180) };
  }
}

function aiBackendOrder(allowPhpFallback = true) {
  const first = AI_BACKENDS[_preferredAiBackend] || AI_BACKENDS.native;
  if (!allowPhpFallback) return [AI_BACKENDS.native];
  const second = first.id === "native" ? AI_BACKENDS.php : AI_BACKENDS.native;
  return [first, second];
}

function clearTokenCache(backendId) {
  TOKEN_CACHE[backendId] = { token: null, fetchedAt: 0 };
}

function setTokenCache(backendId, token) {
  TOKEN_CACHE[backendId] = { token, fetchedAt: Date.now() };
}

function buildAiRouteError(res, payload) {
  const error = new Error(payload?.error || `AI error ${res.status}`);
  error.fallbackWorthy =
    Boolean(payload?.error?.includes("HTML")) ||
    [404, 405, 502, 503, 504].includes(res.status);
  return error;
}

async function getTokenForBackend(backend) {
  const now = Date.now();
  const cached = TOKEN_CACHE[backend.id];
  if (cached.token && now - cached.fetchedAt < TOKEN_TTL_MS) return cached.token;

  const res = await fetch(backend.token);
  const payload = await readJsonSafe(res);
  if (!res.ok || !payload.token) throw buildAiRouteError(res, payload);
  const { token } = payload;
  setTokenCache(backend.id, token);
  _preferredAiBackend = backend.id;
  return token;
}

export async function getAiToken({ allowPhpFallback = true } = {}) {
  let lastError = null;
  for (const backend of aiBackendOrder(allowPhpFallback)) {
    try {
      return await getTokenForBackend(backend);
    } catch (err) {
      lastError = err;
      clearTokenCache(backend.id);
      if (!allowPhpFallback || !err?.fallbackWorthy || backend.id === "php") throw err;
    }
  }
  throw lastError || new Error("Could not obtain AI session token.");
}

export function getNodeApiToken() {
  return getAiToken({ allowPhpFallback: false });
}

export async function streamChat({ messages, onChunk, onDone, onError, signal }) {
  try {
    let lastError = null;

    for (const backend of aiBackendOrder(true)) {
      try {
        const token = await getTokenForBackend(backend);
        const res = await fetch(backend.chat, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ai-token": token,
          },
          body: JSON.stringify({ messages, max_tokens: 700 }),
          signal,
        });

        if (!res.ok) {
          const errJson = await readJsonSafe(res);
          throw buildAiRouteError(res, errJson);
        }

        const reader = res.body?.getReader?.();
        if (!reader) throw new Error("AI response stream was unavailable.");

        _preferredAiBackend = backend.id;

        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              onDone?.(fullText);
              return;
            }
            try {
              const json = JSON.parse(data);
              const chunk = json.choices?.[0]?.delta?.content ?? "";
              if (chunk) {
                fullText += chunk;
                onChunk?.(chunk, fullText);
              }
            } catch (_) {}
          }
        }

        onDone?.(fullText);
        return;
      } catch (err) {
        lastError = err;
        clearTokenCache(backend.id);
        if (err.name === "AbortError") throw err;
        if (!err?.fallbackWorthy || backend.id === "php") throw err;
      }
    }

    throw lastError || new Error("AI streaming request failed.");
  } catch (err) {
    if (err.name !== "AbortError") {
      onError?.(err);
    }
  }
}

export function buildCountyPrompt(selected, intel, rows) {
  const { county, revenue, starts, referrals, launchGroup, service } = selected;
  const threat = intel?.threat;
  const pen = intel?.penetration;
  const opp = intel?.opportunityScore;
  const dashboardContext = buildDashboardAiContext({ rows, selectedCounty: county });
  const selectedCountyData = dashboardContext.selected_county || {};
  const quality = selectedCountyData.quality || {};
  const providerLandscape = selectedCountyData.providerLandscape || {};

  const countyRows = rows.filter((r) => r.county === county);
  const y1FTE = countyRows.reduce((s, r) => {
    const perStart = r.service === "Home Healthcare" ? 1 / 35 : r.service === "Hospice" ? 1 / 12 : 1 / 40;
    return s + Math.ceil(r.starts[0] * perStart);
  }, 0);
  const y3FTE = countyRows.reduce((s, r) => {
    const perStart = r.service === "Home Healthcare" ? 1 / 35 : r.service === "Hospice" ? 1 / 12 : 1 / 40;
    return s + Math.ceil(r.starts[2] * perStart);
  }, 0);

  return [
    {
      role: "system",
      content:
        "You are a healthcare strategy analyst specializing in Maine home health and hospice market analysis. Write concise plain-English insights grounded only in the computed metrics provided. Be specific about numbers. Do not invent data not in the context. Format the answer with these headings: Executive takeaway, Why this county matters, Provider and competitor context, Quality and HHVBP insight, Referral opportunity, Revenue opportunity, Risks or constraints, Recommended next action, Evidence and source notes.",
    },
    {
      role: "user",
      content: `Generate a strategic intelligence summary for ${county} County, Maine based solely on the following computed metrics.

Computed metrics:
- Service focus: ${service}
- Launch priority group: ${launchGroup}
- Opportunity score: ${opp?.score ?? "N/A"}/100 (tier: ${opp?.tier ?? "N/A"}) — composite of market size, low competition, Andwell presence, revenue efficiency, and growth potential
- Opportunity factors: ${opp?.factors?.map((f) => `${f.name} ${f.value}/100`).join(", ") ?? "N/A"}
- Year 1 revenue: $${Math.round(revenue[0]).toLocaleString()}
- Year 2 revenue: $${Math.round(revenue[1]).toLocaleString()}
- Year 3 revenue: $${Math.round(revenue[2]).toLocaleString()}
- Year 1 patient starts: ${starts[0]}
- Year 3 patient starts: ${starts[2]}
- Year 1 referrals needed: ${referrals[0]}
- Staffing requirement: ${y1FTE} FTEs (Year 1) → ${y3FTE} FTEs (Year 3)
- Competitive threat score: ${threat?.score ?? "N/A"}/100 (level: ${threat?.level ?? "unknown"})${threat?.hasNationalChain ? " — national chain present" : ""}
- Competitor count: ${threat?.competitorCount ?? "N/A"} providers
- Competitor beneficiary share: ${threat?.totalShare != null ? (threat.totalShare * 100).toFixed(1) + "%" : "N/A"}
- Year 1 market penetration: ${pen ? (pen.y1Penetration * 100).toFixed(1) + "%" : "N/A"}
- Year 3 market penetration target: ${pen ? (pen.y3Penetration * 100).toFixed(1) + "%" : "N/A"}
- Total Medicare market: ${pen ? pen.totalMarket.toLocaleString() + " beneficiaries" : "N/A"}
- HH provider density: ${intel?.providerDensityHH ?? "N/A"} per 10K FFS beneficiaries
- FFS beneficiaries: ${intel?.ffs?.toLocaleString() ?? "N/A"}
- Provider landscape: ${providerLandscape.counts?.homeHealth ?? 0} CMS home health records, ${providerLandscape.counts?.hospice ?? 0} CMS hospice records, ${providerLandscape.counts?.hrsa ?? 0} HRSA hospice facilities
- Provider classification counts: ${JSON.stringify(providerLandscape.byClassification || {})}
- Quality: avg HH star=${quality.avgHomeHealthStar ?? "unavailable"}, avg HHCAHPS star=${quality.avgHhcahpsStar ?? "unavailable"}, avg HHCAHPS recommend=${quality.avgHhcahpsRecommend ?? "unavailable"}, avg HHVBP=${quality.avgHhvbpScore ?? "unavailable"}, avg hospice CAHPS=${quality.avgHospiceCahpsScore ?? "unavailable"}
- Quality: avg HH star=${quality.avgHomeHealthStar ?? "unavailable"}, avg HHVBP=${quality.avgHhvbpScore ?? "unavailable"}, avg hospice CAHPS=${quality.avgHospiceCahpsScore ?? "unavailable"}
- Best available quality record: ${quality.bestScore ? `${quality.bestScore.provider} ${quality.bestScore.score} (${quality.bestScore.source})` : "unavailable"}
- Lowest available quality record: ${quality.lowestScore ? `${quality.lowestScore.provider} ${quality.lowestScore.score} (${quality.lowestScore.source})` : "unavailable"}
- Missing data notes: ${(quality.missingNotes || []).join("; ") || "none"}

Based only on these computed metrics, summarize: (1) the opportunity score rationale, (2) staffing readiness relative to patient starts, (3) key competitive risks from the threat score, and (4) recommended next action. Suitable for a board briefing.`,
    },
  ];
}

export function buildBoardNarrativePrompt(countyStatus, totals) {
  const top5 = countyStatus.slice(0, 5);
  const countyLines = top5
    .map(
      (c) =>
        `• ${c.county}: opportunity score ${c.oppScore}/100, Y1 revenue $${Math.round(c.y1Rev).toLocaleString()}, competitive threat ${c.threatScore}/100 (${c.threatLevel}), launch group ${c.launchGroup}`,
    )
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are a healthcare strategy advisor writing board-level executive summaries. Write clear, confident prose suitable for a board packet. Use specific numbers. Keep to 2–3 paragraphs. Do not use bullet points or headings. Do not invent data not in the context.",
    },
    {
      role: "user",
      content: `Write an executive summary for the Andwell Maine home health and hospice expansion plan.

Overall financial projections:
- Year 1 revenue: $${Math.round(totals.y1Revenue).toLocaleString()}
- Year 2 revenue: $${Math.round(totals.y2Revenue).toLocaleString()}
- Year 3 revenue: $${Math.round(totals.y3Revenue).toLocaleString()}
- 3-year total contribution margin: $${Math.round(totals.totalContribution).toLocaleString()}
- Year 1 patient starts: ${totals.y1Starts}
- Year 1 referrals needed: ${totals.y1Referrals}

Top 5 priority counties by opportunity score:
${countyLines}

Write a 2–3 paragraph executive summary covering: (1) the overall financial opportunity and growth trajectory, (2) the competitive and market landscape, and (3) the recommended priority launch sequence and key risks the board should monitor.`,
    },
  ];
}

export function buildAskPrompt(question, rows, totals, intelMap = {}, selectedCounty = "York", uiContext = {}) {
  const counties = [...new Set(rows.map((r) => r.county))];
  const countyLines = counties
    .map((county) => {
      const cr = rows.filter((r) => r.county === county);
      const y1Rev = cr.reduce((s, r) => s + r.revenue[0], 0);
      const y2Rev = cr.reduce((s, r) => s + r.revenue[1], 0);
      const y3Rev = cr.reduce((s, r) => s + r.revenue[2], 0);
      const y1Starts = cr.reduce((s, r) => s + r.starts[0], 0);
      const y3Starts = cr.reduce((s, r) => s + r.starts[2], 0);
      const y1Referrals = cr.reduce((s, r) => s + r.referrals[0], 0);
      const launchGroup = cr[0]?.launchGroup ?? "—";
      const service = cr.map((r) => r.service).join(", ");
      const intel = intelMap[county];
      const oppScore = intel?.opportunityScore?.score ?? "N/A";
      const threatScore = intel?.threat?.score ?? "N/A";
      const threatLevel = intel?.threat?.level ?? "N/A";
      const pen = intel?.penetration;
      const y1Pen = pen ? (pen.y1Penetration * 100).toFixed(1) + "%" : "N/A";
      const y1FTE = cr.reduce((s, r) => {
        const perStart = r.service === "Home Healthcare" ? 1 / 35 : r.service === "Hospice" ? 1 / 12 : 1 / 40;
        return s + Math.ceil(r.starts[0] * perStart);
      }, 0);
      return `${county} (${launchGroup}): services=${service} | opp=${oppScore}/100 | threat=${threatScore}/100 (${threatLevel}) | Y1 pen=${y1Pen} | Y1 rev=$${Math.round(y1Rev).toLocaleString()} Y2=$${Math.round(y2Rev).toLocaleString()} Y3=$${Math.round(y3Rev).toLocaleString()} | Y1 starts=${y1Starts} Y3=${y3Starts} | Y1 referrals=${y1Referrals} | Y1 FTEs=${y1FTE}`;
    })
    .join("\n");

  const dashboardContext = buildDashboardAiContext({ rows, totals, selectedCounty });
  const selected = dashboardContext.selected_county || {};
  const selectedMarket = selected.market || selected.sourceMarket || {};
  const quality = selected.quality || {};
  const mapMetrics = selected.mapMetrics || {};
  const providerLandscape = selected.providerLandscape || {};
  const selectedProviderLines = [
    ...(selected.homeHealthAgencies || []).slice(0, 5).map((provider) => `CMS home health: ${provider.provider_name} (${provider.ccn || "CCN unavailable"}) county=${provider.county || "unassigned"} star=${provider.star_rating ?? "unavailable"}`),
    ...(selected.quality?.hhcahps || []).slice(0, 5).map((provider) => `CMS HHCAHPS: ${provider.provider_name} (${provider.ccn || "CCN unavailable"}) summary_star=${provider.summary_star_rating ?? "unavailable"} recommend=${provider.recommend_pct ?? "unavailable"} source=${provider.source_dataset_id || "ccn4-8vby"}`),
    ...(selected.hospiceProviders || []).slice(0, 5).map((provider) => `CMS hospice: ${provider.provider_name} (${provider.ccn || "CCN unavailable"}) county=${provider.county || "unassigned"}`),
    ...(selected.hhvbp || []).slice(0, 5).map((provider) => `CMS HHVBP: ${provider.provider_name} (${provider.ccn || "CCN unavailable"}) display_score=${provider.display_score?.toFixed?.(1) ?? "unavailable"} payment_year=${provider.payment_year || "unavailable"}`),
    ...(selected.hrsaHospiceFacilities || []).slice(0, 5).map((facility) => `HRSA hospice facility: ${facility.facility_name} ${facility.city || ""} ${facility.zip_code || ""}`),
  ].join("\n") || "No selected-county provider/facility rows available in bundled seed data.";
  const compactSelectedCountyContext = `Selected county: ${selectedCounty}
Current page: ${uiContext.activeTab || "Unknown"}
Active map layer: ${uiContext.mapLayer || "priority"}
Provider filter: ${uiContext.competitorProviderType || "all"}
Priority: ${selected.priority || "Not in plan"}
CMS market: FFS=${selectedMarket.ffs ?? "unavailable"}, HH users=${selectedMarket.home_health_users ?? selectedMarket.hh?.users ?? "unavailable"}, Hospice users=${selectedMarket.hospice_users ?? selectedMarket.hos?.users ?? "unavailable"}, HH providers=${selectedMarket.home_health_provider_count ?? selectedMarket.hh?.prov ?? "unavailable"}, Hospice providers=${selectedMarket.hospice_provider_count ?? selectedMarket.hos?.prov ?? "unavailable"}
Map metrics: demand=${mapMetrics.demand ?? "unavailable"}, revenue=${mapMetrics.revenue ?? "unavailable"}, competition_density=${mapMetrics.competitionDensity ?? "unavailable"}, market_penetration_pct=${mapMetrics.marketPenetration ?? "unavailable"}, all_providers=${mapMetrics.allProviders ?? "unavailable"}
Provider classification counts: ${JSON.stringify(providerLandscape.byClassification || {})}
Quality summary: avg_hh_star=${quality.avgHomeHealthStar ?? "unavailable"}, avg_hhcahps_star=${quality.avgHhcahpsStar ?? "unavailable"}, avg_hhcahps_recommend=${quality.avgHhcahpsRecommend ?? "unavailable"}, avg_hhvbp_score=${quality.avgHhvbpScore ?? "unavailable"}, avg_hospice_cahps=${quality.avgHospiceCahpsScore ?? "unavailable"}, best=${quality.bestScore ? `${quality.bestScore.provider} ${quality.bestScore.score} ${quality.bestScore.source}` : "unavailable"}, missing=${(quality.missingNotes || []).join(" | ") || "none"}
Quality summary: avg_hh_star=${quality.avgHomeHealthStar ?? "unavailable"}, avg_hhvbp_score=${quality.avgHhvbpScore ?? "unavailable"}, avg_hospice_cahps=${quality.avgHospiceCahpsScore ?? "unavailable"}, best=${quality.bestScore ? `${quality.bestScore.provider} ${quality.bestScore.score} ${quality.bestScore.source}` : "unavailable"}, missing=${(quality.missingNotes || []).join(" | ") || "none"}
Provider/facility rows:
${selectedProviderLines}
Bundled source counts: homeHealth=${dashboardContext.data_sources?.sources?.homeHealthAgencies?.maine_records ?? "n/a"}, HHCAHPS=${dashboardContext.data_sources?.sources?.homeHealthHhcahpsProvider?.maine_records ?? "n/a"}, HHVBP=${dashboardContext.data_sources?.sources?.homeHealthHhvbpAgencyData?.maine_records ?? "n/a"}, hospiceProviders=${dashboardContext.data_sources?.sources?.hospiceGeneralInformation?.maine_records ?? "n/a"}, hospiceQuality=${dashboardContext.data_sources?.sources?.hospiceProviderData?.maine_records ?? "n/a"}, hospiceCAHPS=${dashboardContext.data_sources?.sources?.hospiceCahpsProviderData?.maine_records ?? "n/a"}, HRSA facilities=${dashboardContext.data_sources?.hrsa?.cmsApprovedHospices?.maine_records ?? "n/a"}`;

  return [
    {
      role: "system",
      content:
        "You are a data analyst for the Andwell Maine home health and hospice expansion plan. Answer using only the provided dashboard context. Be specific with numbers. Clearly distinguish sourced CMS or HRSA public data, bundled generated data, modeled projections, calculated outputs, and inferred strategy notes. If a requested fact is unavailable in the context, say what specific source is missing. Use short headings and source notes. Never output raw JSON. End your response by citing which data fields you used, prefixed with 'Data used:'.",
    },
    {
      role: "user",
      content: `Context — Andwell growth plan modeled data:

Overall scenario totals:
- Year 1 revenue: $${Math.round(totals.y1Revenue).toLocaleString()}
- Year 2 revenue: $${Math.round(totals.y2Revenue).toLocaleString()}
- Year 3 revenue: $${Math.round(totals.y3Revenue).toLocaleString()}
- 3-year contribution margin: $${Math.round(totals.totalContribution).toLocaleString()}
- Year 1 patient starts: ${totals.y1Starts}
- Year 1 referrals needed: ${totals.y1Referrals}

Selected county CMS/HRSA/provider context (sourced/bundled data):
${compactSelectedCountyContext}

County breakdown (modeled planning context; opp=opportunity score, threat=competitive threat, pen=market penetration):
${countyLines}

Broader normalized dashboard context summary:
${JSON.stringify({ benchmarks: dashboardContext.benchmarks, counties: dashboardContext.counties }).slice(0, 12000)}

Question: ${question}`,
    },
  ];
}

const CMS_KEYWORDS = [
  "competitor", "amedisys", "gentiva", "kindred", "compassus", "constellation",
  "cms", "medicare provider", "hospice provider", "home health agency", "home health agencies",
  "ccn", "cms certified", "certification number", "maine provider", "beacon hospice",
  "northern light", "mainehealth", "mainegeneral", "chans", "vna", "bristol hospice",
  "affinity care", "york hospital hospice", "miles st", "hospice of aroostook",
  "community health and counseling", "st joseph hospice", "provider data catalog",
  "provider match", "verified", "cms verified", "market share", "provider file",
];

function isCmsQuestion(q) {
  const lower = q.toLowerCase();
  return CMS_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function callCmsAnalyze(question) {
  let lastError = null;

  for (const backend of aiBackendOrder(true)) {
    try {
      const token = await getTokenForBackend(backend);
      const res = await fetch(backend.cmsAnalyze, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-token": token,
        },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        const errJson = await readJsonSafe(res);
        throw buildAiRouteError(res, errJson);
      }
      _preferredAiBackend = backend.id;
      return readJsonSafe(res);
    } catch (err) {
      lastError = err;
      clearTokenCache(backend.id);
      if (!err?.fallbackWorthy || backend.id === "php") throw err;
    }
  }

  throw lastError || new Error("CMS AI request failed.");
}

export function buildMarketSummaryPrompt({ velocityRows, andwellDominance, amedisysCombinedShare, northernLight, totalCompetitors, nationalChainCount }) {
  const topCompetitors = velocityRows.slice(0, 5).map((r) =>
    `• ${r.name}: momentum ${r.momentum}%, region ${r.region}, status ${r.status}${r.national ? " (national chain)" : ""}, provider share ${r.providerShare != null ? (r.providerShare * 100).toFixed(1) + "%" : "N/A"}`
  ).join("\n");

  return [
    {
      role: "system",
      content:
        "You are a healthcare market strategy analyst specializing in Maine home health and hospice. Write a concise competitive market summary in 3–5 plain-English sentences. Ground every claim in the metrics provided. Name specific competitors where the data supports it. Do not invent data not in the context. Do not use bullet points or headings.",
    },
    {
      role: "user",
      content: `Generate a competitive market summary for the Maine home health and hospice market based solely on these CMS-verified metrics.

Andwell market position:
- Combined provider file share (HH + Hospice): ${(andwellDominance * 100).toFixed(1)}%

Competitor landscape:
- Total named competitors in CMS file: ${totalCompetitors}
- National chain competitors: ${nationalChainCount}
- Amedisys combined Maine share: ${amedisysCombinedShare > 0 ? (amedisysCombinedShare * 100).toFixed(1) + "%" : "active in Penobscot"}
${northernLight ? `- Northern Light Home Care momentum score: ${northernLight.momentum}%, primary region: ${northernLight.region}` : ""}

Top competitors by momentum score:
${topCompetitors || "No competitor data available."}

Summarize: (1) Andwell's current competitive position, (2) the biggest competitive threats by name and their market presence, and (3) the strategic implication for Andwell's expansion. Suitable for a board-level market intelligence brief.`,
    },
  ];
}

export { isCmsQuestion };
