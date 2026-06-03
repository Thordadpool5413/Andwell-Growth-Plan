import { getOpenAiConfig, readRequestBody, sendJson, verifyToken } from "../_shared.js";

const VALID_ROLES = new Set(["system", "user", "assistant"]);
const MAX_MESSAGES = 10;
const MAX_CONTENT_LEN = 32000;

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array";
  if (messages.length > MAX_MESSAGES) return `too many messages (max ${MAX_MESSAGES})`;
  for (const message of messages) {
    if (!VALID_ROLES.has(message.role)) return `invalid role: ${message.role}`;
    if (typeof message.content !== "string") return "message content must be a string";
    if (message.content.length > MAX_CONTENT_LEN) return `message content too long (max ${MAX_CONTENT_LEN} chars)`;
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    sendJson(res, 405, { success: false, error: "Method not allowed" });
    return;
  }

  const token = req.headers["x-ai-token"] || "";
  if (!verifyToken(token)) {
    sendJson(res, 401, { success: false, error: "Unauthorized: obtain a token from /api/ai/token first" });
    return;
  }

  const { apiKey, baseUrl, model } = getOpenAiConfig();
  if (!apiKey) {
    sendJson(res, 503, { success: false, error: "AI is not configured. Set OPENAI_API_KEY in Vercel environment variables." });
    return;
  }

  let body;
  try {
    body = await readRequestBody(req);
  } catch {
    sendJson(res, 400, { success: false, error: "Invalid JSON request body." });
    return;
  }

  const { messages, max_tokens = 700 } = body;
  const validationError = validateMessages(messages);
  if (validationError) {
    sendJson(res, 400, { success: false, error: validationError });
    return;
  }

  const clampedTokens = Math.min(Math.max(Number(max_tokens) || 700, 50), 1500);
  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: clampedTokens,
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    sendJson(res, upstream.status, { success: false, error: `Upstream AI error: ${text.slice(0, 240)}` });
    return;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(decoder.decode(value, { stream: true }));
  }
  res.end();
}
