import { readGeneratedJson, rowsPayload, sendJson } from "../_shared.js";

export default function handler(_req, res) {
  const rows = readGeneratedJson("maineHhvbp.json");
  const scored = rows.map((row) => row.total_performance_score).filter((value) => value != null);
  const avg = scored.length ? scored.reduce((sum, value) => sum + Number(value), 0) / scored.length : null;
  sendJson(res, 200, rowsPayload(rows, "Loaded from bundled CMS HHVBP seed data.", {
    state_avg_tps: avg != null ? Number(avg.toFixed(2)) : null,
    national_avg_tps: null,
  }));
}
