---
name: Expert audit findings
description: Deep audit of performance, accessibility, security, error handling, and UX.
---

## Completed fixes

### Error boundaries
- Added `src/components/ErrorBoundary.jsx` with dark-mode-aware fallback UI
- Wrapped `ErrorBoundary` around `Suspense` children in `App.jsx` — catches lazy chunk load failures and component crashes

### Performance
- `App.jsx` line 191: `transition-all` → `transition-colors` on nav rail buttons (eliminates layout recalculation)
- `App.jsx` line 546: `transition-all` → `transition-[padding]` on main layout wrapper (only animates padding, not every property)
- This reduces jank during sidebar and nav animations

### Accessibility
- Added skip link (`<a href="#tab-content">`) to App.jsx — hidden by default, appears on focus, keyboard users can bypass the entire nav rail
- Added `tabIndex={-1}` to `#tab-content` div so it can receive focus programmatically
- Added `focus({ preventScroll: true })` after `scrollIntoView` in `activateView` and `handleNavigate` — screen readers now land on the new content

### Page titles
- Added `useEffect` in `App.jsx` that updates `document.title` on tab change: `"${activeTab} — Andwell Growth Plan"`

### Security
- `vite.config.js`: Removed `GOOGLE_MAPS_API_KEY` from `define` (was dead config — no code referenced it)
- Now hardcoded to empty string to prevent accidental key exposure in client bundle

### Touch targets
- `DataTable.jsx`: Pagination buttons expanded from `p-2` (32px) to `h-11 w-11` (44px) — meets WCAG minimum touch target
- Added `aria-label` to pagination buttons
- `Toast.jsx`: Close button expanded from `p-1` (28px) to `h-9 w-9` (36px) with `flex items-center justify-center` — improved touch target

## What was NOT a real issue (false positives from subagent)
- MaineMap accessibility: Already has `onKeyDown` handler for Enter/Space — works correctly
- AI streaming race conditions: Already guarded by `generating` state + `abortRef` cleanup
- ReactMarkdown XSS: Uses `react-markdown` which is safe by default; no `dangerouslySetInnerHTML` in AI output

## How to apply
- Always use `transition-[specific-property]` instead of `transition-all` for performance
- Add `tabIndex={-1}` to scroll targets when managing focus programmatically
- Use `focus({ preventScroll: true })` alongside `scrollIntoView` to prevent double-scrolling
- Remove dead `define` entries from Vite config that expose unused env vars
- Minimum touch target: 44×44px for interactive elements (WCAG 2.1 AA)
