<?php
// ===============================================
// STATE PATTERN - Order life cycle
// Pending -> Confirmed -> Out for Delivery -> Delivered
//    \__________\______> Cancelled
// Each state knows which states it can move to next.
// ===============================================

abstract class OrderState {
    public $name;
    public $nextStates;

    public function __construct($name, $nextStates) {
        $this->name = $name;
        $this->nextStates = $nextStates;
    }

    public function canMoveTo($newStatus) {
        return in_array($newStatus, $this->nextStates);
    }
}

class PendingState extends OrderState {
    public function __construct() { parent::__construct('Pending', ['Confirmed', 'Cancelled']); }
}

class ConfirmedState extends OrderState {
    public function __construct() { parent::__construct('Confirmed', ['Out for Delivery', 'Cancelled']); }
}

class OutForDeliveryState extends OrderState {
    public function __construct() { parent::__construct('Out for Delivery', ['Delivered']); }
}

class DeliveredState extends OrderState {
    public function __construct() { parent::__construct('Delivered', []); } // final state
}

class CancelledState extends OrderState {
    public function __construct() { parent::__construct('Cancelled', []); } // final state
}

// Returns the correct state object for a status text
function getOrderState($status) {
    switch ($status) {
        case 'Pending': return new PendingState();
        case 'Confirmed': return new ConfirmedState();
        case 'Out for Delivery': return new OutForDeliveryState();
        case 'Delivered': return new DeliveredState();
        case 'Cancelled': return new CancelledState();
        default: throw new Exception('Unknown order status: ' . $status);
    }
}
