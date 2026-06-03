import { seededCompetitors, sendJson } from "../_shared.js";

export default async function handler(_req, res) {
  const competitors = await seededCompetitors();
  sendJson(res, 200, { success: true, data: competitors, competitors, count: competitors.length, message: "Loaded seeded competitor records." });
}
