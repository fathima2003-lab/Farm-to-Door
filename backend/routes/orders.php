<?php
// ===============================================
// ORDER ROUTES  ->  /orders
// Customer: place order, view own orders, cancel
// Admin: view all, change status, assign driver
// ===============================================

// Helper: add the items list to each order
function attachItems($orders) {
    foreach ($orders as &$order) {
        $order['items'] = fetchAll('SELECT * FROM order_items WHERE order_id = ?', [$order['id']]);
        // STATE pattern tells the frontend which status can come next
        $order['next_statuses'] = getOrderState($order['status'])->nextStates;
    }
    return $orders;
}

// Shared function: update status + side effects + notify customer
function changeStatus($order, $newStatus) {
    global $notificationService;

    runQuery('UPDATE orders SET status = ? WHERE id = ?', [$newStatus, $order['id']]);

    // Cancelled -> give stock back
    if ($newStatus === 'Cancelled') {
        $items = fetchAll('SELECT * FROM order_items WHERE order_id = ?', [$order['id']]);
        foreach ($items as $item) {
            runQuery('UPDATE products SET stock = stock + ? WHERE id = ?', [$item['quantity'], $item['product_id']]);
        }
    }

    // Order finished -> driver is free again
    if (($newStatus === 'Delivered' || $newStatus === 'Cancelled') && $order['driver_id']) {
        runQuery('UPDATE drivers SET is_available = 1 WHERE id = ?', [$order['driver_id']]);
    }

    // OBSERVER pattern: notify the customer
    $notificationService->notify($order['customer_id'], "Your order #{$order['id']} is now \"$newStatus\"");
}

// GET /orders/cities  -> delivery cities list
if ($method === 'GET' && $id === 'cities') {
    sendJson(array_keys(CITY_DISTANCES));
}

// POST /orders/delivery-fee  -> STRATEGY pattern
if ($method === 'POST' && $id === 'delivery-fee') {
    $body = getBody();
    sendJson(calculateDeliveryFee($body['method'] ?? 'flat', $body['city'] ?? ''));
}

// GET /orders/my  (customer) -> my orders
if ($method === 'GET' && $id === 'my') {
    $user = requireCustomer();
    $orders = fetchAll(
        'SELECT o.*, d.name AS driver_name, d.phone AS driver_phone, d.vehicle_no
         FROM orders o LEFT JOIN drivers d ON o.driver_id = d.id
         WHERE o.customer_id = ? ORDER BY o.id DESC',
        [$user['id']]
    );
    sendJson(attachItems($orders));
}

// POST /orders  (customer) -> place a new order
if ($method === 'POST' && $id === null) {
    $user = requireCustomer();
    $body = getBody();
    $items = $body['items'] ?? [];

    if (count($items) === 0) sendJson(['message' => 'Your cart is empty'], 400);
    if (empty($body['phone']) || empty($body['address']) || empty($body['city'])) {
        sendJson(['message' => 'Phone, address and city are required'], 400);
    }

    try {
        // TRANSACTION: either everything is saved or nothing
        $db->beginTransaction();

        $subtotal = 0;
        $orderItems = [];

        foreach ($items as $item) {
            $product = fetchOne('SELECT * FROM products WHERE id = ? FOR UPDATE', [$item['id']]);
            $qty = (int) $item['quantity'];

            if (!$product) throw new Exception('A product in your cart no longer exists');
            if ($qty < 1) throw new Exception('Invalid quantity');
            if ($product['stock'] < $qty) {
                throw new Exception("Only {$product['stock']} {$product['unit']} of {$product['name']} left");
            }

            $subtotal += $product['price'] * $qty;
            $orderItems[] = ['product' => $product, 'quantity' => $qty];
        }

        $deliveryMethod = $body['delivery_method'] ?? 'flat';
        $fee = calculateDeliveryFee($deliveryMethod, $body['city'])['fee'];
        $total = $subtotal + $fee;

        runQuery(
            'INSERT INTO orders (customer_id, phone, address, city, delivery_method, subtotal, delivery_fee, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [$user['id'], $body['phone'], $body['address'], $body['city'], $deliveryMethod, $subtotal, $fee, $total]
        );
        $orderId = (int) $db->lastInsertId();

        foreach ($orderItems as $row) {
            $p = $row['product'];
            runQuery(
                'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
                [$orderId, $p['id'], $p['name'], $p['price'], $row['quantity']]
            );
            // reduce stock
            runQuery('UPDATE products SET stock = stock - ? WHERE id = ?', [$row['quantity'], $p['id']]);
        }

        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        sendJson(['message' => $e->getMessage()], 400);
    }

    $notificationService->notify($user['id'], "Order #$orderId placed successfully. Total Rs. " . number_format($total, 2));
    sendJson(['message' => 'Order placed successfully', 'orderId' => $orderId], 201);
}

