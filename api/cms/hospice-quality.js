import { readGeneratedJson, rowsPayload, sendJson } from "../_shared.js";

export default function handler(_req, res) {
  sendJson(res, 200, rowsPayload(readGeneratedJson("maineHospiceCahps.json"), "Loaded from bundled CMS Hospice CAHPS seed data."));
}
