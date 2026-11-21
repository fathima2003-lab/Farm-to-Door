-- =====================================================
-- Farm-to-Door Database
-- Import this file in phpMyAdmin (XAMPP) -> Import tab
-- =====================================================

DROP DATABASE IF EXISTS farm_to_door;
CREATE DATABASE farm_to_door;
USE farm_to_door;

-- -----------------------------------------------------
-- 1. users  (only 2 roles can login: customer, admin)
-- -----------------------------------------------------
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address VARCHAR(255),
  role ENUM('customer', 'admin') DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 2. farmers  (managed by admin - NO login)
-- -----------------------------------------------------
CREATE TABLE farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  farm_name VARCHAR(100),
  phone VARCHAR(20),
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 3. drivers  (managed by admin - NO login)
-- -----------------------------------------------------
CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  vehicle_type VARCHAR(50),
  vehicle_no VARCHAR(20),
  is_available TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- 4. products  (farm products only)
-- -----------------------------------------------------
CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category ENUM('Vegetable', 'Fruit', 'Grain', 'Dairy') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'kg',
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  description TEXT,
  farmer_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- 5. orders
-- -----------------------------------------------------
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  driver_id INT,
  phone VARCHAR(20),
  address VARCHAR(255),
  city VARCHAR(50),
  delivery_method VARCHAR(20) DEFAULT 'flat',
  subtotal DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'Cash on Delivery',
  status ENUM('Pending', 'Confirmed', 'Out for Delivery', 'Delivered', 'Cancelled') DEFAULT 'Pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- 6. order_items  (products inside an order)
-- -----------------------------------------------------
CREATE TABLE order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT,
  product_name VARCHAR(100),
  price DECIMAL(10,2),
  quantity INT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- 7. notifications  (Observer pattern saves here)
-- -----------------------------------------------------
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Login accounts (passwords are hashed with password_hash)
--   Admin    : admin@farmtodoor.lk    / admin123
--   Customer : customer@farmtodoor.lk / customer123
INSERT INTO users (name, email, password, phone, address, role) VALUES
('Admin', 'admin@farmtodoor.lk', '$2y$10$c5TpNSA1/Oy4fsjWJ1gyW.3w1CbPfUvUdXhBz7/WEEhiMHcRYdJwC', '0770000000', 'Farm-to-Door Office, Colombo', 'admin'),
('Demo Customer', 'customer@farmtodoor.lk', '$2y$10$wIiGQ93/MldZ9UIvdxqDAu/kNL3Wb4yV2GHTaN1NQVVvugK32Bg1.', '0771111111', 'No. 10, Main Street, Colombo', 'customer');

INSERT INTO farmers (name, farm_name, phone, location) VALUES
('Sunil Perera', 'Green Valley Farm', '0771234567', 'Nuwara Eliya'),
('Kamala Wijesinghe', 'Golden Paddy Fields', '0712345678', 'Polonnaruwa'),
('Nimal Fernando', 'Sunshine Fruit Garden', '0763456789', 'Kurunegala'),
('Rani Jayasuriya', 'Happy Cow Dairy', '0754567890', 'Ambewela');

INSERT INTO drivers (name, phone, vehicle_type, vehicle_no, is_available) VALUES
('Ruwan Silva', '0779876543', 'Lorry', 'WP LB-4521', 1),
('Mohamed Rizan', '0718765432', 'Van', 'WP PH-7832', 1),
('Kasun Bandara', '0767654321', 'Three-wheeler', 'WP QA-1290', 1);

INSERT INTO products (name, category, price, unit, stock, image_url, description, farmer_id) VALUES
('Fresh Carrots', 'Vegetable', 320.00, 'kg', 80, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&q=80&auto=format&fit=crop', 'Crunchy upcountry carrots harvested this week.', 1),
('Red Tomatoes', 'Vegetable', 280.00, 'kg', 60, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&q=80&auto=format&fit=crop', 'Juicy, sun-ripened tomatoes for salads and curries.', 1),
('Potatoes', 'Vegetable', 260.00, 'kg', 100, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80&auto=format&fit=crop', 'Fresh Nuwara Eliya potatoes.', 1),
('Cabbage', 'Vegetable', 180.00, 'kg', 50, 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?w=600&q=80&auto=format&fit=crop', 'Fresh green cabbage straight from the hills.', 1),
('Green Beans', 'Vegetable', 380.00, 'kg', 40, 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?w=600&q=80&auto=format&fit=crop', 'Tender green beans, hand picked.', 1),
('Bananas', 'Fruit', 220.00, 'kg', 70, 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=600&q=80&auto=format&fit=crop', 'Sweet ripe bananas from Kurunegala.', 3),
('Mangoes', 'Fruit', 450.00, 'kg', 45, 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80&auto=format&fit=crop', 'Karthakolomban mangoes, naturally ripened.', 3),
('Pineapple', 'Fruit', 350.00, 'item', 30, 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&q=80&auto=format&fit=crop', 'Sweet and juicy Kew pineapples.', 3),
('Papaya', 'Fruit', 200.00, 'kg', 35, 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe?w=600&q=80&auto=format&fit=crop', 'Red lady papaya, rich in vitamins.', 3),
('Samba Rice', 'Grain', 240.00, 'kg', 200, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&q=80&auto=format&fit=crop', 'Premium samba rice from Polonnaruwa paddy fields.', 2),
('Red Rice', 'Grain', 210.00, 'kg', 150, 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&q=80&auto=format&fit=crop', 'Healthy unpolished red rice.', 2),
('Green Gram (Mung)', 'Grain', 650.00, 'kg', 60, 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=600&q=80&auto=format&fit=crop', 'Locally grown green gram.', 2),
('Fresh Cow Milk', 'Dairy', 280.00, 'litre', 40, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80&auto=format&fit=crop', 'Pure fresh milk from Ambewela cows.', 4),
('Farm Eggs', 'Dairy', 60.00, 'item', 300, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&q=80&auto=format&fit=crop', 'Free-range farm eggs (price per egg).', 4),
('Buffalo Curd', 'Dairy', 750.00, 'item', 25, 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80&auto=format&fit=crop', 'Traditional clay pot buffalo curd.', 4);
