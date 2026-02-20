<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Testing connection to Next.js...\n";
$start = microtime(true);

$ch = curl_init("http://127.0.0.1:3000/");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 5);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$duration = microtime(true) - $start;

curl_close($ch);

echo "Time: " . number_format($duration, 4) . "s\n";
echo "HTTP Code: $http_code\n";
if ($response === false) {
    echo "Curl Error: $error\n";
} else {
    echo "Response Length: " . strlen($response) . "\n";
    echo "Preview: " . substr($response, 0, 100) . "...\n";
}
?>