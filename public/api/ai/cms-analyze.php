<?php
declare(strict_types=1);

require __DIR__ . "/_shared.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    andwell_json_response(405, ["success" => false, "error" => "Method not allowed"]);
}

$token = $_SERVER["HTTP_X_AI_TOKEN"] ?? "";
if (!andwell_verify_token($token)) {
    andwell_json_response(401, ["success" => false, "error" => "Unauthorized: obtain a token from /api/ai/token first"]);
}

try {
    $body = andwell_read_json_body();
} catch (RuntimeException $err) {
    andwell_json_response(400, ["success" => false, "error" => $err->getMessage()]);
}

$question = trim((string) ($body["question"] ?? ""));
if ($question === "" || strlen($question) > 2000) {
    andwell_json_response(400, ["success" => false, "error" => "question must be a non-empty string under 2000 chars"]);
}

$messages = [
    [
        "role" => "system",
        "content" => "You are a competitive intelligence analyst for Andwell, a Maine home health and hospice provider. The Hostinger publish target exposes AI but not the local Node-based CMS toolchain, so answer carefully, keep the response concise, and say clearly when live CMS tool verification is unavailable in the published environment.",
    ],
    [
        "role" => "user",
        "content" => $question,
    ],
];

$result = andwell_openai_chat($messages, 1000);
if (!$result["ok"]) {
    andwell_json_response((int) $result["status"], ["success" => false, "error" => $result["error"]]);
}

andwell_json_response(200, [
    "answer" => andwell_extract_message_text($result["json"]),
    "tool_calls_made" => 0,
    "model" => $result["json"]["model"] ?? andwell_openai_config()["model"],
]);
