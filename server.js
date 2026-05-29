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
app.use(express.json());

app.post("/api/ai/chat", async (req, res) => {
  if (!OPENAI_KEY_ACTUAL) {
    res.status(503).json({ error: "AI not configured" });
    return;
  }

  const { messages, max_tokens = 700 } = req.body;
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages must be an array" });
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
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
