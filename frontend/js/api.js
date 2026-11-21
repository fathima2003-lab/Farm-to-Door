// =================================================
// api.js  -  Shared helper functions for all pages
// =================================================

// Backend address (PHP in XAMPP)
// Works out the address from the page URL, so any folder name works.
// Example: http://localhost/farm-to-door/frontend/products.html
//      ->  http://localhost/farm-to-door/backend/index.php
let API_URL = 'http://localhost/farm-to-door/backend/index.php';
if (window.location.protocol.startsWith('http') && window.location.pathname.includes('/frontend/')) {
  const projectPath = window.location.pathname.split('/frontend/')[0];
  API_URL = window.location.origin + projectPath + '/backend/index.php';
}

// Image shown if a product image fails to load
const NO_IMAGE = 'images/no-image.svg';

// ---------- Login helpers (saved in browser localStorage) ----------
function getToken() {
  return localStorage.getItem('token');
}

function getUser() {
  return JSON.parse(localStorage.getItem('user'));
}

function saveLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// ---------- Call the backend API ----------
// Example: apiRequest('/products')  or  apiRequest('/orders', 'POST', data)
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' }
  };

  const token = getToken();
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  if (body) options.body = JSON.stringify(body);

  let response;
  try {
    response = await fetch(API_URL + endpoint, options);
  } catch (err) {
    throw new Error('Cannot connect to server. Is Apache running in XAMPP?');
  }

  // Read the reply. If it is not JSON (e.g. a PHP error page), show a clear message.
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    console.error('Server reply was not JSON:', text);
    throw new Error('Backend error - open ' + API_URL + endpoint + ' to see details');
  }

  // token expired -> logout
  if (response.status === 401 && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ---------- Small UI helpers ----------
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = (type === 'success' ? '✅ ' : '⚠️ ') + message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatPrice(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 });
}

function formatDate(dateText) {
  return new Date(dateText).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// ---------- Navbar (same on every customer page) ----------
function renderNavbar(activePage) {
  const user = getUser();
  const cartCount = getCartCount(); // from cart.js

  let rightSide = '';
  if (user && user.role === 'customer') {
    rightSide = `
      <li><a href="orders.html" class="${activePage === 'orders' ? 'active' : ''}"><i class="fa-solid fa-box"></i> My Orders</a></li>
      <li><span class="user-chip"><i class="fa-solid fa-user"></i> ${user.name}</span></li>
      <li><a href="#" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i></a></li>`;
  } else if (user && user.role === 'admin') {
    rightSide = `<li><a href="admin.html" class="btn btn-orange btn-sm">Admin Panel</a></li>`;
  } else {
    rightSide = `<li><a href="login.html" class="btn btn-green btn-sm"><i class="fa-solid fa-user"></i> Login</a></li>`;
  }

  document.getElementById('navbar').innerHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="index.html" class="logo"><i class="fa-solid fa-seedling"></i> Farm<span>-to-</span>Door</a>
        <button class="menu-toggle" onclick="document.querySelector('.nav-links').classList.toggle('open')">
          <i class="fa-solid fa-bars"></i>
        </button>
        <ul class="nav-links">
          <li><a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a></li>
          <li><a href="products.html" class="${activePage === 'products' ? 'active' : ''}">Shop</a></li>
          <li>
            <a href="cart.html" class="cart-link ${activePage === 'cart' ? 'active' : ''}">
              <i class="fa-solid fa-basket-shopping"></i>
              <span class="badge" id="cartBadge">${cartCount}</span>
            </a>
          </li>
          ${rightSide}
        </ul>
      </div>
    </nav>`;
}

// ---------- Footer (same on every customer page) ----------
function renderFooter() {
  document.getElementById('footer').innerHTML = `
    <footer>
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="logo"><i class="fa-solid fa-seedling"></i> Farm<span>-to-</span>Door</div>
            <p>Fresh produce straight from Sri Lankan farmers to your doorstep. No middlemen, fair prices.</p>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="products.html?category=Vegetable">Vegetables</a></li>
              <li><a href="products.html?category=Fruit">Fruits</a></li>
              <li><a href="products.html?category=Grain">Grains</a></li>
              <li><a href="products.html?category=Dairy">Dairy</a></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li><i class="fa-solid fa-phone"></i> 011 234 5678</li>
              <li><i class="fa-solid fa-envelope"></i> hello@farmtodoor.lk</li>
              <li><i class="fa-solid fa-location-dot"></i> Colombo, Sri Lanka</li>
            </ul>
          </div>
        </div>
        <p class="copy">© 2026 Farm-to-Door. All rights reserved.</p>
      </div>
    </footer>`;
}

// ---------- Product card (used on Home + Shop pages) ----------
let loadedProducts = {}; // keeps products so "Add to cart" can find them by id

function productCardHTML(p) {
  loadedProducts[p.id] = p;
  const outOfStock = p.stock <= 0;

  return `
    <div class="product-card">
      <div class="product-img">
        <img src="${p.image_url || NO_IMAGE}" alt="${p.name}" onerror="this.src='${NO_IMAGE}'">
        <span class="cat-badge cat-${p.category}">${p.category}</span>
        <span class="stock-badge ${outOfStock ? 'out' : ''}">
          ${outOfStock ? 'Out of stock' : p.stock + ' ' + p.unit + ' left'}
        </span>
      </div>
      <div class="product-body">
        <h3>${p.name}</h3>
        <p class="farmer"><i class="fa-solid fa-tractor"></i> ${p.farmer_name || 'Local farmer'}${p.farmer_location ? ', ' + p.farmer_location : ''}</p>
        <p class="price">${formatPrice(p.price)} <small>/ ${p.unit}</small></p>
        <div class="add-row">
          <input type="number" class="qty-input" id="qty-${p.id}" value="1" min="1" max="${p.stock}" ${outOfStock ? 'disabled' : ''}>
          <button class="btn btn-green btn-sm" style="flex:1" onclick="handleAddToCart(${p.id})" ${outOfStock ? 'disabled' : ''}>
            <i class="fa-solid fa-cart-plus"></i> Add
          </button>
        </div>
      </div>
    </div>`;
}

function handleAddToCart(id) {
  const user = getUser();
  if (user && user.role === 'admin') {
    showToast('Admin cannot place orders', 'error');
    return;
  }
  const qty = parseInt(document.getElementById('qty-' + id).value) || 1;
  addToCart(loadedProducts[id], qty);
}
