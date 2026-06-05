<?php
declare(strict_types=1);

require __DIR__ . "/_shared.php";

if ($_SERVER["REQUEST_METHOD"] !== "GET") {
    andwell_json_response(405, ["success" => false, "error" => "Method not allowed"]);
}

andwell_json_response(200, ["token" => andwell_issue_token()]);
