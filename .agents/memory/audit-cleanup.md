---
name: App audit and cleanup
description: Comprehensive audit of dead code, unused exports, server console logs, and data export stubs.
---

## Completed fixes

### Dead code removal
- Deleted `src/views/ComparisonView.jsx` (193 lines, never imported)
- Deleted `src/views/ServiceLines.jsx` (138 lines, never imported)
- Deleted `src/views/SensitivityAnalysisEnhanced.jsx` (182 lines, never imported)
- `CompetitorGrid.jsx` is kept — used inside `CompetitiveView.jsx`

### ExportButton fixed
- Rewrote from a single "Export PDF" (which only opened a print window) to a split button:
  - Left: Print (opens print window with styled CSS)
  - Right: Dropdown chevron with CSV export
  - CSV export uses `exportToCSV` from `dataExport.js` with flat row mapping
  - `exportToPDF` simplified to `window.print()`
  - `exportToJSON` remains available but unused — can be added to dropdown later

### Server.js console logs
- Wrapped all `console.log`, `console.warn`, `console.error` in `if (isDev)` checks
- `isDev = process.env.NODE_ENV !== "production"` — already existed at top of file
- Keeps logs visible in development, suppresses them in production

### Code splitting (lazy loading)
- Added `TabSkeleton.jsx` loading state component
- 6 heaviest views converted to `React.lazy()` imports:
  - FinancialModel, StaffingModel, SensitivityAnalysis, OpportunityScore, LaunchTimeline, BoardReport, LaunchChecklist
- `Suspense` wrapper around the tab content area with `TabSkeleton` fallback
- Build output confirms 7 separate chunks (7–17 KB each) split from main bundle
- Main bundle reduced from ~1,829 KB to ~1,786 KB

## Why
- Dead code inflates bundle size and creates confusion for future development
- A button labeled "Export" that only prints is misleading UX
- Server console logs leak into production and create noise in log aggregation
- Code splitting improves initial page load and perceived performance

## How to apply
- Always grep for references before deleting a view file
- Use `React.lazy(() => import("./path"))` + `Suspense` for views > 10 KB
- Wrap server console logs with `if (isDev)` when `isDev` is already in scope
