// =================================================
// cart.js  -  Shopping cart saved in localStorage
// Cart item = { id, name, price, unit, image_url, stock, quantity }
// =================================================

function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = getCartCount();
}

function getCartCount() {
  return getCart().length;
}

function addToCart(product, quantity) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id);
  const alreadyInCart = existing ? existing.quantity : 0;

  if (alreadyInCart + quantity > product.stock) {
    showToast(`Only ${product.stock} ${product.unit} available`, 'error');
    return;
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      image_url: product.image_url,
      stock: product.stock,
      quantity: quantity
    });
  }

  saveCart(cart);
  showToast(`${product.name} added to cart`);
}

function updateQuantity(id, change) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;

  const newQty = item.quantity + change;
  if (newQty < 1) return;
  if (newQty > item.stock) {
    showToast(`Only ${item.stock} ${item.unit} available`, 'error');
    return;
  }
  item.quantity = newQty;
  saveCart(cart);
}

function removeFromCart(id) {
  saveCart(getCart().filter(item => item.id !== id));
}

function clearCart() {
  saveCart([]);
}

function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
