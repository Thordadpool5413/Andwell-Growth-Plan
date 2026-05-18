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
  "Staffing Model",
  "Sensitivity",
  "Opportunity Score",
  "Launch Timeline",
  "Board Report",
  "Launch Checklist",
];

export const STAFFING_RATIOS = {
  "Home Healthcare": { role: "RN / LPN", patientsPerFTE: 25, avgSalary: 78000 },
  "Mobile Wound": { role: "Wound Care Specialist", patientsPerFTE: 15, avgSalary: 85000 },
  "Therapy Care": { role: "PT / OT / SLP", patientsPerFTE: 20, avgSalary: 82000 },
};

export const SENSITIVITY_VARIABLES = [
  { key: "conversionRate", label: "Conversion Rate", base: 0.75, low: 0.55, high: 0.95, format: "percent" },
  { key: "hhCapture", label: "HH Y1 Capture Rate", base: 0.10, low: 0.05, high: 0.20, format: "percent" },
  { key: "woundCapture", label: "Wound Y1 Capture Rate", base: 0.25, low: 0.10, high: 0.40, format: "percent" },
  { key: "therapyCapture", label: "Therapy Y1 Capture Rate", base: 0.20, low: 0.10, high: 0.35, format: "percent" },
  { key: "hhReimbursement", label: "HH Reimbursement", base: 3189, low: 2500, high: 4000, format: "currency" },
  { key: "woundReimbursement", label: "Wound Reimbursement", base: 1800, low: 1200, high: 2400, format: "currency" },
];

export const OPPORTUNITY_WEIGHTS = {
  marketSize: 0.25,
  lowCompetition: 0.20,
  andwellPresence: 0.15,
  revenueEfficiency: 0.20,
  growthPotential: 0.20,
};

export const HEATMAP_MODES = [
  { key: "priority", label: "Priority Group" },
  { key: "revenue", label: "Revenue Opportunity" },
  { key: "demand", label: "Demand Pool" },
  { key: "competition", label: "Competition Density" },
  { key: "penetration", label: "Market Penetration" },
];
