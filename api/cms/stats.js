import { readGeneratedJson, seededCompetitors, sendJson } from "../_shared.js";

export default async function handler(_req, res) {
  const sourceStatus = readGeneratedJson("cmsDataSourceStatus.json", {});
  const competitors = await seededCompetitors();
  sendJson(res, 200, {
    success: true,
    datasetsDiscovered: Object.keys(sourceStatus.sources || {}).length,
    maineHospiceProviders: readGeneratedJson("maineHospiceProviders.json").length,
    maineHHAgencies: readGeneratedJson("maineHomeHealthAgencies.json").length,
    competitorMatches: competitors.length,
    needsReview: 0,
    lastSync: { t: sourceStatus.generated_at },
    datasetList: Object.values(sourceStatus.sources || {}),
    message: "Loaded from bundled CMS/HRSA seed data.",
  });
}
