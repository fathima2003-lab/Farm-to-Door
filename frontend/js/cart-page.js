// =================================================
// cart-page.js  -  Cart + Checkout
// =================================================
renderNavbar('cart');
renderFooter();

let deliveryFee = 0;

// ---------- Show cart items ----------
function renderCart() {
  const cart = getCart();
  const box = document.getElementById('cartItems');

  if (cart.length === 0) {
    box.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-basket-shopping"></i>
        <p>Your basket is empty</p><br>
        <a href="products.html" class="btn btn-green">Go Shopping</a>
      </div>`;
    document.getElementById('checkoutBox').style.display = 'none';
    return;
  }

  box.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url || NO_IMAGE}" onerror="this.src='${NO_IMAGE}'" alt="${item.name}">
      <div class="info">
        <h4>${item.name}</h4>
        <small>${formatPrice(item.price)} / ${item.unit}</small>
      </div>
      <div class="qty-control">
        <button onclick="changeQty(${item.id}, -1)">−</button>
        <b>${item.quantity}</b>
        <button onclick="changeQty(${item.id}, 1)">+</button>
      </div>
      <b style="width:110px; text-align:right">${formatPrice(item.price * item.quantity)}</b>
      <button class="remove-btn" onclick="removeItem(${item.id})"><i class="fa-solid fa-trash"></i></button>
    </div>
  `).join('');

  updateSummary();
}

function changeQty(id, change) {
  updateQuantity(id, change);
  renderCart();
}

function removeItem(id) {
  removeFromCart(id);
  renderCart();
}

// ---------- Delivery fee from backend (Strategy pattern) ----------
async function calculateFee() {
  const city = document.getElementById('city').value;
  const method = document.querySelector('input[name="method"]:checked').value;

  const result = await apiRequest('/orders/delivery-fee', 'POST', { method, city });
  deliveryFee = result.fee;
  document.getElementById('distanceText').textContent = method === 'distance' ? `(${result.distance} km)` : '';
  updateSummary();
}

function updateSummary() {
  const subtotal = getCartSubtotal();
  document.getElementById('subtotal').textContent = formatPrice(subtotal);
  document.getElementById('deliveryFee').textContent = formatPrice(deliveryFee);
  document.getElementById('total').textContent = formatPrice(subtotal + deliveryFee);
}

// ---------- Load cities into dropdown ----------
async function loadCities() {
  try {
    const cities = await apiRequest('/orders/cities');
    document.getElementById('city').innerHTML = cities.map(c => `<option value="${c}">${c}</option>`).join('');
    calculateFee();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('city').addEventListener('change', calculateFee);
document.querySelectorAll('input[name="method"]').forEach(r => r.addEventListener('change', calculateFee));

// Fill phone + address if customer is logged in
const user = getUser();
if (user) {
  document.getElementById('phone').value = user.phone || '';
  document.getElementById('address').value = user.address || '';
}

// ---------- Place order ----------
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = getUser();
  if (!user) {
    showToast('Please login to place your order', 'error');
    setTimeout(() => (window.location.href = 'login.html'), 1000);
    return;
  }

  const order = {
    items: getCart().map(item => ({ id: item.id, quantity: item.quantity })),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value,
    delivery_method: document.querySelector('input[name="method"]:checked').value
  };

  const btn = document.getElementById('placeOrderBtn');
  btn.disabled = true;

  try {
    const data = await apiRequest('/orders', 'POST', order);
    clearCart();
    showToast(`Order #${data.orderId} placed! 🎉`);
    setTimeout(() => (window.location.href = 'orders.html'), 1200);
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
  }
});

renderCart();
loadCities();
