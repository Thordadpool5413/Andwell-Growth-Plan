import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";
import { readFileSync } from "fs";
import { runMigrations } from "./scripts/db-migrate.js";
import { ANDWELL_CCN } from "./src/data/andwell.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 5000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.openai_api_key;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const app = express();
app.use(express.json({ limit: "32kb" }));

const ALLOWED_HOST_SUFFIXES = [".replit.dev", ".replit.app", ".repl.co", ".vercel.app"];

function normalizeHost(hostHeader) {
  return (hostHeader || "").split(":")[0].toLowerCase();
}

function isAllowedHost(hostHeader) {
  const bare = normalizeHost(hostHeader);
  if (!bare) return false;
  if (bare === "localhost" || bare === "127.0.0.1" || bare === "0.0.0.0") return true;
  if (ALLOWED_HOST_SUFFIXES.some((suffix) => bare.endsWith(suffix))) return true;
  const extra = (process.env.ALLOWED_HOSTS || "").split(",").map((d) => normalizeHost(d.trim())).filter(Boolean);
  return extra.includes(bare);
}

const SESSION_TOKENS = new Map();
const TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

function issueToken() {
  const token = crypto.randomBytes(24).toString("hex");
  SESSION_TOKENS.set(token, Date.now());
  if (SESSION_TOKENS.size > 5000) {
    const cutoff = Date.now() - TOKEN_TTL_MS;
    for (const [k, t] of SESSION_TOKENS) {
      if (t < cutoff) SESSION_TOKENS.delete(k);
    }
  }
  return token;
}

function verifyToken(token) {
  const issued = SESSION_TOKENS.get(token);
  if (!issued) return false;
  if (Date.now() - issued > TOKEN_TTL_MS) {
    SESSION_TOKENS.delete(token);
    return false;
  }
  return true;
}

app.get("/api/ai/token", (req, res) => {
  if (!isAllowedHost(req.headers.host)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({ token: issueToken() });
});

const rateLimitMap = new Map();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

function rateLimit(req, res, next) {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count += 1;
  rateLimitMap.set(ip, entry);
  if (entry.count > RATE_MAX) {
    res.status(429).json({ error: "Too many requests — try again in a minute." });
    return;
  }
  next();
}

function strictOriginCheck(req, res, next) {
  const requestHost = req.headers.host;
  if (!isAllowedHost(requestHost)) {
    res.status(403).json({ error: "Forbidden: host not allowed" });
    return;
  }

  const origin = req.headers.origin;
  if (!origin) {
    next();
    return;
  }

  let originHost;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    res.status(403).json({ error: "Forbidden: invalid Origin" });
    return;
  }

  const allowed = normalizeHost(originHost) === normalizeHost(requestHost) || isAllowedHost(originHost);
  if (!allowed) {
    res.status(403).json({ error: "Forbidden: cross-origin request denied" });
    return;
  }
  next();
}

function tokenCheck(req, res, next) {
  const token = req.headers["x-ai-token"] || "";
  if (!verifyToken(token)) {
    res.status(401).json({ error: "Unauthorized: obtain a token from /api/ai/token first" });
    return;
  }
  next();
}

const VALID_ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 10;
const MAX_CONTENT_LEN = 32000;

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return `too many messages (max ${MAX_MESSAGES})`;
  for (const m of messages) {
    if (!VALID_ROLES.has(m.role)) return `invalid role: ${m.role}`;
    if (typeof m.content !== "string") return "message content must be a string";
    if (m.content.length > MAX_CONTENT_LEN) return `message content too long (max ${MAX_CONTENT_LEN} chars)`;
  }
  return null;
}

app.post("/api/ai/chat", strictOriginCheck, tokenCheck, rateLimit, async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: "AI not configured — set OPENAI_API_KEY in the deployment environment." });
    return;
  }

  const { messages, max_tokens = 700 } = req.body;
  const validationError = validateMessages(messages);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }
  const clampedTokens = Math.min(Math.max(Number(max_tokens) || 700, 50), 1500);

  try {
    let chatMessages = messages;

    const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: chatMessages,
        stream: true,
        max_tokens: clampedTokens,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      res.status(upstream.status).json({ error: `Upstream AI error: ${errText.slice(0, 200)}` });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }

    res.end();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// ──────────────────────────────────────────────
