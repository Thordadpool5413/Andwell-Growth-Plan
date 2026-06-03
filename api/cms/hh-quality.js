import { readGeneratedJson, rowsPayload, sendJson } from "../_shared.js";

export default function handler(_req, res) {
  sendJson(res, 200, rowsPayload(readGeneratedJson("maineHomeHealthQuality.json"), "Loaded from bundled CMS Home Health quality seed data."));
}
