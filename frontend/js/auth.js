// =================================================
// auth.js  -  Login and Register pages
// =================================================
renderNavbar('');

// ---------- LOGIN PAGE ----------
let selectedRole = 'customer';

function selectRole(role) {
  selectedRole = role;
  document.getElementById('customerTab').classList.toggle('active', role === 'customer');
  document.getElementById('adminTab').classList.toggle('active', role === 'admin');

  // Admin cannot register - hide the link
  document.getElementById('registerLink').style.display = role === 'admin' ? 'none' : 'block';
  document.getElementById('demoNote').innerHTML = role === 'admin'
    ? '<b>Admin:</b> admin@farmtodoor.lk / admin123'
    : '<b>Demo customer:</b> customer@farmtodoor.lk / customer123';
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // stop page reload

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const data = await apiRequest('/auth/login', 'POST', { email, password });

      // make sure the user logged in from the correct tab
      if (data.user.role !== selectedRole) {
        showToast(`This is not a ${selectedRole} account`, 'error');
        return;
      }

      saveLogin(data.token, data.user);
      showToast('Login successful!');

      // go to the correct page based on role
      setTimeout(() => {
        window.location.href = data.user.role === 'admin' ? 'admin.html' : 'products.html';
      }, 700);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

// ---------- REGISTER PAGE ----------
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newUser = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      password: document.getElementById('password').value,
      address: document.getElementById('address').value.trim()
    };

    try {
      const data = await apiRequest('/auth/register', 'POST', newUser);
      showToast(data.message);
      setTimeout(() => (window.location.href = 'login.html'), 1200);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
