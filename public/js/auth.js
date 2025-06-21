// File: public/js/auth.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://my-hotel-management-app.onrender.com'; // Use your actual Render URL
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorMessageDiv = document.getElementById('error-message');

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessageDiv.textContent = '';
      const email = emailInput.value;
      const password = passwordInput.value;
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          localStorage.setItem('authToken', result.token);
          alert('Login successful! Redirecting...');
          window.location.href = '/bookings.html';
        } else {
          errorMessageDiv.textContent = result.message || 'Login failed.';
        }
      } catch (error) {
        errorMessageDiv.textContent = 'Could not connect to the server.';
      }
    });
  }
});