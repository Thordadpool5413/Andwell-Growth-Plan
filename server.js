import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";
import crypto from "crypto";

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
    const upstream = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY_ACTUAL}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
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
