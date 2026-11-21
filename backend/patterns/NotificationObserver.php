<?php
// ===============================================
// OBSERVER PATTERN - Customer notifications
// The "subject" (NotificationService) keeps a list of
// observers. When an event happens it tells them all.
// Events: order status changed, new stock added.
// ===============================================

interface Observer {
    public function update($userId, $message);
}

// Subject
class NotificationService {
    private $observers = [];

    public function subscribe(Observer $observer) {
        $this->observers[] = $observer;
    }

    public function notify($userId, $message) {
        foreach ($this->observers as $observer) {
            $observer->update($userId, $message);
        }
    }
}

// Observer 1: saves the notification in the database
class DatabaseNotifier implements Observer {
    public function update($userId, $message) {
        if ($userId === 'ALL') {
            // send to every customer
            runQuery("INSERT INTO notifications (user_id, message) SELECT id, ? FROM users WHERE role = 'customer'", [$message]);
        } else {
            runQuery('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [$userId, $message]);
        }
    }
}

// Observer 2: writes the notification to the PHP error log (xampp/apache/logs/error.log)
class LogNotifier implements Observer {
    public function update($userId, $message) {
        error_log("[Notification] to $userId: $message");
    }
}

// One shared service for the whole app
$notificationService = new NotificationService();
$notificationService->subscribe(new DatabaseNotifier());
$notificationService->subscribe(new LogNotifier());
