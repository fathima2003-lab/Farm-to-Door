// =================================================
// admin.js  -  Admin panel (manage everything)
// Sections: Dashboard, Products, Orders, Farmers, Drivers, Customers
// =================================================

// ---------- Only admin can open this page ----------
const admin = getUser();
if (!admin || admin.role !== 'admin') {
  window.location.href = 'login.html';
}

const content = document.getElementById('content');
const addBtn = document.getElementById('addBtn');

// =================================================
// SIDEBAR NAVIGATION
// =================================================
const sections = {
  dashboard: { title: 'Dashboard', load: loadDashboard },
  products: { title: 'Products', load: loadProducts, add: 'Add Product', onAdd: () => openProductForm() },
  orders: { title: 'Orders', load: loadOrders },
  farmers: { title: 'Farmers', load: loadFarmers, add: 'Add Farmer', onAdd: () => openFarmerForm() },
  drivers: { title: 'Delivery Drivers', load: loadDrivers, add: 'Add Driver', onAdd: () => openDriverForm() },
  customers: { title: 'Customers', load: loadCustomers }
};

function showSection(name) {
  const section = sections[name];
  document.querySelectorAll('.side-link').forEach(b => b.classList.toggle('active', b.dataset.section === name));
  document.getElementById('pageTitle').textContent = section.title;

  // show "Add" button only where needed
  if (section.add) {
    addBtn.style.display = 'inline-flex';
    document.getElementById('addBtnText').textContent = section.add;
    addBtn.onclick = section.onAdd;
  } else {
    addBtn.style.display = 'none';
  }

  content.innerHTML = '<p class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p>';
  section.load().catch(err => (content.innerHTML = `<p class="loading">⚠️ ${err.message}</p>`));
}

document.querySelectorAll('.side-link[data-section]').forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});

// =================================================
// POPUP FORM (Modal) - one modal reused for all forms
// =================================================
let onModalSubmit = null;

function openModal(title, fieldsHTML, submitFunction) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalFields').innerHTML = fieldsHTML;
  onModalSubmit = submitFunction;
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

