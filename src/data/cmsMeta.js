const cmsMeta = {
  "datasetYear": 2022,
  "fetchedAt": "2026-05-29T00:00:00.000Z",
  "modelDate": "May 2026",
  "sources": {
    "geoVar": {
      "datasetId": "6219697b-8f6c-4164-bed4-cd9317c58ebc",
      "description": "Medicare Geographic Variation by National, State & County",
      "rows": 12
    },
    "hhaPac": {
      "datasetId": "43ef03ce-2b60-40a8-958e-146195b5fec7",
      "description": "Medicare Post-Acute Care Utilization – Home Health Agency",
      "rows": 20
    },
    "hospicePac": {
      "datasetId": "4e73f1b5-82cb-4682-8ad2-28493f0b6840",
      "description": "Medicare Post-Acute Care Utilization – Hospice",
      "rows": 16
    }
  },
  "coverage": {
    "counties": [
      "Aroostook", "Cumberland", "Franklin", "Kennebec",
      "Knox", "Lincoln", "Oxford", "Penobscot",
      "Sagadahoc", "Somerset", "Washington", "York"
    ],
    "hhProviders": 20,
    "hospiceProviders": 16
  },
  "warnings": 0,
  "note": "Static seed — run 'node scripts/refresh-cms-data.js' to refresh from live CMS data"
};

export default cmsMeta;