// AI + CMS function calling route
// ──────────────────────────────────────────────
app.post("/api/ai/cms-analyze", strictOriginCheck, tokenCheck, rateLimit, async (req, res) => {
  if (!OPENAI_API_KEY) {
    res.status(503).json({ error: "AI not configured — set OPENAI_API_KEY in the deployment environment." });
    return;
  }
  const { question } = req.body;
  if (!question || typeof question !== "string" || question.length > 2000) {
    res.status(400).json({ error: "question must be a non-empty string under 2000 chars" });
    return;
  }

  try {
    const mod = await loadCms();
    const READ_ONLY_TOOLS = new Set([
      "search_cms_provider_datasets", "get_cms_dataset_metadata", "query_cms_dataset",
      "fetch_maine_hospice_providers", "fetch_maine_home_health_agencies",
      "match_competitor_to_cms_provider", "normalize_provider_identity",
      "get_provider_quality_snapshot", "get_provider_service_area_snapshot",
    ]);
    const tools = (mod?.CMS_TOOLS || []).filter((tool) => READ_ONLY_TOOLS.has(tool.function?.name));

    const openaiTools = tools;

    const messages = [
      {
        role: "system",
        content: `You are a competitive intelligence analyst for Andwell, a Maine home health and hospice provider. You have access to CMS (Centers for Medicare & Medicaid Services) Provider Data Catalog tools to look up competitor certifications, quality scores, service areas, and Medicare enrollment data. Use these tools to answer questions about Maine home health and hospice competitors. Be concise and specific.`,
      },
      { role: "user", content: question },
    ];

    let iterations = 0;
    const MAX_ITERATIONS = 3;

    while (iterations < MAX_ITERATIONS) {
      iterations++;
      const body = {
        model: OPENAI_MODEL,
        messages,
        max_tokens: 1000,
        tools: openaiTools.length ? openaiTools : undefined,
        tool_choice: openaiTools.length ? "auto" : undefined,
      };

      const upstream = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!upstream.ok) {
        const errText = await upstream.text().catch(() => "");
        res.status(upstream.status).json({ error: `Upstream AI error: ${errText.slice(0, 200)}` });
        return;
      }

      const data = await upstream.json();
      const choice = data.choices?.[0];
      if (!choice) {
        res.status(500).json({ error: "No response from AI" });
        return;
      }

      messages.push(choice.message);

      if (choice.finish_reason === "stop" || choice.finish_reason === "length") {
        res.json({
          answer: choice.message.content,
          tool_calls_made: messages.filter((m) => m.role === "tool").length,
          model: data.model,
        });
        return;
      }

      if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
        for (const tc of choice.message.tool_calls) {
          let toolResult;
          try {
            const args = JSON.parse(tc.function.arguments || "{}");
            toolResult = mod ? await mod.callTool(tc.function.name, args) : { error: "CMS module not ready" };
          } catch (err) {
            toolResult = { error: err.message };
          }
          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult),
          });
        }
        continue;
      }

      res.json({ answer: choice.message.content || "(no response)", tool_calls_made: 0, model: data.model });
      return;
    }

    res.status(429).json({ error: "Too many tool call iterations" });
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// CMS MCP Routes
// ──────────────────────────────────────────────
let cmsReady = false;
// ──────────────────────────────────────────────
// DB bootstrap — must complete before CMS seeding
// ──────────────────────────────────────────────
try {
  await runMigrations();
} catch (err) {
  console.error("[startup] DB migration failed — CMS features may be unavailable:", err.message);
}

let cmsModule = null;

