import { query } from "./db.js";

const CRAWL_TIMEOUT_MS = 12000;

const SERVICE_PATTERNS = [
  { pattern: /hospice/i, service: "Hospice" },
  { pattern: /home\s*health/i, service: "Home Health" },
  { pattern: /palliative/i, service: "Palliative Care" },
  { pattern: /wound\s*(care)?/i, service: "Wound Care" },
  { pattern: /therapy|physical\s*therapy|occupational|speech/i, service: "Therapy" },
  { pattern: /caregiver|personal\s*care|companion/i, service: "Caregiver Support" },
  { pattern: /bereavement|grief/i, service: "Grief Support" },
  { pattern: /dementia|memory\s*care|alzheimer/i, service: "Dementia Care" },
];

const MAINE_COUNTIES = [
  "Androscoggin", "Aroostook", "Cumberland", "Franklin", "Hancock",
  "Kennebec", "Knox", "Lincoln", "Oxford", "Penobscot", "Piscataquis",
  "Sagadahoc", "Somerset", "Waldo", "Washington", "York",
];

const QUALITY_PATTERNS = [
  /medicare\s+quality/i, /star\s+rating/i, /quality\s+award/i,
  /accreditat/i, /joint\s+commission/i, /chap\s+accredit/i,
  /five[- ]?star|5[- ]?star/i, /excellence\s+award/i, /best\s+hospice/i,
];

const NATIONAL_CHAIN_PATTERNS = [
  { pattern: /amedisys/i, name: "Amedisys" },
  { pattern: /gentiva/i, name: "Gentiva" },
  { pattern: /kindred/i, name: "Kindred at Home" },
  { pattern: /compassus/i, name: "Compassus" },
  { pattern: /constellation/i, name: "Constellation Health" },
  { pattern: /lhc\s*group/i, name: "LHC Group" },
  { pattern: /centerwell/i, name: "Centerwell" },
  { pattern: /enhabit/i, name: "Enhabit" },
];

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HealthPlanResearchBot/1.0)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Crawl timed out");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20000);
}

function extractServices(text) {
  return [...new Set(SERVICE_PATTERNS.filter((p) => p.pattern.test(text)).map((p) => p.service))];
}

function extractCounties(text) {
  return MAINE_COUNTIES.filter((c) => new RegExp(`\\b${c}\\b`, "i").test(text));
}

function extractQualityClaims(text) {
  const claims = [];
  for (const p of QUALITY_PATTERNS) {
    const match = text.match(new RegExp(`.{0,60}${p.source}.{0,60}`, "i"));
    if (match) claims.push(match[0].trim().slice(0, 120));
  }
  return [...new Set(claims)].slice(0, 5);
}

function detectParentCompany(text, seedParent) {
  if (seedParent) {
    if (new RegExp(seedParent, "i").test(text)) return seedParent;
  }
  for (const nc of NATIONAL_CHAIN_PATTERNS) {
    if (nc.pattern.test(text)) return nc.name;
  }
  const subsidiaryMatch = text.match(/(?:a|an)\s+([\w\s]+?)\s+company/i);
  if (subsidiaryMatch) return subsidiaryMatch[1].trim().slice(0, 60);
  return null;
}

export async function crawlCompetitorWebsite(competitorSeedId, url, seedParent) {
  const updateStatus = async (status, data = {}) => {
    try {
      await query(
        `INSERT INTO competitor_web_profiles
          (competitor_seed_id, crawled_url, services_raw, counties_raw, quality_claims,
           parent_company_raw, staff_info, contact_info, crawl_status, crawled_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
         ON CONFLICT (competitor_seed_id) DO UPDATE SET
           crawled_url=$2, services_raw=$3, counties_raw=$4, quality_claims=$5,
           parent_company_raw=$6, staff_info=$7, contact_info=$8,
           crawl_status=$9, crawled_at=NOW(), updated_at=NOW()`,
        [
          competitorSeedId, url,
          data.services || [], data.counties || [], data.qualityClaims || [],
          data.parentCompany || null, data.staffInfo || null, data.contactInfo || null,
          status,
        ]
      );
    } catch (err) {
      console.error("[Crawler] DB update error:", err.message);
    }
  };

  if (!url) {
    await updateStatus("no_url");
    return { status: "no_url" };
  }

  try {
    const html = await fetchPage(url);
    const text = extractText(html);

    const services = extractServices(text);
    const counties = extractCounties(text);
    const qualityClaims = extractQualityClaims(text);
    const parentCompany = detectParentCompany(text, seedParent);

    const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/);
    const contactInfo = phoneMatch ? phoneMatch[0] : null;

    const staffPatterns = [/\d+\s+(?:employees|staff|team\s+members|clinicians)/i, /(?:more than|over)\s+\d+\s+\w+/i];
    let staffInfo = null;
    for (const p of staffPatterns) {
      const m = text.match(p);
      if (m) { staffInfo = m[0].slice(0, 100); break; }
    }

    await updateStatus("success", { services, counties, qualityClaims, parentCompany, staffInfo, contactInfo });
    // Upgrade CMS Verified → CMS and Website Verified when crawl succeeds
    try {
      await query(
        `UPDATE competitor_cms_matches SET match_status='CMS and Website Verified', updated_at=NOW()
         WHERE competitor_seed_id=$1 AND match_status='CMS Verified'`,
        [competitorSeedId]
      );
    } catch (_) {}
    return { status: "success", services, counties, qualityClaims, parentCompany };
  } catch (err) {
    console.error(`[Crawler] Failed to crawl ${url}:`, err.message);
    await updateStatus("failed");
    return { status: "failed", error: err.message };
  }
}

export async function crawlAllCompetitors() {
  const seeds = await query("SELECT id, name, website_url, parent_company FROM competitor_seeds ORDER BY id");
  const results = [];
  for (const seed of seeds.rows) {
    console.log(`[Crawler] Crawling: ${seed.name}`);
    const result = await crawlCompetitorWebsite(seed.id, seed.website_url, seed.parent_company);
    results.push({ name: seed.name, ...result });
    await new Promise((r) => setTimeout(r, 1500));
  }
  return results;
}
