<?php
// ===============================================
// Database connection (MySQL using PDO)
// XAMPP default: user "root", no password
// ===============================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'farm_to_door');
define('DB_USER', 'root');
define('DB_PASS', '');

// Secret key used to sign login tokens (JWT)
define('JWT_SECRET', 'farm_to_door_secret_key');

try {
    $db = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,       // show errors as exceptions
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,  // rows as ['column' => value]
            PDO::ATTR_EMULATE_PREPARES => false                // numbers come back as numbers
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed. Is MySQL running and the SQL file imported?']);
    exit;
}
