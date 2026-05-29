import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";
import { runMigrations } from "./scripts/db-migrate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 5000;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_KEY_ACTUAL = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || OPENAI_KEY;

const app = express();
app.use(express.json({ limit: "32kb" }));

const ALLOWED_HOSTS = new Set(
  [
    "localhost",
    "127.0.0.1",
    process.env.REPLIT_DEV_DOMAIN,
    ...(process.env.REPLIT_DOMAINS || "").split(",").map((d) => d.trim()),
  ].filter(Boolean)
);

function isAllowedHost(hostHeader) {
  if (!hostHeader) return false;
  const bare = hostHeader.split(":")[0].toLowerCase();
  return (
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    [...ALLOWED_HOSTS].some((h) => {
      const cleanH = h.split(":")[0].toLowerCase();
      return bare === cleanH;
    })
  );
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
  const origin = req.headers.origin;
  if (!origin) {
    res.status(403).json({ error: "Forbidden: browser Origin header required" });
    return;
  }
  let originHost;
  try {
    originHost = new URL(origin).hostname;
  } catch {
    res.status(403).json({ error: "Forbidden: invalid Origin" });
    return;
  }
  const serverHost = (req.headers.host || "").split(":")[0].toLowerCase();
  const allowed =
    originHost === serverHost ||
    originHost === "localhost" ||
    originHost === "127.0.0.1" ||
    [...ALLOWED_HOSTS].some((h) => {
      const cleanH = h.split(":")[0].toLowerCase();
      return originHost === cleanH;
    });
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
const MAX_CONTENT_LEN = 8000;

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
  if (!OPENAI_KEY_ACTUAL) {
    res.status(503).json({ error: "AI not configured — add OPENAI_API_KEY to secrets." });
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
    const mod = await loadCms().catch(() => null);
    const cmsTools = mod?.CMS_TOOLS || [];
    let chatMessages = messages;

    // CMS tool-call pre-pass (non-streaming) — runs before streaming the final answer
    if (cmsTools.length && mod) {
      let toolRound = 0;
      while (toolRound < 2) {
        const toolRes = await fetch(`${OPENAI_BASE}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY_ACTUAL}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: chatMessages,
            tools: cmsTools,
            tool_choice: "auto",
            max_tokens: clampedTokens,
          }),
        });
        if (!toolRes.ok) break;
        const toolData = await toolRes.json();
        const choice = toolData.choices?.[0];
        if (!choice || choice.finish_reason !== "tool_calls") break;

        const assistantMsg = choice.message;
        chatMessages = [...chatMessages, assistantMsg];
        for (const tc of assistantMsg.tool_calls || []) {
          let toolResult;
          try {
            const toolArgs = JSON.parse(tc.function.arguments || "{}");
            toolResult = await mod.callTool(tc.function.name, toolArgs);
          } catch (e) {
            toolResult = { error: e.message };
          }
          chatMessages = [
            ...chatMessages,
            { role: "tool", tool_call_id: tc.id, content: JSON.stringify(toolResult).slice(0, 4000) },
          ];
        }
        toolRound++;
      }
    }

    const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY_ACTUAL}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
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
  if (!OPENAI_KEY_ACTUAL) {
    res.status(503).json({ error: "AI not configured — add OPENAI_API_KEY to secrets." });
    return;
  }
  const { question } = req.body;
  if (!question || typeof question !== "string" || question.length > 2000) {
    res.status(400).json({ error: "question must be a non-empty string under 2000 chars" });
    return;
  }

  try {
    const mod = await loadCms();
    const tools = mod?.CMS_TOOLS || [];

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
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
        tools: openaiTools.length ? openaiTools : undefined,
        tool_choice: openaiTools.length ? "auto" : undefined,
      };

      const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_KEY_ACTUAL}`,
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
    server: { middlewareMode: true },
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
