<?php
// ===============================================
// AUTH ROUTES  ->  /auth
// Register (customers only) and Login (customer + admin)
// ===============================================

// POST /auth/register  -> new customer account
if ($method === 'POST' && $id === 'register') {
    $body = getBody();
    $name = trim($body['name'] ?? '');
    $email = trim($body['email'] ?? '');
    $password = $body['password'] ?? '';

    if ($name === '' || $email === '' || $password === '') {
        sendJson(['message' => 'Name, email and password are required'], 400);
    }
    if (strlen($password) < 6) {
        sendJson(['message' => 'Password must be at least 6 characters'], 400);
    }

    // check if email already used
    if (fetchOne('SELECT id FROM users WHERE email = ?', [$email])) {
        sendJson(['message' => 'Email is already registered'], 400);
    }

    // never store plain passwords -> hash it
    $hashed = password_hash($password, PASSWORD_DEFAULT);

    runQuery(
        "INSERT INTO users (name, email, password, phone, address, role) VALUES (?, ?, ?, ?, ?, 'customer')",
        [$name, $email, $hashed, $body['phone'] ?? '', $body['address'] ?? '']
    );
    sendJson(['message' => 'Registration successful! Please login.'], 201);
}

// POST /auth/login  -> customer OR admin
if ($method === 'POST' && $id === 'login') {
    $body = getBody();
    $user = fetchOne('SELECT * FROM users WHERE email = ?', [$body['email'] ?? '']);

    if (!$user || !password_verify($body['password'] ?? '', $user['password'])) {
        sendJson(['message' => 'Invalid email or password'], 400);
    }

    unset($user['password']); // never send the password back
    sendJson([
        'message' => 'Login successful',
        'token' => createToken($user),
        'user' => $user
    ]);
}

// GET /auth/me  -> logged-in user's details
if ($method === 'GET' && $id === 'me') {
    $me = requireLogin();
    sendJson(fetchOne('SELECT id, name, email, phone, address, role FROM users WHERE id = ?', [$me['id']]));
}
