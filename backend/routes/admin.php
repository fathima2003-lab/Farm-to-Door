<?php
// ===============================================
// ADMIN ROUTES  ->  /admin   (dashboard + customers)
// ===============================================
requireAdmin();

// GET /admin/stats -> numbers for the dashboard cards
if ($method === 'GET' && $id === 'stats') {
    sendJson([
        'customers' => fetchOne("SELECT COUNT(*) AS c FROM users WHERE role = 'customer'")['c'],
        'products' => fetchOne('SELECT COUNT(*) AS c FROM products')['c'],
        'farmers' => fetchOne('SELECT COUNT(*) AS c FROM farmers')['c'],
        'drivers' => fetchOne('SELECT COUNT(*) AS c FROM drivers')['c'],
        'orders' => fetchOne('SELECT COUNT(*) AS c FROM orders')['c'],
        'pendingOrders' => fetchOne("SELECT COUNT(*) AS c FROM orders WHERE status = 'Pending'")['c'],
        'revenue' => fetchOne("SELECT IFNULL(SUM(total), 0) AS t FROM orders WHERE status = 'Delivered'")['t'],
        'lowStock' => fetchAll('SELECT id, name, stock, unit FROM products WHERE stock < 20 ORDER BY stock ASC')
    ]);
}

// GET /admin/customers -> list of registered customers
if ($method === 'GET' && $id === 'customers') {
    sendJson(fetchAll(
        "SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at, COUNT(o.id) AS order_count
         FROM users u LEFT JOIN orders o ON o.customer_id = u.id
         WHERE u.role = 'customer' GROUP BY u.id ORDER BY u.id DESC"
    ));
}
