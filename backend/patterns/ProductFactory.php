<?php
// ===============================================
// FACTORY PATTERN - Creating product objects
// Admin just says the category; the factory creates
// the correct type of product with its default unit.
// ===============================================

abstract class Product {
    public $name;
    public $category;
    public $price;
    public $stock;
    public $unit;
    public $image_url;
    public $description;
    public $farmer_id;

    public function __construct($data) {
        $this->name = trim($data['name'] ?? '');
        $this->price = (float) ($data['price'] ?? 0);
        $this->stock = (int) ($data['stock'] ?? 0);
        $this->image_url = $data['image_url'] ?? '';
        $this->description = $data['description'] ?? '';
        $this->farmer_id = !empty($data['farmer_id']) ? (int) $data['farmer_id'] : null;
        $this->unit = !empty($data['unit']) ? $data['unit'] : $this->defaultUnit();
    }

    abstract public function defaultUnit();
}

class Vegetable extends Product {
    public $category = 'Vegetable';
    public function defaultUnit() { return 'kg'; }
}

class Fruit extends Product {
    public $category = 'Fruit';
    public function defaultUnit() { return 'kg'; }
}

class Grain extends Product {
    public $category = 'Grain';
    public function defaultUnit() { return 'kg'; }
}

class Dairy extends Product {
    public $category = 'Dairy';
    public function defaultUnit() { return 'litre'; }
}

class ProductFactory {
    public static function createProduct($category, $data) {
        switch ($category) {
            case 'Vegetable': return new Vegetable($data);
            case 'Fruit': return new Fruit($data);
            case 'Grain': return new Grain($data);
            case 'Dairy': return new Dairy($data);
            default: throw new Exception('Invalid category: ' . $category);
        }
    }
}
