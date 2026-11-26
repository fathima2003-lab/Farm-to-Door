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
        return 350; // Rs. 350
    }
}

// Strategy 2: fee depends on distance
class DistanceBasedStrategy implements DeliveryFeeStrategy {
    public function calculate($distanceKm) {
        $baseFee = 200;  // Rs. 200 starting fee
        $perKm = 20;     // Rs. 20 per km
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
    'Moratuwa' => 23,
    'Gampaha' => 25,
    'Dambulla' => 33,
    'Negombo' => 35,
    'Vavuniya' => 40,
    'Kalutara' => 42,
    'Avissawella' => 55,
    'Batticaloa' => 99,
    'Ratnapura' => 100,
    'Kandy' => 115,
    'Kalmunai' => 115,
    'Ampara' => 120,
    'Galle' => 120
];

// Helper: pick strategy by name and calculate fee
function calculateDeliveryFee($method, $city) {
    $distance = CITY_DISTANCES[$city] ?? 0;
    $strategy = $method === 'distance' ? new DistanceBasedStrategy() : new FlatRateStrategy();
    $calculator = new DeliveryFeeCalculator($strategy);
    return ['distance' => $distance, 'fee' => $calculator->calculate($distance)];
}
