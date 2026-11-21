// =================================================
// products.js  -  Shop page (search + filter)
// =================================================
renderNavbar('products');
renderFooter();

// Read ?category=Fruit from the URL (when coming from Home page)
let selectedCategory = new URLSearchParams(window.location.search).get('category') || '';
let searchText = '';

// Load products from backend with filters
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<p class="loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</p>';

  try {
    const query = `?search=${encodeURIComponent(searchText)}&category=${selectedCategory}`;
    const products = await apiRequest('/products' + query);

    if (products.length === 0) {
      grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><i class="fa-solid fa-carrot"></i><p>No products found</p></div>';
      return;
    }
    grid.innerHTML = products.map(productCardHTML).join('');
  } catch (err) {
    grid.innerHTML = `<p class="loading">⚠️ ${err.message}</p>`;
  }
}

// Category chips
document.querySelectorAll('.chip').forEach(chip => {
  if (chip.dataset.category === selectedCategory) {
    document.querySelector('.chip.active').classList.remove('active');
    chip.classList.add('active');
  }

  chip.addEventListener('click', () => {
    document.querySelector('.chip.active').classList.remove('active');
    chip.classList.add('active');
    selectedCategory = chip.dataset.category;
    loadProducts();
  });
});

// Search box (waits 400ms after typing stops)
let searchTimer;
document.getElementById('searchInput').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchText = e.target.value.trim();
    loadProducts();
  }, 400);
});

loadProducts();
