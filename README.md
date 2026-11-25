# 🌱 Farm-to-Door: Direct-to-Consumer <br>Agricultural Supply Chain System

A web system where **customers** buy fresh farm produce online and an **admin** manages products, farmers, drivers and orders.

- Only **2 logins**: Customer and Admin
- **Farmers** and **Delivery Drivers** do NOT log in. The admin manages them.
- Payment: Cash on Delivery
- Runs on **XAMPP only** (Apache + PHP + MySQL). No Node.js or npm needed.

---

## ▶️ How to Run (XAMPP only)

### Step 1 – Start XAMPP
Open the XAMPP Control Panel and click **Start** for **Apache** and **MySQL**.

### Step 2 – Import the database
1. Go to `http://localhost/phpmyadmin`.
2. Open the **Import** tab, choose `backend/database/farm_to_door.sql`, then click **Import** (or **Go**).

### Step 3 – Open the website
http://localhost/farm-to-door/

To check the backend works, open this address. It should show the list of cities:<br>
http://localhost/farm-to-door/backend/index.php/orders/cities

---

## 🔑 Login Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@farmtodoor.lk | admin123 |
| Customer (demo) | customer@farmtodoor.lk | customer123 |

New customers can register from the Register page. Admin accounts cannot be registered.

---

## 📁 Folder Structure

```
Farm-to-Door/
├── backend/                         (Application tier: PHP)
│   ├── index.php                    Every API request comes here, then goes to the correct route
│   ├── config/db.php                MySQL connection + JWT secret key
│   ├── helpers/functions.php        sendJson, runQuery, JWT token, login checks
│   ├── routes/
│   │   ├── auth.php                 Register, Login
│   │   ├── products.php             Products (view + admin CRUD)
│   │   ├── orders.php               Place order, track, status, assign driver
│   │   ├── farmers.php              Admin manages farmers
│   │   ├── drivers.php              Admin manages drivers
│   │   ├── admin.php                Dashboard stats, customers list
│   │   └── notifications.php        Customer notifications
│   ├── patterns/                    ⭐ 4 design patterns from the proposal
│   │   ├── DeliveryFeeStrategy.php  Strategy
│   │   ├── NotificationObserver.php Observer
│   │   ├── OrderState.php           State
│   │   └── ProductFactory.php       Factory
│   └── database/farm_to_door.sql    (Data tier: tables + sample data + login accounts)
│
└── frontend/                        (Presentation tier: HTML + CSS + JavaScript)
    ├── index.html                   Home page
    ├── products.html                Shop (search + category filter)
    ├── cart.html                    Cart + checkout
    ├── orders.html                  Order tracking + notifications
    ├── login.html / register.html
    ├── admin.html                   Admin panel
    ├── css/style.css, css/admin.css
    └── js/  api.js, cart.js, products.js, cart-page.js, orders.js, auth.js, admin.js
```

## ✨ Features

**Customer**
- Register and login
- Browse, search and filter products (Vegetable / Fruit / Grain / Dairy)
- Add to cart and change quantity
- Checkout: choose a city and a delivery method (flat or distance-based)
- Track orders with a progress bar (Pending → Confirmed → Out for Delivery → Delivered)
- Cancel an order while it is still Pending
- See notifications (order updates and new products)

**Admin**
- Dashboard: total orders, pending orders, revenue, customers and low-stock products
- Products: add, edit and delete (with farmer, stock and image URL)
- Orders: change status and assign a driver
- Farmers: add, edit and delete
- Drivers: add, edit and delete, and see who is available or on delivery
- Customers: view list

---

## 🧩 Design Patterns (for viva)

| Pattern | File | What it does |
|---------|------|--------------|
| **Strategy** | `patterns/DeliveryFeeStrategy.php` | Interface `DeliveryFeeStrategy` with two strategies: `FlatRateStrategy` (Rs. 250) and `DistanceBasedStrategy` (Rs. 100 + Rs. 10/km). `DeliveryFeeCalculator` can switch strategy. |
| **Observer** | `patterns/NotificationObserver.php` | `NotificationService` (subject) has observers: `DatabaseNotifier` saves to the DB and `LogNotifier` writes to the log. Called when an order status changes or a new product is added. |
| **State** | `patterns/OrderState.php` | Each order status is a class that knows its allowed next states. Example: Pending → Delivered is **blocked**. |
| **Factory** | `patterns/ProductFactory.php` | `ProductFactory::createProduct('Fruit', $data)` returns a `Fruit` object with its default unit (kg). Dairy defaults to litre. |

---

## 🏗️ 3-Tier Architecture

```
[ Frontend (HTML/CSS/JS) ]  --fetch() JSON-->  [ Backend (PHP API) ]  --SQL-->  [ MySQL Database ]
   Presentation tier                              Application tier                 Data tier
```

### How a request works (example: admin changes an order status)
1. `admin.js` calls `apiRequest('/orders/5/status', 'PUT', { status: 'Confirmed' })`.
2. The browser sends it to `backend/index.php/orders/5/status`.
3. `index.php` splits the path into `orders`, `5` and `status`, then loads `routes/orders.php`.
4. `orders.php` calls `requireAdmin()`, then checks the **State pattern** with `canMoveTo()`.
5. It updates the database and notifies the customer through the **Observer pattern**.
6. It sends back JSON, and the page shows a toast message.

## 🔐 Security points
- Passwords are hashed with `password_hash()` and checked with `password_verify()`.
- Login returns a **JWT token** (signed with HMAC-SHA256). The frontend sends it in the `Authorization` header.
- `requireAdmin()` and `requireCustomer()` block the wrong role from using an API.
- PDO prepared statements (`?` placeholders) prevent **SQL injection**.
- Placing an order uses a **transaction**, so stock and order are saved together or not at all.

## 🌐 Main API Endpoints (base: `backend/index.php`)

| Method | Path | Who |
|--------|------|-----|
| POST | /auth/register | Public |
| POST | /auth/login | Public |
| GET | /products | Public |
| POST/PUT/DELETE | /products/{id} | Admin |
| POST | /orders | Customer |
| GET | /orders/my | Customer |
| PUT | /orders/{id}/cancel | Customer |
| GET | /orders | Admin |
| PUT | /orders/{id}/status | Admin |
| PUT | /orders/{id}/assign-driver | Admin |
| CRUD | /farmers, /drivers | Admin |
| GET | /admin/stats | Admin |
| GET | /notifications | Customer |

## 🖼️ Images
Product images need an internet connection. If an image fails to load, a colourful placeholder (`frontend/images/no-image.svg`) is shown instead. The admin can change any product image by pasting a new image URL.

**Done by:** MM Fathima Mina\
  (for OOAD & SE Module personal project)