// PUT /orders/5/cancel  (customer) -> only while Pending
if ($method === 'PUT' && $action === 'cancel') {
    $user = requireCustomer();
    $order = fetchOne('SELECT * FROM orders WHERE id = ? AND customer_id = ?', [$id, $user['id']]);
    if (!$order) sendJson(['message' => 'Order not found'], 404);

    if ($order['status'] !== 'Pending') {
        sendJson(['message' => 'Only pending orders can be cancelled'], 400);
    }

    changeStatus($order, 'Cancelled');
    sendJson(['message' => 'Order cancelled']);
}

// GET /orders  (admin) -> all orders
if ($method === 'GET' && $id === null) {
    requireAdmin();
    $orders = fetchAll(
        'SELECT o.*, u.name AS customer_name, d.name AS driver_name
         FROM orders o
         JOIN users u ON o.customer_id = u.id
         LEFT JOIN drivers d ON o.driver_id = d.id
         ORDER BY o.id DESC'
    );
    sendJson(attachItems($orders));
}

// PUT /orders/5/status  (admin) -> STATE pattern
if ($method === 'PUT' && $action === 'status') {
    requireAdmin();
    $newStatus = getBody()['status'] ?? '';

    $order = fetchOne('SELECT * FROM orders WHERE id = ?', [$id]);
    if (!$order) sendJson(['message' => 'Order not found'], 404);

    $currentState = getOrderState($order['status']);
    if (!$currentState->canMoveTo($newStatus)) {
        sendJson(['message' => "Cannot change order from \"{$order['status']}\" to \"$newStatus\""], 400);
    }
    if ($newStatus === 'Out for Delivery' && !$order['driver_id']) {
        sendJson(['message' => 'Please assign a driver first'], 400);
    }

    changeStatus($order, $newStatus);
    sendJson(['message' => 'Order status updated to ' . $newStatus]);
}

// PUT /orders/5/assign-driver  (admin)
if ($method === 'PUT' && $action === 'assign-driver') {
    requireAdmin();
    $driverId = (int) (getBody()['driver_id'] ?? 0);

    $order = fetchOne('SELECT * FROM orders WHERE id = ?', [$id]);
    if (!$order) sendJson(['message' => 'Order not found'], 404);

    if ($order['status'] === 'Delivered' || $order['status'] === 'Cancelled') {
        sendJson(['message' => 'This order is already closed'], 400);
    }

    $driver = fetchOne('SELECT * FROM drivers WHERE id = ?', [$driverId]);
    if (!$driver) sendJson(['message' => 'Driver not found'], 404);
    if (!$driver['is_available'] && $order['driver_id'] != $driver['id']) {
        sendJson(['message' => 'This driver is busy with another order'], 400);
    }

    // free the old driver (if changing driver)
    if ($order['driver_id']) runQuery('UPDATE drivers SET is_available = 1 WHERE id = ?', [$order['driver_id']]);

    runQuery('UPDATE orders SET driver_id = ? WHERE id = ?', [$driverId, $order['id']]);
    runQuery('UPDATE drivers SET is_available = 0 WHERE id = ?', [$driverId]);

    $notificationService->notify(
        $order['customer_id'],
        "Driver {$driver['name']} ({$driver['phone']}) will deliver your order #{$order['id']}"
    );
    sendJson(['message' => 'Driver assigned']);
}
