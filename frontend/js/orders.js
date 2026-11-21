// =================================================
// orders.js  -  Customer order tracking + notifications
// =================================================

// Only logged-in customers can see this page
const currentUser = getUser();
if (!currentUser || currentUser.role !== 'customer') {
  window.location.href = 'login.html';
}

renderNavbar('orders');
renderFooter();

const STEPS = [
  { name: 'Pending', icon: 'fa-clock' },
  { name: 'Confirmed', icon: 'fa-clipboard-check' },
  { name: 'Out for Delivery', icon: 'fa-truck-fast' },
  { name: 'Delivered', icon: 'fa-house-circle-check' }
];

// Progress tracker HTML (Pending -> Confirmed -> Out for Delivery -> Delivered)
function trackerHTML(status) {
  const currentIndex = STEPS.findIndex(s => s.name === status);
  const percent = (currentIndex / (STEPS.length - 1)) * 84; // 84% = width between first & last dot

  return `
    <div class="tracker">
      <div class="bar" style="width:${percent}%"></div>
      ${STEPS.map((step, i) => `
        <div class="track-step ${i <= currentIndex ? 'done' : ''}">
          <div class="dot"><i class="fa-solid ${step.icon}"></i></div>
          ${step.name}
        </div>`).join('')}
    </div>`;
}

async function loadOrders() {
  const box = document.getElementById('ordersList');
  try {
    const orders = await apiRequest('/orders/my');

    if (orders.length === 0) {
      box.innerHTML = `
        <div class="card empty">
          <i class="fa-solid fa-box-open"></i>
          <p>You have no orders yet</p><br>
          <a href="products.html" class="btn btn-green">Start Shopping</a>
        </div>`;
      return;
    }

    box.innerHTML = orders.map(order => `
      <div class="order-card ${order.status === 'Cancelled' ? 'cancelled' : ''}">
        <div class="order-head">
          <div>
            <h3>Order #${order.id}</h3>
            <small style="color:var(--muted)">${formatDate(order.created_at)} · ${order.city}</small>
          </div>
          <span class="status status-${order.status.split(' ')[0]}">${order.status}</span>
        </div>

        ${order.status === 'Cancelled'
          ? '<p style="color:var(--red); font-weight:600"><i class="fa-solid fa-circle-xmark"></i> This order was cancelled</p>'
          : trackerHTML(order.status)}

        <p class="order-items">
          ${order.items.map(i => `${i.product_name} × ${i.quantity}`).join(', ')}
        </p>

        ${order.driver_name ? `
          <div class="driver-box">
            <i class="fa-solid fa-truck"></i> Driver: <b>${order.driver_name}</b> · ${order.driver_phone} · ${order.vehicle_no}
          </div>` : ''}

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px">
          <span>Total: <b style="color:var(--green-dark); font-size:18px">${formatPrice(order.total)}</b>
            <small style="color:var(--muted)">(incl. delivery ${formatPrice(order.delivery_fee)})</small></span>
          ${order.status === 'Pending'
            ? `<button class="btn btn-red btn-sm" onclick="cancelOrder(${order.id})">Cancel Order</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    box.innerHTML = `<p class="loading">⚠️ ${err.message}</p>`;
  }
}

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;
  try {
    await apiRequest(`/orders/${id}/cancel`, 'PUT');
    showToast('Order cancelled');
    loadOrders();
    loadNotifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------- Notifications ----------
async function loadNotifications() {
  const list = document.getElementById('notifList');
  try {
    const notes = await apiRequest('/notifications');
    list.innerHTML = notes.length === 0
      ? '<li>No notifications yet</li>'
      : notes.map(n => `
          <li class="${n.is_read ? '' : 'unread'}">
            ${n.message}
            <small>${formatDate(n.created_at)}</small>
          </li>`).join('');
  } catch (err) {
    list.innerHTML = '<li>Could not load notifications</li>';
  }
}

async function markAllRead() {
  await apiRequest('/notifications/read-all', 'PUT');
  loadNotifications();
}

loadOrders();
loadNotifications();
