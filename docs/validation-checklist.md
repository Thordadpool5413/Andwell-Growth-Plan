# Andwell Dashboard Validation Checklist

Use this checklist for release validation after dashboard data, AI, map, and UI changes.

- [x] App builds successfully with `npm run build`.
- [x] App runs locally with `npm run dev` on port 5000.
- [x] AI assistant obtains a session token from `/api/ai/token`.
- [x] AI assistant answers through `/api/ai/chat` using dashboard context.
- [x] CMS data loads on page load from bundled seed data.
- [x] HRSA data loads on page load from bundled seed data.
- [x] Home health data loads on page load.
- [x] Hospice data loads on page load.
- [x] HHCAHPS data loads on page load.
- [x] HHVBP data loads on page load.
- [x] Hospice CAHPS data loads on page load.
- [x] Competitive View is populated from provider-file and seeded competitor data.
- [x] Competitor Velocity Index has seeded competitor records available.
- [x] Top Home Healthcare providers are populated.
- [x] Provider file share is populated and labeled as provider file share, not true market share.
- [x] County-level Medicare market data is populated.
- [x] Live quality benchmarks are populated from bundled CMS Provider Data seeds.
- [x] CMS Data section no longer depends on user sync.
- [x] Maine county map shows all 16 counties.
- [x] Each county is clickable.
- [x] County map selection updates the detail panel.
- [x] County map selection updates the County Launch Queue selection.
- [x] County Launch Queue selection updates the map.
- [x] County selection updates AI assistant context.
- [x] Priority colors match the legend.
- [x] York County can be selected and visually identified.
- [x] Header does not move downward during scroll.
- [x] Header does not fall into the site.
- [x] Navigation does not overlap content during scroll.
- [x] No user-facing sync is required.
- [x] No JSON parse errors appear in repaired CMS/AI flows.
- [x] No console errors remain in smoke testing.
- [x] No TypeScript errors are applicable; this app is JavaScript-only.
- [x] No runtime errors remain in smoke testing.
- [x] No build errors remain.
- [x] No secrets are exposed in frontend code.
- [x] Financial, referral, CMS assumption, and prioritization formulas were not intentionally changed.

Admin refresh command:

- `npm run refresh:cms-data` regenerates bundled CMS, HRSA, and Census county boundary seed files.
