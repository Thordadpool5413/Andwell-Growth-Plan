export const AI_AVAILABLE = true;

let _cachedToken = null;
let _tokenFetchedAt = 0;
const TOKEN_TTL_MS = 3.5 * 60 * 60 * 1000;

async function getToken() {
  const now = Date.now();
  if (_cachedToken && now - _tokenFetchedAt < TOKEN_TTL_MS) return _cachedToken;
  const res = await fetch("/api/ai/token");
  if (!res.ok) throw new Error("Could not obtain AI session token.");
  const { token } = await res.json();
  _cachedToken = token;
  _tokenFetchedAt = now;
  return token;
}

export async function streamChat({ messages, onChunk, onDone, onError, signal }) {
  try {
    const token = await getToken();
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-ai-token": token,
      },
      body: JSON.stringify({ messages, max_tokens: 700 }),
      signal,
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `AI error ${res.status}`);
    }

    const reader = res.body.getReader();
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
  } catch (err) {
    if (err.name !== "AbortError") {
      onError?.(err);
    }
  }
}

export function buildCountyPrompt(selected, intel, rows) {
  const { county, revenue, starts, referrals, reason, missing, launchGroup, service } = selected;
  const threat = intel?.threat;
  const pen = intel?.penetration;
  const opp = intel?.opportunityScore;

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
        "You are a healthcare strategy analyst specializing in Maine home health and hospice market analysis. Write concise plain-English insights grounded in the data provided. Be specific about numbers. Do not invent data not in the context. Respond in 3–5 sentences.",
    },
    {
      role: "user",
      content: `Generate a strategic intelligence summary for ${county} County, Maine.

Key metrics:
- Service focus: ${service}
- Launch priority: ${launchGroup}
- Opportunity score: ${opp?.score ?? "N/A"}/100 (${opp?.tier ?? "N/A"}) — composite of market size, competition, Andwell presence, revenue efficiency, and growth potential
- Year 1 revenue projection: $${Math.round(revenue[0]).toLocaleString()}
- Year 1 patient starts: ${starts[0]}
- Year 1 referrals needed: ${referrals[0]}
- Year 3 revenue projection: $${Math.round(revenue[2]).toLocaleString()}
- Staffing requirement: ${y1FTE} FTEs (Year 1) → ${y3FTE} FTEs (Year 3)
- Competitive threat: ${threat?.score ?? "N/A"}/100 (${threat?.level ?? "unknown"})${threat?.hasNationalChain ? " — national chain present" : ""}
- Year 1 market penetration: ${pen ? (pen.y1Penetration * 100).toFixed(1) + "%" : "N/A"}
- Year 3 penetration target: ${pen ? (pen.y3Penetration * 100).toFixed(1) + "%" : "N/A"}
- Total Medicare market: ${pen ? pen.totalMarket.toLocaleString() + " beneficiaries" : "N/A"}
- HH provider density: ${intel?.providerDensityHH ?? "N/A"} per 10K FFS beneficiaries
- Why this county: ${reason}
- Missing service lines to add: ${missing}

Summarize the opportunity score rationale, staffing readiness, key competitive risks, and recommended next action in plain English suitable for a board briefing.`,
    },
  ];
}

export function buildBoardNarrativePrompt(countyStatus, totals) {
  const top5 = countyStatus.slice(0, 5);
  const countyLines = top5
    .map(
      (c) =>
        `• ${c.county}: opportunity score ${c.oppScore}/100 (${c.oppTier}), Y1 revenue $${Math.round(c.y1Rev).toLocaleString()}, competitive threat ${c.threatScore}/100 (${c.threatLevel}), priority ${c.launchGroup}`,
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

export function buildAskPrompt(question, rows, totals, intelMap = {}) {
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
      const oppTier = intel?.opportunityScore?.tier ?? "N/A";
      const threatScore = intel?.threat?.score ?? "N/A";
      const threatLevel = intel?.threat?.level ?? "N/A";
      const pen = intel?.penetration;
      const y1Pen = pen ? (pen.y1Penetration * 100).toFixed(1) + "%" : "N/A";
      const y1FTE = cr.reduce((s, r) => {
        const perStart = r.service === "Home Healthcare" ? 1 / 35 : r.service === "Hospice" ? 1 / 12 : 1 / 40;
        return s + Math.ceil(r.starts[0] * perStart);
      }, 0);
      return `${county} (${launchGroup}): services=${service} | opp=${oppScore}/100 (${oppTier}) | threat=${threatScore}/100 (${threatLevel}) | Y1 pen=${y1Pen} | Y1 rev=$${Math.round(y1Rev).toLocaleString()} Y2=$${Math.round(y2Rev).toLocaleString()} Y3=$${Math.round(y3Rev).toLocaleString()} | Y1 starts=${y1Starts} Y3=${y3Starts} | Y1 referrals=${y1Referrals} | Y1 FTEs=${y1FTE}`;
    })
    .join("\n");

  return [
    {
      role: "system",
      content:
        "You are a data analyst for the Andwell Maine home health and hospice expansion plan. Answer questions using only the provided context data. Be specific with numbers. If the answer cannot be determined from the data, say so clearly. End your response by citing which data fields you used, prefixed with 'Data used:'.",
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

County breakdown (opp=opportunity score, threat=competitive threat, pen=market penetration):
${countyLines}

Question: ${question}`,
    },
  ];
}
