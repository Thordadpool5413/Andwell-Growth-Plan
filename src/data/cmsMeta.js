const cmsMeta = {
  "datasetYear": 2022,
  "disclosure": "All CMS data is from the 2022 Medicare Public Use File (PUF). CMS typically releases PUF data 18-24 months after the reporting period. This model was generated in June 2026 using the latest available CMS releases.",
  "fetchedAt": "2026-05-29T00:00:00.000Z",
  "modelDate": "May 2026",
  "sources": {
    "geoVar": {
      "datasetId": "6219697b-8f6c-4164-bed4-cd9317c58ebc",
      "description": "Medicare Geographic Variation by National, State & County (2022)",
      "rows": 12
    },
    "hhaPac": {
      "datasetId": "43ef03ce-2b60-40a8-958e-146195b5fec7",
      "description": "Medicare Post-Acute Care Utilization – Home Health Agency (2022)",
      "rows": 20
    },
    "hospicePac": {
      "datasetId": "4e73f1b5-82cb-4682-8ad2-28493f0b6840",
      "description": "Medicare Post-Acute Care Utilization – Hospice (2022)",
      "rows": 16
    }
  },
  "coverage": {
    "counties": [
      "Aroostook", "Cumberland", "Franklin", "Kennebec",
      "Knox", "Lincoln", "Oxford", "Penobscot",
      "Sagadahoc", "Somerset", "Washington", "York"
    ],
    "missingCounties": [
      "Androscoggin", "Hancock", "Piscataquis", "Waldo"
    ],
    "hhProviders": 20,
    "hospiceProviders": 16
  },
  "warnings": 1,
  "note": "4 Maine counties (Androscoggin, Hancock, Piscataquis, Waldo) are not yet in the CMS dataset. Run 'node scripts/refresh-cms-data.js' to refresh from live CMS data."
};

export default cmsMeta;
