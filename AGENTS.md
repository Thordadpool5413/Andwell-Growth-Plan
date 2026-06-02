# AGENTS.md

## Cursor Cloud specific instructions

### Product

Single **Andwell Growth Plan** app: React 19 + Vite SPA served by **Express** (`server.js`) on port **5000** (not a separate Vite-only dev server).

### Commands (see `package.json` and `README.md`)

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` → http://127.0.0.1:5000 |
| Production build | `npm run build` |
| Production run | `npm start` (after build) |
| Lint / unit tests | **Not configured** — use `npm run build` + browser smoke test |

`predev` / `prebuild` run `scripts/apply-replit-host-fix.mjs` (no-op on non-Replit hosts).

### Services

| Service | Required for |
|---------|----------------|
| **Node app** (`npm run dev`) | Everything |
| **PostgreSQL** (`DATABASE_URL`) | CMS DB routes, migrations, competitor seeds, sync/cron. **Not** required for planning tabs that use static `src/data/*` |
| **OpenAI** (`OPENAI_API_KEY` or `AI_INTEGRATIONS_OPENAI_API_KEY`) | `/api/ai/*` — returns 503 without keys |
| **Google Maps** (`GOOGLE_MAPS_API_KEY` / `VITE_GOOGLE_MAPS_API_KEY`) | County map in County Plan — placeholder if missing |

Without `DATABASE_URL`, server logs `[migrate] DATABASE_URL not set — skipping migrations` and CMS API calls return empty/401; static dashboard tabs still work.

### API / auth notes

- Session tokens: `GET /api/ai/token` with `Host: localhost:5000` (or allowed Replit hosts).
- CMS routes expect `x-ai-token` from that endpoint.
- Do **not** use `npm run preview` for full-stack testing — it does not serve Express API routes.

### Gotchas

- **Merge corruption**: `main` may ship a broken `src/views/MarketDynamicsView.jsx` (Vite parse errors). If `npm run build` fails there, restore a known-good revision (e.g. `git show d7a15ba:src/views/MarketDynamicsView.jsx`) before claiming the environment works.
- **Long-running dev**: use tmux (`andwell-dev` or similar); `npm run dev` blocks the shell.
- **CMS cron** starts by default (`CMS_SYNC_ENABLED` not `false`); harmless without DB but logs errors on CMS module load.