async function loadCms() {
  if (cmsModule) return cmsModule;
  try {
    cmsModule = await import("./server/cms/cmsMcpServer.js");
    await cmsModule.seedCompetitors();
    cmsReady = true;
    console.log("[CMS] MCP server ready");
    return cmsModule;
  } catch (err) {
    console.error("[CMS] Failed to load MCP server:", err.message);
    return null;
  }
}

await loadCms();

function cmsReadyCheck(req, res, next) {
  if (!cmsReady || !cmsModule) {
    res.status(503).json({ error: "CMS module not yet ready. Retry in a moment." });
    return;
  }
  next();
}


const generatedDataCache = new Map();

function readGeneratedJson(fileName, fallback = []) {
  if (generatedDataCache.has(fileName)) return generatedDataCache.get(fileName);
  try {
    const value = JSON.parse(readFileSync(path.join(__dirname, "src/data/generated", fileName), "utf8"));
    generatedDataCache.set(fileName, value);
    return value;
  } catch (err) {
    console.warn(`[seed-data] Unable to read ${fileName}: ${err.message}`);
    return fallback;
  }
}

function cleanError(err) {
  const message = err?.message || String(err || "Unknown error");
  return message.includes("password") || message.includes("secret") ? "Data service unavailable." : message;
}

function rowsPayload(rows, message, extra = {}) {
  return { success: true, data: rows, rows, count: Array.isArray(rows) ? rows.length : 0, message, ...extra };
}

function seededQualitySummary() {
  const quality = readGeneratedJson("maineHomeHealthQuality.json");
  const hhvbp = readGeneratedJson("maineHhvbp.json");
  const benchmarks = readGeneratedJson("maineBenchmarks.json", {});
  const andwell = quality.find((row) => row.ccn === ANDWELL_CCN || row.normalized_name?.includes("androscoggin")) || quality[0] || null;
  const starRows = quality.filter((row) => row.star_rating != null).sort((a, b) => (b.star_rating || 0) - (a.star_rating || 0));
  const rank = andwell ? starRows.findIndex((row) => row.ccn === andwell.ccn) + 1 : null;
  return {
    success: true,
    has_data: Boolean(andwell),
    andwell,
    state_avg_star: benchmarks.home_health?.avg_quality_star_rating ?? null,
    total_maine_agencies: quality.length,
    andwell_rank: rank > 0 ? rank : null,
    hhvbp: hhvbp.find((row) => row.ccn === andwell?.ccn) || hhvbp[0] || null,
    message: "Loaded from bundled CMS quality seed data.",
  };
}

async function seededCompetitors() {
  const { SEEDED_COMPETITORS } = await import("./server/cms/seedData.js");
  const { namedProviderRows } = await import("./src/data/providers.js");
  return SEEDED_COMPETITORS.map((seed, index) => {
    const aliases = [seed.name, ...(seed.aliases || [])].map((value) => value.toLowerCase().slice(0, 12));
    const provider = namedProviderRows.find((row) => aliases.some((alias) => row.providerName.toLowerCase().includes(alias)));
    return {
      id: `seed-${index}`,
      name: seed.name,
      aliases: seed.aliases || [],
      parent_company: seed.parent_company,
      provider_type: seed.provider_type,
      website_url: seed.website_url,
      known_counties: seed.known_counties || [],
      counties_raw: seed.known_counties || [],
      match_status: provider ? "Seeded provider-file match" : "Seeded competitor",
      match_confidence: provider ? 0.82 : 0.6,
      city: provider?.locationCounty || null,
      county: provider?.locationCounty || seed.known_counties?.[0] || null,
      quality_snapshot_score: provider?.providerVolumeShare || null,
      source_type: provider ? "seeded_provider_file_match" : "generated_local_seed",
    };
  });
}

