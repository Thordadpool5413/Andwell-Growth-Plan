import { issueToken, sendJson } from "../_shared.js";

export default function handler(_req, res) {
  sendJson(res, 200, { token: issueToken() });
}
