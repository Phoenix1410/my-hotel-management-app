/**
 * Real-time Bookings with Supabase
 * 
 * This file demonstrates how to subscribe to real-time changes
 * on the bookings table and update the UI accordingly.
 */

// Initialize the Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// DOM elements for the bookings UI
const bookingsList = document.getElementById('bookings-list');
const bookingsCount = document.getElementById('bookings-count');
const loadingIndicator = document.getElementById('loading-indicator');
const notificationToast = document.getElementById('notification-toast');
const notificationMessage = document.getElementById('notification-message');

// Store bookings data
let bookings = [];

/**
 * Initialize real-time subscriptions
 */
async function initializeRealtime() {
  console.log('Setting up real-time subscriptions for bookings...');
  
  // Subscribe to all changes on the bookings table
  const subscription = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'bookings',
      },
      handleBookingChange
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Successfully subscribed to bookings changes!');
        showNotification('Real-time updates enabled', 'success');
      } else if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe to bookings changes');
        showNotification('Real-time updates failed to connect', 'error');
      }
    });

  // Load initial bookings data
  await fetchBookings();
}

/**
 * Handle booking changes from real-time subscription
 * @param {Object} payload - The real-time event payload
 */
function handleBookingChange(payload) {
  console.log('Booking change detected:', payload);
  
  const { eventType, new: newRecord, old: oldRecord } = payload;
  
  switch (eventType) {
    case 'INSERT':
      handleBookingInsert(newRecord);
      break;
    case 'UPDATE':
      handleBookingUpdate(oldRecord, newRecord);
      break;
    case 'DELETE':
      handleBookingDelete(oldRecord);
      break;
    default:
      console.warn('Unknown event type:', eventType);
  }
  
  // Update the bookings count
  updateBookingsCount();
}

/**
 * Handle a new booking being inserted
 * @param {Object} booking - The new booking data
 */
function handleBookingInsert(booking) {
  console.log('New booking created:', booking);
  
  // Add to our local data
  bookings.unshift(booking);
  
  // Create and add the booking element to the DOM
  const bookingElement = createBookingElement(booking);
  bookingsList.prepend(bookingElement);
  
  // Highlight the new booking with animation
  bookingElement.classList.add('new-booking-animation');
  setTimeout(() => {
    bookingElement.classList.remove('new-booking-animation');
  }, 3000);
  
  // Show notification
  showNotification('New booking received!', 'success');
}

/**
 * Handle a booking being updated
 * @param {Object} oldBooking - The previous booking data
 * @param {Object} newBooking - The updated booking data
 */
function handleBookingUpdate(oldBooking, newBooking) {
  console.log('Booking updated:', { old: oldBooking, new: newBooking });
  
  // Update our local data
  const index = bookings.findIndex(b => b.id === newBooking.id);
  if (index !== -1) {
    bookings[index] = newBooking;
    
    // Update the DOM element
    const bookingElement = document.getElementById(`booking-${newBooking.id}`);
    if (bookingElement) {
      // Replace with updated element
      const updatedElement = createBookingElement(newBooking);
      bookingElement.replaceWith(updatedElement);
      
      // Highlight the updated booking
      updatedElement.classList.add('update-booking-animation');
      setTimeout(() => {
        updatedElement.classList.remove('update-booking-animation');
      }, 3000);
      
      // Show notification based on status change
      if (oldBooking.status !== newBooking.status) {
        showNotification(`Booking status changed to ${newBooking.status}`, 'info');
      } else {
        showNotification('Booking details updated', 'info');
      }
    }
  }
}

/**
 * Handle a booking being deleted
 * @param {Object} booking - The deleted booking data
 */
function handleBookingDelete(booking) {
  console.log('Booking deleted:', booking);
  
  // Remove from our local data
  bookings = bookings.filter(b => b.id !== booking.id);
  
  // Remove from the DOM with animation
  const bookingElement = document.getElementById(`booking-${booking.id}`);
  if (bookingElement) {
    bookingElement.classList.add('delete-booking-animation');
    
    // Remove after animation completes
    setTimeout(() => {
      bookingElement.remove();
    }, 500);
    
    // Show notification
    showNotification('Booking has been cancelled', 'warning');
  }
}

/**
 * Fetch initial bookings data
 */