app.get("/api/cms/stats", strictOriginCheck, tokenCheck, async (_req, res) => {
  const sourceStatus = readGeneratedJson("cmsDataSourceStatus.json", {});
  const competitors = await seededCompetitors();
  res.json({
    success: true,
    datasetsDiscovered: Object.keys(sourceStatus.sources || {}).length,
    maineHospiceProviders: readGeneratedJson("maineHospiceProviders.json").length,
    maineHHAgencies: readGeneratedJson("maineHomeHealthAgencies.json").length,
    competitorMatches: competitors.length,
    needsReview: 0,
    lastSync: { t: sourceStatus.generated_at },
    datasetList: Object.values(sourceStatus.sources || {}),
    message: "Loaded from bundled CMS/HRSA seed data.",
  });
});

app.get("/api/cms/competitors", strictOriginCheck, tokenCheck, async (_req, res) => {
  const competitors = await seededCompetitors();
  res.json({ success: true, data: competitors, competitors, count: competitors.length, message: "Loaded seeded competitor records." });
});

app.get("/api/cms/hh-quality", strictOriginCheck, tokenCheck, (_req, res) => {
  res.json(rowsPayload(readGeneratedJson("maineHomeHealthQuality.json"), "Loaded from bundled CMS Home Health quality seed data."));
});

app.get("/api/cms/hh-quality-history", strictOriginCheck, tokenCheck, (_req, res) => {
  const agencies = readGeneratedJson("maineHomeHealthQuality.json").map((row) => ({
    ccn: row.ccn,
    provider_name: row.provider_name,
    snapshots: [{ date: row.generated_at, star_rating: row.star_rating, ppr_rate: null, synced_at: row.generated_at }],
  }));
  res.json({ success: true, data: agencies, agencies, count: agencies.length, message: "Loaded one bundled CMS quality snapshot." });
});

app.get("/api/cms/hospice-quality", strictOriginCheck, tokenCheck, (_req, res) => {
  res.json(rowsPayload(readGeneratedJson("maineHospiceCahps.json"), "Loaded from bundled CMS Hospice CAHPS seed data."));
});

app.get("/api/cms/hhvbp", strictOriginCheck, tokenCheck, (_req, res) => {
  const rows = readGeneratedJson("maineHhvbp.json");
  const scored = rows.map((row) => row.total_performance_score).filter((value) => value != null);
  const avg = scored.length ? scored.reduce((sum, value) => sum + Number(value), 0) / scored.length : null;
  res.json(rowsPayload(rows, "Loaded from bundled CMS HHVBP seed data.", { state_avg_tps: avg != null ? Number(avg.toFixed(2)) : null, national_avg_tps: null }));
});

app.get("/api/cms/quality-summary", strictOriginCheck, tokenCheck, (_req, res) => {
  res.json(seededQualitySummary());
});

app.post("/api/cms/sync-quality", strictOriginCheck, tokenCheck, (_req, res) => {
  res.json({ success: false, error: "Quality refresh is reserved for developer/admin operations.", details: "Bundled CMS/HRSA seed data is already loaded for normal dashboard use." });
});

