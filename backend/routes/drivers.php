<?php
// ===============================================
// DRIVER ROUTES  ->  /drivers   (admin only)
// Drivers do NOT login. Admin manages their records.
// ===============================================
requireAdmin();

// GET all drivers
if ($method === 'GET') {
    sendJson(fetchAll('SELECT * FROM drivers ORDER BY id DESC'));
}

$body = getBody();

// ADD driver
if ($method === 'POST') {
    if (empty($body['name'])) sendJson(['message' => 'Driver name is required'], 400);
    runQuery('INSERT INTO drivers (name, phone, vehicle_type, vehicle_no) VALUES (?, ?, ?, ?)',
        [$body['name'], $body['phone'] ?? '', $body['vehicle_type'] ?? '', $body['vehicle_no'] ?? '']);
    sendJson(['message' => 'Driver added'], 201);
}

// UPDATE driver
if ($method === 'PUT') {
    runQuery('UPDATE drivers SET name=?, phone=?, vehicle_type=?, vehicle_no=?, is_available=? WHERE id=?',
        [$body['name'] ?? '', $body['phone'] ?? '', $body['vehicle_type'] ?? '', $body['vehicle_no'] ?? '',
         !empty($body['is_available']) ? 1 : 0, $id]);
    sendJson(['message' => 'Driver updated']);
}

// DELETE driver
if ($method === 'DELETE') {
    runQuery('DELETE FROM drivers WHERE id = ?', [$id]);
    sendJson(['message' => 'Driver deleted']);
}
