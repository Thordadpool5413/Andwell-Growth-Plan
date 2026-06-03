# Andwell Scripts

## refresh-cms-data.js — CMS Market Data Refresh

Fetches the latest Medicare Home Health and Hospice data from the CMS Open Data API and regenerates three source files used by the dashboard.

### What it updates

| File | Content |
|------|---------|
| `src/data/cmsCountyMarket.js` | County-level FFS beneficiaries, HH users, Hospice users, payment, and utilization rate |
| `src/data/providers.js` | Maine named HHA and Hospice provider rows with beneficiary counts, payment, and volume share |
| `src/data/cmsMeta.js` | Dataset year, fetch timestamp, and record counts — drives the "Model as of" label in the app |

### Data sources (CMS Open Data — no API key required)

| Dataset | ID | Used for |
|---------|----|---------|
| Medicare Geographic Variation by National, State & County | `6219697b-8f6c-4164-bed4-cd9317c58ebc` | County FFS, HH users, Hospice users |
| Medicare Post-Acute Care Utilization – Home Health Agency | `43ef03ce-2b60-40a8-958e-146195b5fec7` | Maine HHA providers |
| Medicare Post-Acute Care Utilization – Hospice | `4e73f1b5-82cb-4682-8ad2-28493f0b6840` | Maine Hospice providers |

CMS releases updated PUF files annually, typically 12–18 months after the data year ends. For example, 2023 data becomes available in late 2024 or early 2025.

### Usage

```bash
# Auto-detect most recent year (recommended)
node scripts/refresh-cms-data.js

# Pin to a specific CMS data year
node scripts/refresh-cms-data.js --year 2022

# Dry run — fetch and log but do NOT write files
node scripts/refresh-cms-data.js --dry-run
```

### Runtime

Expect 2–5 minutes depending on network speed. The script paginates through all national HHA and Hospice providers (~10,000+ rows) to isolate Maine records, then fetches county-level geographic variation data.

### Validating the output

After the script runs, check the summary at the bottom:
- **Counties** — should cover the 12 target Maine counties
- **Warnings** — any `⚠` entries flag counties with zero FFS counts or providers that couldn't be mapped to a county (due to city name not in the mapping table)

If unmapped providers appear, add the city → county pair to `CITY_TO_COUNTY` in `scripts/refresh-cms-data.js` and re-run.

### After refreshing

1. Restart the dev server: `npm run dev`
2. Check the Data Sources banner — "Model as of" will reflect the new fetch date
3. Review key metrics in Executive View and County Plan to confirm data looks reasonable
4. Commit the updated data files

### Checking available years

The CMS Geographic Variation dataset includes multiple years. The script auto-discovers the most recent available year. To see all available years:

```bash
curl "https://data.cms.gov/data-api/v1/dataset/6219697b-8f6c-4164-bed4-cd9317c58ebc/data?filter%5BBENE_GEO_LVL%5D%5Bvalue%5D=National&filter%5BBENE_AGE_LVL%5D%5Bvalue%5D=All&size=20" | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); const j=JSON.parse(d); console.log([...new Set((j.data||j).map(r=>r.YEAR))].sort().join(', '))"
```

