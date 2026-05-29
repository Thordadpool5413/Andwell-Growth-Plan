import express from "express";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = process.env.NODE_ENV !== "production";
const PORT = process.env.PORT || 5000;

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1";
const OPENAI_KEY_ACTUAL = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || OPENAI_KEY;

const app = express();
app.use(express.json({ limit: "32kb" }));

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

function originCheck(req, res, next) {
  const origin = req.headers.origin || "";
  const host = req.headers.host || "";
  const referer = req.headers.referer || "";
  const devDomain = process.env.REPLIT_DEV_DOMAIN || "";
  const replitDomains = (process.env.REPLIT_DOMAINS || "").split(",").map((d) => d.trim());

  const allowed =
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    (devDomain && origin.includes(devDomain)) ||
    replitDomains.some((d) => d && origin.includes(d)) ||
    (referer && (referer.includes(host) || (devDomain && referer.includes(devDomain))));

  if (!allowed) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}

app.post("/api/ai/chat", originCheck, rateLimit, async (req, res) => {
  if (!OPENAI_KEY_ACTUAL) {
    res.status(503).json({ error: "AI not configured — add OPENAI_API_KEY to secrets." });
    return;
  }

  const { messages, max_tokens = 700 } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages must be a non-empty array" });
    return;
  }
  if (max_tokens > 1500) {
    res.status(400).json({ error: "max_tokens exceeds limit" });
    return;
  }

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
        max_tokens,
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
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
