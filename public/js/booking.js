// File: public/js/bookings.js
document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = 'https://my-hotel-management-app.onrender.com'; // Use your actual Render URL
  const bookingsList = document.getElementById('bookings-list');
  const token = localStorage.getItem('authToken');

  if (!token) {
    bookingsList.innerHTML = '<p>You must be logged in. <a href="/index.html">Login here</a>.</p>';
    return;
  }

  const fetchMyBookings = async () => {
    bookingsList.innerHTML = '<p>Loading your bookings...</p>';
    try {
      const response = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        renderBookings(result.data);
      } else {
        bookingsList.innerHTML = `<p style="color: red;">Error: ${result.message}</p>`;
      }
    } catch (error) {
      bookingsList.innerHTML = '<p style="color: red;">Could not connect to the server.</p>';
    }
  };

  const renderBookings = (bookings) => {
    if (bookings.length === 0) {
      bookingsList.innerHTML = '<p>You have no bookings.</p>';
      return;
    }
    bookingsList.innerHTML = bookings.map(b => `
      <div style="border: 1px solid #ccc; padding: 10px; margin: 10px 0;">
        <p><strong>Booking ID:</strong> ${b._id}</p>
        <p><strong>Check-in:</strong> ${new Date(b.checkInDate).toLocaleDateString()}</p>
      </div>
    `).join('');
  };

  fetchMyBookings();
});