import { sendJson } from "../_shared.js";

export default function handler(_req, res) {
  sendJson(res, 200, {
    success: true,
    quality_measures: [],
    message: "Bundled CMS seed data is loaded. Live CMS tool calls are available in the Express server runtime.",
  });
}
