import { COLORS } from "./constants.js";

const services = {
  "Home Healthcare": { color: COLORS.blue, role: "Foundation service line", unit: "admissions", reimbursement: 3189, margin: 0.18, conversion: 0.75, demandRate: 0.08 },
  "Mobile Wound": { color: COLORS.red, role: "Specialty growth line", unit: "wound service starts", reimbursement: 1800, margin: 0.24, conversion: 0.75, demandRate: 0.025 },
  "Therapy Care": { color: COLORS.green, role: "Referral retention line", unit: "therapy service starts", reimbursement: 1650, margin: 0.2, conversion: 0.75, demandRate: 0.05 },
  GUIDE: { color: COLORS.purple, role: "Validation only line", unit: "validated dementia care enrollments", reimbursement: 0, margin: 0, conversion: 0.75, demandRate: 0, disclaimer: "GUIDE is not a revenue line in this model." },
  Hospice: { color: "#9333ea", role: "Future expansion line", unit: "hospice admissions", reimbursement: 14723, margin: 0.22, conversion: 0.75, demandRate: 0.06, disclaimer: "Hospice values are modeled from CMS 2024 geographic data; not yet validated against Andwell actuals." },
};

export default services;
