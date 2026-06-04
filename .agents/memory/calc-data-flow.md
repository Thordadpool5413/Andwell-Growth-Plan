---
name: Calculation data flow architecture
description: How the buildRows → getCountyMath pipeline works and what views can rely on.
---

## Rule
`buildRows(scenario)` → `getCountyMath(row, scenario)` is the single computation path. Every view receives `rows` (and optionally `totals`) as props from App.jsx.

## Why
Row objects are "golden rows" — fully decorated with market, meta, starts, referrals, revenue, contributions, totalStarts, totalReferrals, totalRevenue, totalContribution. Views are read-only consumers; they must not re-derive values that already exist on the row.

## How to apply
- `row.starts[i]`, `row.referrals[i]`, `row.revenue[i]`, `row.contributions[i]` — per year
- `row.totalStarts`, `row.totalReferrals`, `row.totalRevenue`, `row.totalContribution` — 3-year sums
- `row.demandPool`, `row.reimbursement`, `row.meta.margin`, `row.basis`, `row.market` — supporting fields
- CMS county keys in `cmsCountyMarket` must match `launchPlan` county names exactly (case-sensitive).
