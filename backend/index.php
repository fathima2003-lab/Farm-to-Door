<?php
// ===============================================
// farm-to-door  -  Backend (PHP for XAMPP)
// Every API request comes to this file.
// Example: index.php/products/5  ->  resource = products, id = 5
// ===============================================

// ---------- Allow the frontend to call this API (CORS) ----------
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json');

// Browser sends OPTIONS first to check permission -> just say OK
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/functions.php';
require_once __DIR__ . '/patterns/DeliveryFeeStrategy.php';
require_once __DIR__ . '/patterns/OrderState.php';
require_once __DIR__ . '/patterns/ProductFactory.php';
require_once __DIR__ . '/patterns/NotificationObserver.php';

// ---------- Read method and path ----------
$method = $_SERVER['REQUEST_METHOD'];                      // GET, POST, PUT, DELETE
$path = trim($_SERVER['PATH_INFO'] ?? '', '/');            // e.g. "orders/3/status"
$parts = $path === '' ? [] : explode('/', $path);

$resource = $parts[0] ?? '';   // products
$id = $parts[1] ?? null;       // 3   (or a word like "my", "login")
$action = $parts[2] ?? null;   // status

// ---------- Send request to the correct route file ----------
try {
    switch ($resource) {
        case '':
            sendJson(['message' => 'Farm-to-Door API is running']);
        case 'auth':
            require __DIR__ . '/routes/auth.php';
            break;
        case 'products':
            require __DIR__ . '/routes/products.php';
            break;
        case 'orders':
            require __DIR__ . '/routes/orders.php';
            break;
        case 'farmers':
            require __DIR__ . '/routes/farmers.php';
            break;
        case 'drivers':
            require __DIR__ . '/routes/drivers.php';
            break;
        case 'admin':
            require __DIR__ . '/routes/admin.php';
            break;
        case 'notifications':
            require __DIR__ . '/routes/notifications.php';
            break;
    }
    sendJson(['message' => 'API route not found'], 404);
} catch (Exception $e) {
    sendJson(['message' => $e->getMessage()], 400);
}
