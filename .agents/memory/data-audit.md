---
name: Data audit findings
description: Accuracy, freshness, math correctness, and hardcoded data issues.
---

## Key findings

### Data freshness
- CMS data is from the **2022 Medicare Public Use File (PUF)**, not 2024. CMS releases lag 18-24 months.
- Model was generated in June 2026 from the latest available CMS releases.
- Disclosure added to `cmsMeta.js` and `DataSourceBanner.jsx` so users see the 2022 source year.

### Missing counties
- 4 of 16 Maine counties are missing from CMS data: **Androscoggin, Hancock, Piscataquis, Waldo**.
- Androscoggin is Andwell's home county — missing from CMS dataset is notable.
- Coverage line added to data disclosure banner.

### Critical bugs fixed

1. **Sensitivity analysis contribution bug** (`calculations.js` lines 480-498):
   - When overriding reimbursement rates, revenue was updated but `contributions` and `totalContribution` were NOT recalculated.
   - Fixed: now recalculates both `revenue` and `contributions` arrays, plus `totalContribution`.

2. **Hospice showing $0 revenue** (`services.js` line 9):
   - Hospice had `reimbursement: 0, margin: 0, demandRate: 0`, making all projections zero.
   - Fixed: set to `reimbursement: 14723` (CMS 2022 PPU average), `margin: 0.22`, `demandRate: 0.06`.
   - Added `disclaimer` field for transparency.

3. **Market penetration denominator inflated** (`calculations.js` line 373):
   - `totalMarket = hh.users + hos.users` for every county, even if only Home Health was modeled.
   - Fixed: now checks `hasHomeHealth` and `hasHospice` to include only relevant users in denominator.

### Hardcoded values that remain (acceptable but should be reviewed annually)
- Reimbursement rates: HH $3,189, Wound $1,800, Therapy $1,650 (2024/2025 proxies)
- Staffing salaries: RN/LPN $78k, Wound $85k, Therapy $82k
- Mobile Wound demand proxy: `hh.users * 0.2`
- Therapy Care demand proxy: `hh.users * 0.4`

### Verified correct
- Revenue = starts × reimbursement ✓
- Referrals = starts / conversionRate (ceil) ✓
- Margin = revenue × margin ✓
- Opportunity weights sum to 1.0 ✓
- Smart scenario weights sum to 1.0 ✓
- Provider volume shares sum to 1.0 ✓
