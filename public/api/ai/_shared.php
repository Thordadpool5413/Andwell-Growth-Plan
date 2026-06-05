<?php
declare(strict_types=1);

const ANDWELL_TOKEN_TTL_MS = 14400000;
const ANDWELL_MAX_MESSAGES = 10;
const ANDWELL_MAX_CONTENT_LEN = 32000;

function andwell_json_response(int $status, array $body): void
{
    http_response_code($status);
    header("Content-Type: application/json; charset=utf-8");
    header("Cache-Control: no-store, no-cache, must-revalidate");
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

function andwell_text_response(int $status, string $body): void
{
    http_response_code($status);
    header("Content-Type: text/plain; charset=utf-8");
    header("Cache-Control: no-store, no-cache, must-revalidate");
    echo $body;
    exit;
}

function andwell_read_json_body(): array
{
    $raw = file_get_contents("php://input");
    if ($raw === false || trim($raw) === "") {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        throw new RuntimeException("Invalid JSON request body.");
    }

    return $decoded;
}

function andwell_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), "+/", "-_"), "=");
}

function andwell_base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat("=", 4 - $padding);
    }
    return (string) base64_decode(strtr($value, "-_", "+/"), true);
}

function andwell_env_candidates(): array
{
    return [
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . ".env",
        dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . ".env",
    ];
}

function andwell_file_env(): array
{
    static $cached = null;

    if ($cached !== null) {
        return $cached;
    }

    $cached = [];
    foreach (andwell_env_candidates() as $candidate) {
        if (!is_file($candidate)) {
            continue;
        }

        $lines = @file($candidate, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if (!is_array($lines)) {
            continue;
        }

        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed === "" || str_starts_with($trimmed, "#") || !str_contains($trimmed, "=")) {
                continue;
            }

            [$key, $value] = explode("=", $trimmed, 2);
            $key = trim($key);
            $value = trim($value);
            if ($key === "") {
                continue;
            }

            if ((str_starts_with($value, '"') && str_ends_with($value, '"')) || (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                $value = substr($value, 1, -1);
            }

            $cached[$key] = $value;
        }

        if (!empty($cached)) {
            break;
        }
    }

    return $cached;
}

function andwell_env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    if ($value !== false && $value !== "") {
        return $value;
    }

    if (isset($_SERVER[$key]) && $_SERVER[$key] !== "") {
        return (string) $_SERVER[$key];
    }

    if (isset($_ENV[$key]) && $_ENV[$key] !== "") {
        return (string) $_ENV[$key];
    }

    $fileEnv = andwell_file_env();
    if (isset($fileEnv[$key]) && $fileEnv[$key] !== "") {
        return (string) $fileEnv[$key];
    }

    return $default;
}

function andwell_token_secret(): string
{
    return andwell_env("AI_SESSION_SECRET")
        ?? andwell_env("OPENAI_API_KEY")
        ?? andwell_env("openai_api_key")
        ?? "andwell-local-session";
}

function andwell_issue_token(): string
{
    $payload = andwell_base64url_encode(json_encode([
        "iat" => (int) round(microtime(true) * 1000),
        "nonce" => bin2hex(random_bytes(12)),
    ], JSON_UNESCAPED_SLASHES));

    $signature = hash_hmac("sha256", $payload, andwell_token_secret());
    return $payload . "." . $signature;
}

function andwell_verify_token(string $token): bool
{
    if ($token === "" || !str_contains($token, ".")) {
        return false;
    }

    [$payload, $signature] = explode(".", $token, 2);
    if ($payload === "" || $signature === "") {
        return false;
    }

    $expected = hash_hmac("sha256", $payload, andwell_token_secret());
    if (!hash_equals($expected, $signature)) {
        return false;
    }

    $decoded = json_decode(andwell_base64url_decode($payload), true);
    if (!is_array($decoded) || !isset($decoded["iat"])) {
        return false;
    }

    return ((int) round(microtime(true) * 1000) - (int) $decoded["iat"]) <= ANDWELL_TOKEN_TTL_MS;
}

