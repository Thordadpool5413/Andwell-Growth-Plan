---
name: Contribution per-year array
description: How per-year contribution margin is stored in row objects and why views must use it.
---

## Rule
Each row produced by `getCountyMath` now carries a `contributions` array `[y1, y2, y3]` where each value is `Math.round(revenue[i] * margin)`. This is the single authoritative source for contribution by year.

## Why
`FinancialModel.jsx` previously re-derived `Math.round(row.revenue[index] * row.meta.margin)` inline. This bypassed any rounding consistency and would drift from `totalContribution` (which is `contributions.reduce`) if margin overrides were applied. Centralizing in `getCountyMath` guarantees all views produce identical numbers.

## How to apply
- When any view needs per-year contribution, use `row.contributions[i]`.
- `row.totalContribution` is already the 3-year sum of `contributions`.
- Never re-multiply `row.revenue[i] * row.meta.margin` inline in a view.
