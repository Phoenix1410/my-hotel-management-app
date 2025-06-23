// This script handles the login modal and the login form submission.

document.addEventListener('DOMContentLoaded', () => {
  console.log('Authentication script loaded.');

  // --- CONFIGURATION ---
  const API_BASE_URL = 'https://my-hotel-management-app.onrender.com'; // Use your actual Render URL

  // --- START: MODAL CONTROL LOGIC ---
  
  // Get references to the modal and its control buttons
  const authModal = document.getElementById('auth-modal');
  const navbarLoginBtn = document.getElementById('navbar-login-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  // Check if the elements exist on the page before adding listeners
  if (navbarLoginBtn && authModal) {
    // When the user clicks the "Login" button in the navbar, show the modal
    navbarLoginBtn.addEventListener('click', () => {
      console.log('Navbar login button clicked. Opening modal.');
      authModal.style.display = 'flex'; // Use 'flex' to enable the centering styles
    });
  }

  if (closeModalBtn && authModal) {
    // When the user clicks the 'X' button inside the modal, hide it
    closeModalBtn.addEventListener('click', () => {
      console.log('Close modal button clicked. Hiding modal.');
      authModal.style.display = 'none';
    });
  }

  // Optional: Also close the modal if the user clicks on the dark overlay
  if (authModal) {
    authModal.addEventListener('click', (event) => {
      // Check if the click was on the overlay itself, not the white popup box
      if (event.target === authModal) {
        console.log('Overlay clicked. Hiding modal.');
        authModal.style.display = 'none';
      }
    });
  }
  // --- END: MODAL CONTROL LOGIC ---


  // --- START: LOGIN FORM SUBMISSION LOGIC (Your existing code) ---

  // Get references to the form and its inputs
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorMessageDiv = document.getElementById('error-message');

  // Check if the login form exists
  if (loginForm) {
    // Add a listener for the form's 'submit' event
    loginForm.addEventListener('submit', async (event) => {
      // Prevent the form from doing a default page reload
      event.preventDefault(); 
      console.log('Login form submitted.');
      
      // Clear any previous error messages
      errorMessageDiv.textContent = '';

      const email = emailInput.value;
      const password = passwordInput.value;

      try {
        // Send the login request to your backend API
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // If login is successful, save the token and redirect
          localStorage.setItem('authToken', result.token);
          alert('Login successful! Redirecting...');
          window.location.href = '/bookings.html';
        } else {
          // If login fails, show the error message from the server
          errorMessageDiv.textContent = result.message || 'Login failed.';
        }
      } catch (error) {
        // If there's a network error, show a generic message
        errorMessageDiv.textContent = 'Could not connect to the server.';
      }
    });
  }
  const navbarSignupBtn = document.getElementById('navbar-signup-btn');
const signupForm = document.getElementById('signup-form');
const toggleFormLink = document.getElementById('toggle-form-link');
const signupErrorMessageDiv = document.getElementById('signup-error-message');

const showModalInMode = (mode) => {
  authModal.style.display = 'flex';
  if (mode === 'signup') {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    toggleFormLink.innerHTML = 'Already have an account? Login';
  } else { // default to login
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    toggleFormLink.innerHTML = "Don't have an account? Sign Up";
  }
};

// Event listener for the main navbar "Sign Up" button
if (navbarSignupBtn) {
  navbarSignupBtn.addEventListener('click', () => {
    showModalInMode('signup');
  });
}

// Event listener for the "Don't have an account?" link
if (toggleFormLink) 
{
  toggleFormLink.addEventListener('click', (e) => {
    e.preventDefault();
    // Check which form is currently visible to decide which one to show
    const isLoginVisible = !loginForm.classList.contains('hidden');
    if (isLoginVisible) {
      showModalInMode('signup');
    } else {
      showModalInMode('login');
    }
  });
}

// Event listener for the signup form submission
  if (signupForm) 
  {
    signupForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      console.log('Signup form submitted.');
      signupErrorMessageDiv.textContent = '';

      // Get values from the signup form
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          // If signup is successful, save token and redirect
          localStorage.setItem('authToken', result.token);
          alert('Account created successfully! Redirecting...');
          window.location.href = '/bookings.html';
        } else {
          signupErrorMessageDiv.textContent = result.message || 'Signup failed.';
        }
      } catch (error) {
        signupErrorMessageDiv.textContent = 'Could not connect to the server.';
      }
    });
  }

  // Initial setup: Show the login form when the modal opens
  if (authModal) {
    authModal.addEventListener('show', () => {
      showModalInMode('login');
    });
  }
  const setupPasswordToggle = (toggleBtnId, passwordInputId) => {
  const toggleBtn = document.getElementById(toggleBtnId);
  const passwordInput = document.getElementById(passwordInputId);
  
  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      const icon = toggleBtn.querySelector('i'); // Get the icon inside the button

      if (isPassword) {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    });
  }
};

// Set up the toggle for both the login and signup forms
setupPasswordToggle('toggle-login-password', 'login-password');
setupPasswordToggle('toggle-signup-password', 'signup-password');

});