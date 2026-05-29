const AI_INTEGRATIONS_BASE = import.meta.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const AI_INTEGRATIONS_KEY = import.meta.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const OPENAI_KEY = import.meta.env.OPENAI_API_KEY;
const OPENAI_BASE = "https://api.openai.com/v1";

const AI_BASE = AI_INTEGRATIONS_BASE || (OPENAI_KEY ? OPENAI_BASE : null);
const AI_KEY = AI_INTEGRATIONS_KEY || OPENAI_KEY || null;

export const AI_AVAILABLE = Boolean(AI_BASE && AI_KEY);

export async function streamChat({ messages, onChunk, onDone, onError, signal }) {
  if (!AI_AVAILABLE) {
    onError?.(new Error("AI not configured. Add an OpenAI API key to enable AI features."));
    return;
  }

  try {
    const res = await fetch(`${AI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        stream: true,
        max_tokens: 700,
      }),
      signal,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`AI API error ${res.status}: ${errText.slice(0, 200)}`);
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

export function buildCountyPrompt(selected, intel, _rows) {
  const { county, revenue, starts, referrals, reason, missing, launchGroup, service } = selected;
  const threat = intel?.threat;
  const pen = intel?.penetration;

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
- Year 1 revenue projection: $${Math.round(revenue[0]).toLocaleString()}
- Year 1 patient starts: ${starts[0]}
- Year 1 referrals needed: ${referrals[0]}
- Year 3 revenue projection: $${Math.round(revenue[2]).toLocaleString()}
- Competitive threat: ${threat?.score ?? "N/A"}/100 (${threat?.level ?? "unknown"})${threat?.hasNationalChain ? " — national chain present" : ""}
- Year 1 market penetration: ${pen ? (pen.y1Penetration * 100).toFixed(1) + "%" : "N/A"}
- Year 3 penetration target: ${pen ? (pen.y3Penetration * 100).toFixed(1) + "%" : "N/A"}
- Total Medicare market: ${pen ? pen.totalMarket.toLocaleString() + " beneficiaries" : "N/A"}
- HH provider density: ${intel?.providerDensityHH ?? "N/A"} per 10K FFS beneficiaries
- Why this county: ${reason}
- Missing service lines to add: ${missing}

Summarize the opportunity, key risks, and recommended next action in plain English suitable for a board briefing.`,
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

export function buildAskPrompt(question, rows, totals) {
  const counties = [...new Set(rows.map((r) => r.county))];
  const countyLines = counties
    .map((county) => {
      const cr = rows.filter((r) => r.county === county);
      const y1Rev = cr.reduce((s, r) => s + r.revenue[0], 0);
      const y1Starts = cr.reduce((s, r) => s + r.starts[0], 0);
      const launchGroup = cr[0]?.launchGroup ?? "—";
      const service = cr.map((r) => r.service).join(", ");
      return `${county} (${launchGroup}): Y1 rev $${Math.round(y1Rev).toLocaleString()}, Y1 starts ${y1Starts}, services: ${service}`;
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

County breakdown:
${countyLines}

Question: ${question}`,
    },
  ];
}
