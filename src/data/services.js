import { COLORS } from "./constants.js";

const services = {
  "Home Healthcare": { color: COLORS.blue, role: "Foundation service line", unit: "admissions", reimbursement: 3189, margin: 0.18, conversion: 0.75, demandRate: 0.08 },
  "Mobile Wound": { color: COLORS.red, role: "Specialty growth line", unit: "wound service starts", reimbursement: 1800, margin: 0.24, conversion: 0.75, demandRate: 0.025 },
  "Therapy Care": { color: COLORS.green, role: "Referral retention line", unit: "therapy service starts", reimbursement: 1650, margin: 0.2, conversion: 0.75, demandRate: 0.05 },
  GUIDE: { color: COLORS.purple, role: "Validation only line", unit: "validated dementia care enrollments", reimbursement: 0, margin: 0, conversion: 0.75, demandRate: 0 },
  Hospice: { color: "#9333ea", role: "Future expansion line", unit: "hospice admissions", reimbursement: 0, margin: 0, conversion: 0.75, demandRate: 0 },
};

export default services;
