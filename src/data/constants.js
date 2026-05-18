export const COLORS = {
  blue: "#2563eb",
  green: "#16a34a",
  purple: "#7c3aed",
  red: "#dc2626",
  amber: "#f59e0b",
  slate: "#64748b",
};

export const DARK_COLORS = {
  bg: "#0f172a",
  surface: "#1e293b",
  surfaceHover: "#334155",
  border: "#334155",
  text: "#f1f5f9",
  textMuted: "#94a3b8",
  accent: "#3b82f6",
};

export const DEFAULT_SCENARIO = {
  conversionRate: 0.75,
  hhCapture: [0.1, 0.15, 0.2],
  woundCapture: [0.25, 0.35, 0.45],
  therapyCapture: [0.2, 0.3, 0.4],
  marginOverrides: {},
};

export const TABS = [
  "Executive View",
  "County Plan",
  "Referral Plan",
  "Competitive View",
  "Service Lines",
  "CMS Data",
  "Financial Model",
  "Launch Checklist",
];

export const HEATMAP_MODES = [
  { key: "priority", label: "Priority Group" },
  { key: "revenue", label: "Revenue Opportunity" },
  { key: "demand", label: "Demand Pool" },
  { key: "competition", label: "Competition Density" },
  { key: "penetration", label: "Market Penetration" },
];