document.getElementById('modalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  // turn all form inputs into one object  { name: 'value', ... }
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    await onModalSubmit(data);
    closeModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Small helper to build one input
function field(label, name, value = '', type = 'text', extra = '') {
  return `
    <div class="form-group">
      <label>${label}</label>
      <input type="${type}" name="${name}" value="${value ?? ''}" ${extra}>
    </div>`;
}

// =================================================
// 1. DASHBOARD
// =================================================
async function loadDashboard() {
  const s = await apiRequest('/admin/stats');
  const orders = await apiRequest('/orders');

  content.innerHTML = `
    <div class="stats">
      <div class="stat" style="--c: linear-gradient(135deg,#2e9e4f,#8bc34a)"><i class="fa-solid fa-receipt"></i><h2>${s.orders}</h2><p>Total Orders</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#ff8a00,#ffc93c)"><i class="fa-solid fa-clock"></i><h2>${s.pendingOrders}</h2><p>Pending Orders</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#8e5cf7,#c18cff)"><i class="fa-solid fa-sack-dollar"></i><h2>${formatPrice(s.revenue)}</h2><p>Revenue (Delivered)</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#2f8fef,#6fc3ff)"><i class="fa-solid fa-users"></i><h2>${s.customers}</h2><p>Customers</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#ef4b4b,#ff8a8a)"><i class="fa-solid fa-carrot"></i><h2>${s.products}</h2><p>Products</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#c28a2c,#e9c46a)"><i class="fa-solid fa-tractor"></i><h2>${s.farmers}</h2><p>Farmers</p></div>
      <div class="stat" style="--c: linear-gradient(135deg,#17a2b8,#5ee0c9)"><i class="fa-solid fa-truck"></i><h2>${s.drivers}</h2><p>Drivers</p></div>
    </div>

    <div class="grid-2">
      <div class="table-wrap">
        <table>
          <tr><th colspan="4">🧾 Recent Orders</th></tr>
          ${orders.slice(0, 6).map(o => `
            <tr><td>#${o.id}</td><td>${o.customer_name}</td><td>${formatPrice(o.total)}</td>
            <td><span class="status status-${o.status.split(' ')[0]}">${o.status}</span></td></tr>`).join('')
            || '<tr><td>No orders yet</td></tr>'}
        </table>
      </div>
      <div class="table-wrap">
        <table>
          <tr><th colspan="2">⚠️ Low Stock (below 20)</th></tr>
          ${s.lowStock.map(p => `<tr><td>${p.name}</td><td class="low">${p.stock} ${p.unit}</td></tr>`).join('')
            || '<tr><td>All products have enough stock 👍</td></tr>'}
        </table>
      </div>
    </div>`;
}

// =================================================
// 2. PRODUCTS
// =================================================
let productsCache = [];

async function loadProducts() {
  productsCache = await apiRequest('/products');

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Farmer</th><th>Actions</th></tr>
        ${productsCache.map(p => `
          <tr>
            <td><img class="thumb" src="${p.image_url || NO_IMAGE}" onerror="this.src='${NO_IMAGE}'"></td>
            <td><b>${p.name}</b></td>
            <td><span class="cat-badge cat-${p.category}" style="position:static">${p.category}</span></td>
            <td>${formatPrice(p.price)} / ${p.unit}</td>
            <td class="${p.stock < 20 ? 'low' : ''}">${p.stock}</td>
            <td>${p.farmer_name || '-'}</td>
            <td class="actions">
              <button class="icon-btn edit" onclick="openProductForm(${p.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete" onclick="deleteItem('products', ${p.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('')}
      </table>
    </div>`;
}

async function openProductForm(id) {
  const p = productsCache.find(x => x.id === id) || {};
  const farmers = await apiRequest('/farmers');
  const categories = ['Vegetable', 'Fruit', 'Grain', 'Dairy'];

  const html = `
    ${field('Product Name', 'name', p.name, 'text', 'required')}
    <div class="form-row">
      <div class="form-group">
        <label>Category</label>
        <select name="category" required>
          ${categories.map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      ${field('Unit (blank = default)', 'unit', p.unit, 'text', 'placeholder="kg / litre / item"')}
    </div>
    <div class="form-row">
      ${field('Price (Rs.)', 'price', p.price, 'number', 'step="0.01" min="1" required')}
      ${field('Stock', 'stock', p.stock ?? 0, 'number', 'min="0" required')}
    </div>
    <div class="form-group">
      <label>Farmer (supplier)</label>
      <select name="farmer_id">
        <option value="">-- Select farmer --</option>
        ${farmers.map(f => `<option value="${f.id}" ${p.farmer_id === f.id ? 'selected' : ''}>${f.name} (${f.location || ''})</option>`).join('')}
      </select>
    </div>
    ${field('Image URL', 'image_url', p.image_url, 'url', 'placeholder="https://images.unsplash.com/..."')}
    <div class="form-group">
      <label>Description</label>
      <textarea name="description" rows="2">${p.description || ''}</textarea>
    </div>`;

  openModal(id ? 'Edit Product' : 'Add Product', html, async (data) => {
    if (id) await apiRequest('/products/' + id, 'PUT', data);
    else await apiRequest('/products', 'POST', data);
    showToast(id ? 'Product updated' : 'Product added');
    loadProducts();
  });
}

// =================================================
// 3. ORDERS  (status change + assign driver)
// =================================================
async function loadOrders() {
  const orders = await apiRequest('/orders');
  const drivers = await apiRequest('/drivers');

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>ID</th><th>Customer</th><th>Items</th><th>Delivery</th><th>Total</th><th>Status</th><th>Change Status</th><th>Driver</th></tr>
        ${orders.map(o => {
          const closed = o.status === 'Delivered' || o.status === 'Cancelled';

          // only show drivers who are free, or the one already assigned
          const driverOptions = drivers
            .filter(d => d.is_available || d.id === o.driver_id)
            .map(d => `<option value="${d.id}" ${d.id === o.driver_id ? 'selected' : ''}>${d.name} (${d.vehicle_type})</option>`)
            .join('');

          return `
          <tr>
            <td><b>#${o.id}</b><br><small>${formatDate(o.created_at)}</small></td>
            <td>${o.customer_name}<br><small>${o.phone}</small></td>
            <td><small>${o.items.map(i => `${i.product_name} × ${i.quantity}`).join('<br>')}</small></td>
            <td><small>${o.address}, ${o.city}<br>${o.delivery_method === 'distance' ? 'Distance based' : 'Flat rate'}</small></td>
            <td><b>${formatPrice(o.total)}</b></td>
            <td><span class="status status-${o.status.split(' ')[0]}">${o.status}</span></td>
            <td>
              ${o.next_statuses.length === 0 ? '<small>Closed</small>' : `
                <select onchange="changeStatus(${o.id}, this.value)">
                  <option value="">Move to...</option>
                  ${o.next_statuses.map(s => `<option>${s}</option>`).join('')}
                </select>`}
            </td>
            <td>
              ${closed ? (o.driver_name || '-') : `
                <select onchange="assignDriver(${o.id}, this.value)">
                  <option value="">-- Assign --</option>
                  ${driverOptions}
                </select>`}
            </td>
          </tr>`;
        }).join('') || '<tr><td colspan="8">No orders yet</td></tr>'}
      </table>
    </div>`;
}

async function changeStatus(orderId, status) {
  if (!status) return;
  try {
    const data = await apiRequest(`/orders/${orderId}/status`, 'PUT', { status });
    showToast(data.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
  loadOrders();
}

async function assignDriver(orderId, driverId) {
  if (!driverId) return;
  try {
    const data = await apiRequest(`/orders/${orderId}/assign-driver`, 'PUT', { driver_id: driverId });
    showToast(data.message);
  } catch (err) {
    showToast(err.message, 'error');
  }
  loadOrders();
}

// =================================================
// 4. FARMERS
// =================================================
let farmersCache = [];

async function loadFarmers() {
  farmersCache = await apiRequest('/farmers');

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>ID</th><th>Name</th><th>Farm</th><th>Phone</th><th>Location</th><th>Products</th><th>Actions</th></tr>
        ${farmersCache.map(f => `
          <tr>
            <td>${f.id}</td><td><b>${f.name}</b></td><td>${f.farm_name || '-'}</td>
            <td>${f.phone || '-'}</td><td>${f.location || '-'}</td><td>${f.product_count}</td>
            <td class="actions">
              <button class="icon-btn edit" onclick="openFarmerForm(${f.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete" onclick="deleteItem('farmers', ${f.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('') || '<tr><td colspan="7">No farmers yet</td></tr>'}
      </table>
    </div>`;
}

function openFarmerForm(id) {
  const f = farmersCache.find(x => x.id === id) || {};
  const html =
    field('Farmer Name', 'name', f.name, 'text', 'required') +
    field('Farm Name', 'farm_name', f.farm_name) +
    field('Phone', 'phone', f.phone, 'tel') +
    field('Location', 'location', f.location);

  openModal(id ? 'Edit Farmer' : 'Add Farmer', html, async (data) => {
    if (id) await apiRequest('/farmers/' + id, 'PUT', data);
    else await apiRequest('/farmers', 'POST', data);
    showToast(id ? 'Farmer updated' : 'Farmer added');
    loadFarmers();
  });
}

// =================================================
// 5. DRIVERS
// =================================================
let driversCache = [];

async function loadDrivers() {
  driversCache = await apiRequest('/drivers');

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>ID</th><th>Name</th><th>Phone</th><th>Vehicle</th><th>Vehicle No</th><th>Status</th><th>Actions</th></tr>
        ${driversCache.map(d => `
          <tr>
            <td>${d.id}</td><td><b>${d.name}</b></td><td>${d.phone || '-'}</td>
            <td>${d.vehicle_type || '-'}</td><td>${d.vehicle_no || '-'}</td>
            <td><span class="pill ${d.is_available ? 'yes' : 'no'}">${d.is_available ? 'Available' : 'On delivery'}</span></td>
            <td class="actions">
              <button class="icon-btn edit" onclick="openDriverForm(${d.id})"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-btn delete" onclick="deleteItem('drivers', ${d.id})"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`).join('') || '<tr><td colspan="7">No drivers yet</td></tr>'}
      </table>
    </div>`;
}

function openDriverForm(id) {
  const d = driversCache.find(x => x.id === id) || { is_available: 1 };
  const html =
    field('Driver Name', 'name', d.name, 'text', 'required') +
    field('Phone', 'phone', d.phone, 'tel') +
    `<div class="form-row">
       <div class="form-group">
         <label>Vehicle Type</label>
         <select name="vehicle_type">
           ${['Lorry', 'Van', 'Three-wheeler', 'Motorbike'].map(v => `<option ${d.vehicle_type === v ? 'selected' : ''}>${v}</option>`).join('')}
         </select>
       </div>
       ${field('Vehicle No', 'vehicle_no', d.vehicle_no)}
     </div>` +
    (id ? `
      <div class="form-group">
        <label>Status</label>
        <select name="is_available">
          <option value="1" ${d.is_available ? 'selected' : ''}>Available</option>
          <option value="0" ${!d.is_available ? 'selected' : ''}>On delivery</option>
        </select>
      </div>` : '');

  openModal(id ? 'Edit Driver' : 'Add Driver', html, async (data) => {
    data.is_available = data.is_available === '0' ? 0 : 1;
    if (id) await apiRequest('/drivers/' + id, 'PUT', data);
    else await apiRequest('/drivers', 'POST', data);
    showToast(id ? 'Driver updated' : 'Driver added');
    loadDrivers();
  });
}

// =================================================
// 6. CUSTOMERS (view only)
// =================================================
async function loadCustomers() {
  const customers = await apiRequest('/admin/customers');

  content.innerHTML = `
    <div class="table-wrap">
      <table>
        <tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Orders</th><th>Joined</th></tr>
        ${customers.map(c => `
          <tr>
            <td>${c.id}</td><td><b>${c.name}</b></td><td>${c.email}</td><td>${c.phone || '-'}</td>
            <td>${c.address || '-'}</td><td>${c.order_count}</td><td>${formatDate(c.created_at)}</td>
          </tr>`).join('') || '<tr><td colspan="7">No customers yet</td></tr>'}
      </table>
    </div>`;
}

// =================================================
// DELETE (shared for products, farmers, drivers)
// =================================================
async function deleteItem(type, id) {
  if (!confirm('Are you sure you want to delete this?')) return;
  try {
    await apiRequest(`/${type}/${id}`, 'DELETE');
    showToast('Deleted successfully');
    showSection(type);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Start on dashboard
showSection('dashboard');