app.get("/api/cms/stats", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.json({ datasetsDiscovered: 0, maineHospiceProviders: 0, maineHHAgencies: 0, competitorMatches: 0, needsReview: 0 }); return; }
    const stats = await mod.getCmsStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/competitors", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.json({ competitors: [] }); return; }
    const competitors = await mod.getCompetitorSummary();
    res.json({ competitors, count: competitors.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/sync", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const providerType = req.body?.provider_type || "both";
    const result = await mod.callTool("sync_cms_provider_data", { provider_type: providerType });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/crawl", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { crawlAllCompetitors } = await import("./server/cms/competitorCrawler.js");
    res.json({ status: "started", message: "Crawl running in background." });
    crawlAllCompetitors().then((results) => {
      console.log("[Crawl] Complete:", results.map((r) => `${r.name}:${r.status}`).join(", "));
    }).catch((err) => {
      console.error("[Crawl] Error:", err.message);
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/match", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const { competitor_name, provider_type } = req.body;
    if (!competitor_name) { res.status(400).json({ error: "competitor_name required" }); return; }
    const result = await mod.callTool("match_competitor_to_cms_provider", {
      competitor_name,
      provider_type: provider_type || "both",
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/search-datasets", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const { keyword, topic } = req.body;
    if (!keyword) { res.status(400).json({ error: "keyword required" }); return; }
    const result = await mod.callTool("search_cms_provider_datasets", { keyword, topic });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/query-dataset", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const { dataset_id, filters, limit, offset } = req.body;
    if (!dataset_id) { res.status(400).json({ error: "dataset_id required" }); return; }
    const result = await mod.callTool("query_cms_dataset", { dataset_id, filters, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/tool", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const { tool_name, args } = req.body;
    if (!tool_name) { res.status(400).json({ error: "tool_name required" }); return; }
    const ALLOWED_TOOLS = new Set([
      "search_cms_provider_datasets", "get_cms_dataset_metadata", "query_cms_dataset",
      "fetch_maine_hospice_providers", "fetch_maine_home_health_agencies",
      "match_competitor_to_cms_provider", "normalize_provider_identity",
      "get_provider_quality_snapshot", "get_provider_service_area_snapshot",
    ]);
    if (!ALLOWED_TOOLS.has(tool_name)) {
      res.status(400).json({ error: `Unknown or restricted tool: ${tool_name}` });
      return;
    }
    const result = await mod.callTool(tool_name, args || {});
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/hh-quality", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { query: dbQuery } = await import("./server/cms/db.js");
    const result = await dbQuery(
      `SELECT q.*,
              cs.name AS seed_name,
              trend.trend_direction,
              trend.prev_star_rating
       FROM cms_hh_quality q
       LEFT JOIN cms_provider_records cpr ON cpr.cms_certification_number = q.ccn AND cpr.state = 'ME'
       LEFT JOIN competitor_cms_matches ccm ON ccm.cms_provider_record_id = cpr.id
       LEFT JOIN competitor_seeds cs ON cs.id = ccm.competitor_seed_id
       LEFT JOIN LATERAL (
         SELECT
           CASE
             WHEN COUNT(*) < 2 THEN 'flat'
             WHEN (array_agg(star_rating ORDER BY measure_date DESC))[1] >
                  (array_agg(star_rating ORDER BY measure_date DESC))[2] THEN 'up'
             WHEN (array_agg(star_rating ORDER BY measure_date DESC))[1] <
                  (array_agg(star_rating ORDER BY measure_date DESC))[2] THEN 'down'
             ELSE 'flat'
           END AS trend_direction,
           (array_agg(star_rating ORDER BY measure_date DESC))[2] AS prev_star_rating
         FROM cms_hh_quality_history
         WHERE ccn = q.ccn AND star_rating IS NOT NULL
       ) trend ON true
       WHERE q.state = 'ME'
       ORDER BY q.star_rating DESC NULLS LAST, q.provider_name`
    );
    res.json({ rows: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/hh-quality-history", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { query: dbQuery } = await import("./server/cms/db.js");
    const result = await dbQuery(
      `SELECT ccn, provider_name, star_rating, ppr_rate, measure_date, synced_at
       FROM cms_hh_quality_history
       WHERE star_rating IS NOT NULL
       ORDER BY ccn, measure_date ASC`
    );
    const byccn = {};
    for (const row of result.rows) {
      if (!byccn[row.ccn]) byccn[row.ccn] = { ccn: row.ccn, provider_name: row.provider_name, snapshots: [] };
      byccn[row.ccn].snapshots.push({
        date: row.measure_date,
        star_rating: row.star_rating != null ? parseFloat(row.star_rating) : null,
        ppr_rate: row.ppr_rate != null ? parseFloat(row.ppr_rate) : null,
        synced_at: row.synced_at,
      });
    }
    res.json({ agencies: Object.values(byccn), count: Object.keys(byccn).length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/hospice-quality", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { query: dbQuery } = await import("./server/cms/db.js");
    const result = await dbQuery(
      `SELECT ccn, provider_name, state,
              jsonb_object_agg(measure_code, json_build_object('score', score, 'star_rating', star_rating, 'measure_name', measure_name, 'reporting_date', reporting_date)) AS measures,
              MAX(synced_at) AS synced_at
       FROM cms_hospice_quality
       WHERE state = 'ME'
       GROUP BY ccn, provider_name, state
       ORDER BY provider_name`
    );
    res.json({ rows: result.rows, count: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/hhvbp", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { query: dbQuery } = await import("./server/cms/db.js");
    const [maineResult, nationalResult] = await Promise.all([
      dbQuery(
        `SELECT v.*,
                CASE WHEN v.ccn = '${ANDWELL_CCN}' THEN true ELSE false END AS is_andwell
         FROM cms_hhvbp_scores v
         WHERE v.state = 'ME'
         ORDER BY v.total_performance_score DESC NULLS LAST`
      ),
      dbQuery(
        `SELECT AVG(total_performance_score::numeric) AS nat_avg
         FROM cms_hhvbp_scores
         WHERE total_performance_score IS NOT NULL`
      ),
    ]);
    const scoredRows = maineResult.rows.filter((r) => r.total_performance_score != null);
    const stateAvgTps = scoredRows.length
      ? scoredRows.reduce((s, r) => s + parseFloat(r.total_performance_score), 0) / scoredRows.length
      : null;
    const nationalAvgRaw = nationalResult.rows[0]?.nat_avg;
    const nationalAvgTps = nationalAvgRaw != null ? parseFloat(parseFloat(nationalAvgRaw).toFixed(2)) : null;
    res.json({
      rows: maineResult.rows,
      count: maineResult.rows.length,
      state_avg_tps: stateAvgTps != null ? parseFloat(stateAvgTps.toFixed(2)) : null,
      national_avg_tps: nationalAvgTps,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/quality-summary", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const { query: dbQuery } = await import("./server/cms/db.js");
    const [andwellRow, stateRow, rankRow, hhvbpRow, competitorAvgRow] = await Promise.all([
      dbQuery(`SELECT * FROM cms_hh_quality WHERE ccn = '${ANDWELL_CCN}' LIMIT 1`),
      dbQuery(`SELECT AVG(star_rating) AS avg_star, AVG(ppr_rate) AS avg_ppr, AVG(medicare_spend_ratio) AS avg_spend, COUNT(*) AS total_agencies FROM cms_hh_quality WHERE state = 'ME' AND star_rating IS NOT NULL`),
      dbQuery(`SELECT COUNT(*) AS rank FROM cms_hh_quality WHERE state = 'ME' AND star_rating > (SELECT COALESCE((SELECT star_rating FROM cms_hh_quality WHERE ccn = '${ANDWELL_CCN}'), 0))`),
      dbQuery(`SELECT total_performance_score, payment_adjustment_pct FROM cms_hhvbp_scores WHERE ccn = '${ANDWELL_CCN}' LIMIT 1`),
      // Competitor average: avg star rating of all seeded competitors (excludes Andwell CCN 207019)
      // Joins competitor_seeds → cms_matches → cms_provider_records → cms_hh_quality
      dbQuery(`
        SELECT AVG(q.star_rating) AS avg_star,
               AVG(q.ppr_rate) AS avg_ppr,
               AVG(q.medicare_spend_ratio) AS avg_spend,
               COUNT(DISTINCT cs.id) AS count
        FROM competitor_seeds cs
        JOIN competitor_cms_matches ccm ON ccm.competitor_seed_id = cs.id
        JOIN cms_provider_records cpr ON cpr.id = ccm.cms_provider_record_id
        JOIN cms_hh_quality q ON q.ccn = cpr.cms_certification_number
        WHERE q.state = 'ME' AND q.ccn != '${ANDWELL_CCN}' AND q.star_rating IS NOT NULL
      `),
    ]);
    const andwell = andwellRow.rows[0] || null;
    const state = stateRow.rows[0] || {};
    const compAvg = competitorAvgRow.rows[0] || {};
    const rankNum = andwell ? parseInt(rankRow.rows[0]?.rank || 0) + 1 : null;
    res.json({
      andwell: andwell ? {
        ccn: andwell.ccn,
        provider_name: andwell.provider_name,
        star_rating: andwell.star_rating,
        ppr_rate: andwell.ppr_rate,
        medicare_spend_ratio: andwell.medicare_spend_ratio,
        timely_care_pct: andwell.timely_care_pct,
        walking_improve_pct: andwell.walking_improve_pct,
        med_adherence_pct: andwell.med_adherence_pct,
        fall_injury_pct: andwell.fall_injury_pct,
        synced_at: andwell.synced_at,
      } : null,
      state_avg_star: state.avg_star ? parseFloat(state.avg_star).toFixed(2) : null,
      state_avg_ppr: state.avg_ppr ? parseFloat(state.avg_ppr).toFixed(4) : null,
      state_avg_spend: state.avg_spend ? parseFloat(state.avg_spend).toFixed(2) : null,
      total_maine_agencies: parseInt(state.total_agencies || 0),
      andwell_rank: rankNum,
      competitor_avg_star: compAvg.avg_star ? parseFloat(compAvg.avg_star).toFixed(2) : null,
      competitor_avg_ppr: compAvg.avg_ppr ? parseFloat(compAvg.avg_ppr).toFixed(4) : null,
      competitor_avg_spend: compAvg.avg_spend ? parseFloat(compAvg.avg_spend).toFixed(2) : null,
      competitor_count_with_stars: parseInt(compAvg.count || 0),
      hhvbp: hhvbpRow.rows[0] || null,
      has_data: !!andwell,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/cms/sync-quality", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.status(503).json({ error: "CMS module not ready" }); return; }
    const [hhq, hosp, vbp] = await Promise.all([
      mod.callTool("sync_hh_quality_measures", {}),
      mod.callTool("sync_hospice_quality", {}),
      mod.callTool("sync_hhvbp_scores", {}),
    ]);
    res.json({ hh_quality: hhq, hospice_quality: hosp, hhvbp: vbp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/cms/tools", strictOriginCheck, tokenCheck, async (req, res) => {
  try {
    const mod = await loadCms();
    if (!mod) { res.json({ tools: [] }); return; }
    res.json({ tools: mod.CMS_TOOLS });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────
// Vite / Static
// ──────────────────────────────────────────────
if (isDev) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      allowedHosts: true,
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(__dirname, "dist");
  app.use(express.static(distPath));
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT} [${isDev ? "dev" : "production"}]`);
});

// ──────────────────────────────────────────────
// CMS sync cron — env-driven schedule and enable flag
// CMS_SYNC_ENABLED=false  → disables cron entirely
// CMS_SYNC_CRON           → cron expression (default: weekly Sun 3AM ET)
// ──────────────────────────────────────────────
async function setupCron() {
  const syncEnabled = process.env.CMS_SYNC_ENABLED !== "false";
  if (!syncEnabled) {
    console.log("[CMS Cron] Disabled via CMS_SYNC_ENABLED=false");
    return;
  }
  const cronExpr = process.env.CMS_SYNC_CRON || "0 3 * * 0";
  try {
    const cron = (await import("node-cron")).default;
    if (!cron.validate(cronExpr)) {
      console.error(`[CMS Cron] Invalid CMS_SYNC_CRON expression: "${cronExpr}" — using default`);
    }
    const expr = cron.validate(cronExpr) ? cronExpr : "0 3 * * 0";
    cron.schedule(expr, async () => {
      console.log("[CMS Cron] Starting scheduled sync...");
      try {
        const mod = await loadCms();
        if (mod) {
          await mod.callTool("sync_cms_provider_data", { provider_type: "both" });
          console.log("[CMS Cron] Scheduled sync complete");
        }
      } catch (err) {
        console.error("[CMS Cron] Sync error:", err.message);
      }
    }, { timezone: "America/New_York" });
    console.log(`[CMS Cron] Scheduled sync with expression "${expr}" (America/New_York)`);
  } catch (err) {
    console.error("[CMS Cron] Setup failed:", err.message);
  }
}

setupCron();