async function fetchBookings() {
  try {
    loadingIndicator.style.display = 'block';
    
    // Get user's bookings or all bookings for admin
    const { data, error } = await supabase
      .from('user_bookings') // Using the view we created in the schema
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    bookings = data || [];
    renderBookings();
    updateBookingsCount();
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    showNotification('Failed to load bookings', 'error');
  } finally {
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Render all bookings to the DOM
 */
function renderBookings() {
  // Clear the current list
  bookingsList.innerHTML = '';
  
  if (bookings.length === 0) {
    bookingsList.innerHTML = '<div class="no-bookings">No bookings found</div>';
    return;
  }
  
  // Add each booking to the list
  bookings.forEach(booking => {
    const bookingElement = createBookingElement(booking);
    bookingsList.appendChild(bookingElement);
  });
}

/**
 * Create a booking element for the DOM
 * @param {Object} booking - The booking data
 * @returns {HTMLElement} The booking element
 */
function createBookingElement(booking) {
  const element = document.createElement('div');
  element.id = `booking-${booking.id}`;
  element.className = 'booking-item';
  
  // Format dates for display
  const checkIn = new Date(booking.check_in).toLocaleDateString();
  const checkOut = new Date(booking.check_out).toLocaleDateString();
  
  // Set status class for styling
  const statusClass = booking.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
  
  element.innerHTML = `
    <div class="booking-header">
      <h3>${booking.hotel_name}</h3>
      <span class="booking-status ${statusClass}">${booking.status}</span>
    </div>
    <div class="booking-details">
      <p><strong>Room:</strong> ${booking.room_type} (${booking.room_number})</p>
      <p><strong>Dates:</strong> ${checkIn} to ${checkOut}</p>
      <p><strong>Total:</strong> $${booking.total_price}</p>
    </div>
    <div class="booking-actions">
      ${booking.status === 'confirmed' ? 
        `<button class="cancel-btn" data-id="${booking.id}">Cancel Booking</button>` : 
        ''}
      <button class="details-btn" data-id="${booking.id}">View Details</button>
    </div>
  `;
  
  // Add event listeners for buttons
  const cancelBtn = element.querySelector('.cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => cancelBooking(booking.id));
  }
  
  const detailsBtn = element.querySelector('.details-btn');
  if (detailsBtn) {
    detailsBtn.addEventListener('click', () => viewBookingDetails(booking.id));
  }
  
  return element;
}

/**
 * Update the bookings count display
 */
function updateBookingsCount() {
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  bookingsCount.textContent = `${confirmedCount} active booking${confirmedCount !== 1 ? 's' : ''}`;
}

/**
 * Show a notification toast
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info, warning)
 */
function showNotification(message, type = 'info') {
  notificationMessage.textContent = message;
  notificationToast.className = `notification-toast ${type}`;
  notificationToast.style.display = 'block';
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notificationToast.style.display = 'none';
  }, 5000);
}

/**
 * Cancel a booking
 * @param {string} bookingId - The ID of the booking to cancel
 */
async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);
    
    if (error) throw error;
    
    // Note: We don't need to update the UI here as the real-time subscription will handle it
    console.log('Booking cancelled successfully');
  } catch (error) {
    console.error('Error cancelling booking:', error);
    showNotification('Failed to cancel booking', 'error');
  }
}

/**
 * View booking details
 * @param {string} bookingId - The ID of the booking to view
 */
function viewBookingDetails(bookingId) {
  // This would typically open a modal or navigate to a details page
  console.log('Viewing details for booking:', bookingId);
  
  // Find the booking in our local data
  const booking = bookings.find(b => b.id === bookingId);
  if (booking) {
    // For this example, we'll just log the details
    console.log('Booking details:', booking);
    
    // In a real application, you would show these details in a modal or page
    alert(`Booking Details:\n\nHotel: ${booking.hotel_name}\nRoom: ${booking.room_type}\nDates: ${new Date(booking.check_in).toLocaleDateString()} to ${new Date(booking.check_out).toLocaleDateString()}\nStatus: ${booking.status}\nTotal: $${booking.total_price}`);
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeRealtime);

// Cleanup function to remove subscription when page is unloaded
window.addEventListener('beforeunload', () => {
  // Remove the channel subscription
  supabase.channel('bookings-changes').unsubscribe();
});