function andwell_validate_messages($messages): ?string
{
    if (!is_array($messages) || count($messages) === 0) {
        return "messages must be a non-empty array";
    }

    if (count($messages) > ANDWELL_MAX_MESSAGES) {
        return "too many messages (max " . ANDWELL_MAX_MESSAGES . ")";
    }

    foreach ($messages as $message) {
        if (!is_array($message)) {
            return "each message must be an object";
        }

        $role = $message["role"] ?? "";
        $content = $message["content"] ?? null;
        if (!in_array($role, ["system", "user", "assistant"], true)) {
            return "invalid role: " . $role;
        }
        if (!is_string($content)) {
            return "message content must be a string";
        }
        if (strlen($content) > ANDWELL_MAX_CONTENT_LEN) {
            return "message content too long (max " . ANDWELL_MAX_CONTENT_LEN . " chars)";
        }
    }

    return null;
}

function andwell_openai_config(): array
{
    return [
        "api_key" => andwell_env("OPENAI_API_KEY") ?? andwell_env("openai_api_key"),
        "base_url" => rtrim(andwell_env("OPENAI_BASE_URL", "https://api.openai.com/v1"), "/"),
        "model" => andwell_env("OPENAI_MODEL", "gpt-4o-mini"),
    ];
}

function andwell_openai_chat(array $messages, int $maxTokens, array $extra = []): array
{
    $config = andwell_openai_config();
    if (empty($config["api_key"])) {
        return [
            "ok" => false,
            "status" => 503,
            "error" => "AI not configured — set OPENAI_API_KEY or openai_api_key in the Hostinger environment or .env file.",
        ];
    }

    if (!function_exists("curl_init")) {
        return [
            "ok" => false,
            "status" => 503,
            "error" => "PHP cURL is unavailable in this hosting environment.",
        ];
    }

    $payload = array_merge([
        "model" => $config["model"],
        "messages" => $messages,
        "max_tokens" => max(50, min($maxTokens, 1500)),
        "stream" => false,
    ], $extra);

    $curl = curl_init($config["base_url"] . "/chat/completions");
    if ($curl === false) {
        return [
            "ok" => false,
            "status" => 500,
            "error" => "Could not initialize cURL.",
        ];
    }

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 90,
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer " . $config["api_key"],
        ],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_SLASHES),
    ]);

    $body = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $curlError = curl_error($curl);
    curl_close($curl);

    if ($body === false) {
        return [
            "ok" => false,
            "status" => 502,
            "error" => $curlError !== "" ? $curlError : "OpenAI request failed.",
        ];
    }

    $json = json_decode($body, true);
    if ($status < 200 || $status >= 300) {
        $errorText = is_array($json) ? json_encode($json, JSON_UNESCAPED_SLASHES) : (string) $body;
        return [
            "ok" => false,
            "status" => $status > 0 ? $status : 502,
            "error" => "Upstream AI error: " . substr($errorText, 0, 240),
        ];
    }

    return [
        "ok" => true,
        "status" => $status,
        "json" => is_array($json) ? $json : [],
        "model" => $config["model"],
    ];
}

function andwell_extract_message_text(array $response): string
{
    $content = $response["choices"][0]["message"]["content"] ?? "";

    if (is_string($content)) {
        return $content;
    }

    if (is_array($content)) {
        $parts = [];
        foreach ($content as $item) {
            if (is_array($item) && isset($item["text"]) && is_string($item["text"])) {
                $parts[] = $item["text"];
            }
        }
        return trim(implode("", $parts));
    }

    return "";
}

function andwell_stream_text_sse(string $text): void
{
    http_response_code(200);
    header("Content-Type: text/event-stream; charset=utf-8");
    header("Cache-Control: no-cache, no-transform");
    header("Connection: keep-alive");
    header("X-Accel-Buffering: no");

    while (ob_get_level() > 0) {
        ob_end_flush();
    }

    $chunks = preg_split("/(?<=\\G.{180})/us", $text, -1, PREG_SPLIT_NO_EMPTY);
    if (!is_array($chunks) || empty($chunks)) {
        $chunks = [""];
    }

    foreach ($chunks as $chunk) {
        echo "data: " . json_encode([
            "choices" => [
                [
                    "delta" => [
                        "content" => $chunk,
                    ],
                ],
            ],
        ], JSON_UNESCAPED_SLASHES) . "\n\n";
        flush();
    }

    echo "data: [DONE]\n\n";
    flush();
    exit;
}
