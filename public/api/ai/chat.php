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

$messages = $body["messages"] ?? null;
$validationError = andwell_validate_messages($messages);
if ($validationError !== null) {
    andwell_json_response(400, ["success" => false, "error" => $validationError]);
}

$maxTokens = (int) ($body["max_tokens"] ?? 700);
$result = andwell_openai_chat($messages, $maxTokens);
if (!$result["ok"]) {
    andwell_json_response((int) $result["status"], ["success" => false, "error" => $result["error"]]);
}

$text = andwell_extract_message_text($result["json"]);
andwell_stream_text_sse($text);
