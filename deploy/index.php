<?php
// PHP Proxy for Next.js on Hostinger Shared Hosting
// Forwards all requests to http://127.0.0.1:3000

$host = "http://127.0.0.1:3000";
$request_uri = $_SERVER['REQUEST_URI'];
$url = $host . $request_uri;

$ch = curl_init($url);

// Forward HTTP Method
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $_SERVER['REQUEST_METHOD']);

// Forward Headers
$headers = [];
$headers[] = "Host: " . $_SERVER['HTTP_HOST']; // Explicitly set Host to the public domain
foreach (getallheaders() as $key => $value) {
    if (strtolower($key) !== 'host' && strtolower($key) !== 'content-length') {
        $headers[] = "$key: $value";
    }
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Forward Body (for POST/PUT)
$input_data = file_get_contents("php://input");
if (!empty($input_data)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $input_data);
}

// Return Headers and Body
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Don't follow redirects automatically

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);

curl_close($ch);

// Output Status Code
http_response_code($http_code);

// Output Headers
$response_headers = substr($response, 0, $header_size);
$response_body = substr($response, $header_size);

foreach (explode("\r\n", $response_headers) as $header) {
    if (!empty($header) && !str_starts_with(strtolower($header), 'transfer-encoding')) {
        header($header);
    }
}

// Output Body
echo $response_body;
?>