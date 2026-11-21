<?php
// ===============================================
// Helper functions used by all routes
// ===============================================

// Send a JSON response and stop the script
function sendJson($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

// Read the JSON body sent by the frontend (fetch)
function getBody() {
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

// Run a SQL query safely with ? placeholders (prevents SQL injection)
function runQuery($sql, $params = []) {
    global $db;
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

// Get all rows
function fetchAll($sql, $params = []) {
    return runQuery($sql, $params)->fetchAll();
}

// Get one row (or false if not found)
function fetchOne($sql, $params = []) {
    return runQuery($sql, $params)->fetch();
}

// ===============================================
// JWT (JSON Web Token) - login token
// token = header.payload.signature
// ===============================================
function base64UrlEncode($text) {
    return rtrim(strtr(base64_encode($text), '+/', '-_'), '=');
}

function base64UrlDecode($text) {
    return base64_decode(strtr($text, '-_', '+/'));
}

function createToken($user) {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64UrlEncode(json_encode([
        'id' => $user['id'],
        'name' => $user['name'],
        'role' => $user['role'],
        'exp' => time() + 86400   // valid for 1 day
    ]));
    $signature = base64UrlEncode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));
    return "$header.$payload.$signature";
}

function verifyToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    [$header, $payload, $signature] = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "$header.$payload", JWT_SECRET, true));

    if (!hash_equals($expected, $signature)) return null;      // token was changed
    $data = json_decode(base64UrlDecode($payload), true);
    if (!$data || $data['exp'] < time()) return null;          // token expired
    return $data;
}

// ===============================================
// Login checks (like middleware)
// ===============================================
function getAuthHeader() {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) return $_SERVER['HTTP_AUTHORIZATION'];
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    if (function_exists('apache_request_headers')) {
        foreach (apache_request_headers() as $key => $value) {
            if (strtolower($key) === 'authorization') return $value;
        }
    }
    return '';
}

// Any logged-in user
function requireLogin() {
    $header = getAuthHeader();
    if (strpos($header, 'Bearer ') !== 0) {
        sendJson(['message' => 'Please login first'], 401);
    }
    $user = verifyToken(substr($header, 7));
    if (!$user) {
        sendJson(['message' => 'Session expired. Please login again'], 401);
    }
    return $user;
}

// Only admin
function requireAdmin() {
    $user = requireLogin();
    if ($user['role'] !== 'admin') sendJson(['message' => 'Admin access only'], 403);
    return $user;
}

// Only customer
function requireCustomer() {
    $user = requireLogin();
    if ($user['role'] !== 'customer') sendJson(['message' => 'Customer access only'], 403);
    return $user;
}
