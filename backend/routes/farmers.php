<?php
// ===============================================
// FARMER ROUTES  ->  /farmers   (admin only)
// Farmers do NOT login. Admin manages their records.
// ===============================================
requireAdmin(); // all routes below are admin only

// GET all farmers (with how many products each supplies)
if ($method === 'GET') {
    sendJson(fetchAll(
        'SELECT f.*, COUNT(p.id) AS product_count
         FROM farmers f LEFT JOIN products p ON p.farmer_id = f.id
         GROUP BY f.id ORDER BY f.id DESC'
    ));
}

$body = getBody();

// ADD farmer
if ($method === 'POST') {
    if (empty($body['name'])) sendJson(['message' => 'Farmer name is required'], 400);
    runQuery('INSERT INTO farmers (name, farm_name, phone, location) VALUES (?, ?, ?, ?)',
        [$body['name'], $body['farm_name'] ?? '', $body['phone'] ?? '', $body['location'] ?? '']);
    sendJson(['message' => 'Farmer added'], 201);
}

// UPDATE farmer
if ($method === 'PUT') {
    runQuery('UPDATE farmers SET name=?, farm_name=?, phone=?, location=? WHERE id=?',
        [$body['name'] ?? '', $body['farm_name'] ?? '', $body['phone'] ?? '', $body['location'] ?? '', $id]);
    sendJson(['message' => 'Farmer updated']);
}

// DELETE farmer
if ($method === 'DELETE') {
    runQuery('DELETE FROM farmers WHERE id = ?', [$id]);
    sendJson(['message' => 'Farmer deleted']);
}
