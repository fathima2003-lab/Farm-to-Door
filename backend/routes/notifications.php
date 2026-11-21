<?php
// ===============================================
// NOTIFICATION ROUTES  ->  /notifications
// Shows messages created by the Observer pattern
// ===============================================
$user = requireLogin();

// GET my notifications (latest 20)
if ($method === 'GET') {
    sendJson(fetchAll('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 20', [$user['id']]));
}

// PUT /notifications/read-all -> mark all as read
if ($method === 'PUT' && $id === 'read-all') {
    runQuery('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [$user['id']]);
    sendJson(['message' => 'All notifications marked as read']);
}
