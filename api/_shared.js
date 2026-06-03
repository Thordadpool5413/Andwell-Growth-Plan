import crypto from "crypto";
import { readFileSync } from "fs";
import path from "path";

const TOKEN_TTL_MS = 4 * 60 * 60 * 1000;

export function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.openai_api_key;
  return {
    apiKey,
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  };
}

function tokenSecret() {
  return process.env.AI_SESSION_SECRET || process.env.OPENAI_API_KEY || process.env.openai_api_key || "andwell-local-session";
}

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payload) {
  return crypto.createHmac("sha256", tokenSecret()).update(payload).digest("base64url");
}

export function issueToken() {
  const payload = base64url(JSON.stringify({ iat: Date.now(), nonce: crypto.randomBytes(12).toString("hex") }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return Date.now() - parsed.iat <= TOKEN_TTL_MS;
  } catch {
    return false;
  }
}

export async function readRequestBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function readGeneratedJson(fileName, fallback = []) {
  try {
    return JSON.parse(readFileSync(path.join(process.cwd(), "src/data/generated", fileName), "utf8"));
  } catch {
    return fallback;
  }
}

export async function seededCompetitors() {
  const [{ SEEDED_COMPETITORS }, { namedProviderRows }] = await Promise.all([
    import("../server/cms/seedData.js"),
    import("../src/data/providers.js"),
  ]);

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
      estimated_beneficiaries: provider?.beneficiaries || null,
      source_type: provider ? "seeded_provider_file_match" : "generated_local_seed",
    };
  });
}

export function qualitySummary() {
  const quality = readGeneratedJson("maineHomeHealthQuality.json");
  const hhvbp = readGeneratedJson("maineHhvbp.json");
  const benchmarks = readGeneratedJson("maineBenchmarks.json", {});
  const andwell = quality.find((row) => row.ccn === "207019" || row.normalized_name?.includes("androscoggin")) || quality[0] || null;
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

export function rowsPayload(rows, message, extra = {}) {
  return { success: true, data: rows, rows, count: Array.isArray(rows) ? rows.length : 0, message, ...extra };
}
