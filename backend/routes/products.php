<?php
// ===============================================
// PRODUCT ROUTES  ->  /products
// Everyone can view. Only admin can add/edit/delete.
// ===============================================

$productSelect = 'SELECT p.*, f.name AS farmer_name, f.location AS farmer_location
                  FROM products p LEFT JOIN farmers f ON p.farmer_id = f.id';

// GET /products?search=carrot&category=Vegetable
if ($method === 'GET' && $id === null) {
    $sql = $productSelect . ' WHERE 1 = 1';
    $params = [];

    if (!empty($_GET['search'])) {
        $sql .= ' AND p.name LIKE ?';
        $params[] = '%' . $_GET['search'] . '%';
    }
    if (!empty($_GET['category'])) {
        $sql .= ' AND p.category = ?';
        $params[] = $_GET['category'];
    }
    $sql .= ' ORDER BY p.id DESC';

    sendJson(fetchAll($sql, $params));
}

// GET /products/5
if ($method === 'GET') {
    $product = fetchOne($productSelect . ' WHERE p.id = ?', [$id]);
    if (!$product) sendJson(['message' => 'Product not found'], 404);
    sendJson($product);
}

// POST /products  (admin) -> uses FACTORY pattern
if ($method === 'POST') {
    requireAdmin();
    $body = getBody();

    if (empty($body['name']) || empty($body['price']) || empty($body['category'])) {
        sendJson(['message' => 'Name, category and price are required'], 400);
    }

    // Factory creates the right product type (Vegetable, Fruit, ...)
    $product = ProductFactory::createProduct($body['category'], $body);

    runQuery(
        'INSERT INTO products (name, category, price, unit, stock, image_url, description, farmer_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [$product->name, $product->category, $product->price, $product->unit, $product->stock,
         $product->image_url, $product->description, $product->farmer_id]
    );
    $newId = $db->lastInsertId();

    // OBSERVER pattern: tell all customers about new stock
    $notificationService->notify('ALL', "New arrival: {$product->name} is now available!");

    sendJson(['message' => 'Product added', 'id' => (int) $newId], 201);
}

// PUT /products/5  (admin)
if ($method === 'PUT') {
    requireAdmin();
    $old = fetchOne('SELECT * FROM products WHERE id = ?', [$id]);
    if (!$old) sendJson(['message' => 'Product not found'], 404);

    $body = getBody();
    $product = ProductFactory::createProduct($body['category'] ?? '', $body);

    runQuery(
        'UPDATE products SET name=?, category=?, price=?, unit=?, stock=?, image_url=?, description=?, farmer_id=?
         WHERE id = ?',
        [$product->name, $product->category, $product->price, $product->unit, $product->stock,
         $product->image_url, $product->description, $product->farmer_id, $id]
    );

    // OBSERVER: product was out of stock and now restocked
    if ($old['stock'] == 0 && $product->stock > 0) {
        $notificationService->notify('ALL', "Back in stock: {$product->name}");
    }

    sendJson(['message' => 'Product updated']);
}

// DELETE /products/5  (admin)
if ($method === 'DELETE') {
    requireAdmin();
    runQuery('DELETE FROM products WHERE id = ?', [$id]);
    sendJson(['message' => 'Product deleted']);
}
