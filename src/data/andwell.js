export const ANDWELL_CCN = "207019";

export const NATIONAL_CHAIN_PATTERNS = [
  "amedisys",
  "beacon hospice",
  "centerwell",
  "gentiva",
  "kindred",
  "compassus",
  "elara",
  "constellation",
  "enhabit",
  "lhc group",
  "bayada",
];

export const HEALTH_SYSTEM_PATTERNS = [
  "mainehealth",
  "northern light",
  "mainegeneral",
  "york hospital",
  "st joseph",
  "chans",
];

export function classifyProvider(value = {}) {
  const name = (value.provider_name || value.providerName || value.name || "").toLowerCase();
  const ownership = (value.ownership || value.parent_company || "").toLowerCase();
  const source = `${name} ${ownership}`;

  if (!source.trim()) {
    return { classification: "Unknown", confidence: "low", evidence: "Provider name unavailable." };
  }
  if (NATIONAL_CHAIN_PATTERNS.some((pattern) => source.includes(pattern))) {
    return { classification: "National chain", confidence: "high", evidence: "Matched known national chain naming pattern." };
  }
  if (HEALTH_SYSTEM_PATTERNS.some((pattern) => source.includes(pattern))) {
    return { classification: "Hospital or health system affiliated provider", confidence: "medium", evidence: "Matched Maine hospital or health-system naming pattern." };
  }
  if (source.includes("community") || source.includes("county") || source.includes("visiting nurse") || source.includes("vna")) {
    return { classification: "Regional system", confidence: "medium", evidence: "Matched regional or community provider naming pattern." };
  }
  return { classification: "Local provider", confidence: "low", evidence: "No chain or health-system pattern found in bundled records." };
}
