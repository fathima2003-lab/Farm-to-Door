<?php
// ===============================================
// STRATEGY PATTERN - Delivery fee calculation
// Different ways (strategies) to calculate the fee.
// The calculator can switch strategy at runtime.
// ===============================================

interface DeliveryFeeStrategy {
    public function calculate($distanceKm);
}

// Strategy 1: same fee for every order
class FlatRateStrategy implements DeliveryFeeStrategy {
    public function calculate($distanceKm) {
        return 250; // Rs. 250
    }
}

// Strategy 2: fee depends on distance
class DistanceBasedStrategy implements DeliveryFeeStrategy {
    public function calculate($distanceKm) {
        $baseFee = 100;  // Rs. 100 starting fee
        $perKm = 10;     // Rs. 10 per km
        return $baseFee + $distanceKm * $perKm;
    }
}

// Context class - uses whichever strategy it is given
class DeliveryFeeCalculator {
    private $strategy;

    public function __construct(DeliveryFeeStrategy $strategy) {
        $this->strategy = $strategy;
    }

    public function setStrategy(DeliveryFeeStrategy $strategy) {
        $this->strategy = $strategy;
    }

    public function calculate($distanceKm) {
        return $this->strategy->calculate($distanceKm);
    }
}

// Delivery cities and their distance (km) from our collection centre
const CITY_DISTANCES = [
    'Colombo' => 5,
    'Dehiwala' => 10,
    'Nugegoda' => 12,
    'Maharagama' => 15,
    'Kaduwela' => 18,
    'Gampaha' => 25,
    'Negombo' => 35,
    'Kalutara' => 42,
    'Avissawella' => 55,
    'Ratnapura' => 100,
    'Kandy' => 115,
    'Galle' => 120
];

// Helper: pick strategy by name and calculate fee
function calculateDeliveryFee($method, $city) {
    $distance = CITY_DISTANCES[$city] ?? 0;
    $strategy = $method === 'distance' ? new DistanceBasedStrategy() : new FlatRateStrategy();
    $calculator = new DeliveryFeeCalculator($strategy);
    return ['distance' => $distance, 'fee' => $calculator->calculate($distance)];
}
