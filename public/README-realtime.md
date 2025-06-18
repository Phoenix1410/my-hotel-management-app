# Real-time Bookings with Supabase

This document explains how to set up and use real-time functionality with Supabase for the hotel booking application.

## Overview

Supabase provides real-time capabilities through PostgreSQL's built-in replication functionality. This allows your application to subscribe to changes in your database tables and receive updates in real-time.

## Setup Instructions

### 1. Enable Real-time in Supabase Dashboard

1. Log in to your Supabase dashboard
2. Go to Database → Replication
3. Make sure the "Realtime" option is enabled
4. Configure which tables to broadcast changes for:
   - Click on "Manage tables"
   - Find the `bookings` table
   - Enable all operations (INSERT, UPDATE, DELETE)

### 2. Configure Client-Side Code

The `realtime-bookings.js` file contains all the necessary code to subscribe to real-time changes. Here's how it works:

```javascript
// Initialize the Supabase client
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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
  .subscribe();
```

## Implementation Details

### Subscription Setup

The code creates a channel named 'bookings-changes' and subscribes to all PostgreSQL changes on the 'bookings' table. When changes occur, the `handleBookingChange` function is called with the payload data.

### Handling Different Event Types

The `handleBookingChange` function processes different types of events:

```javascript
function handleBookingChange(payload) {
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
  }
}
```

### UI Updates

Each event type has a corresponding handler function that updates the UI:

- `handleBookingInsert`: Adds a new booking to the list with a highlight animation
- `handleBookingUpdate`: Updates an existing booking with a different highlight animation
- `handleBookingDelete`: Removes a booking with a fade-out animation

### Cleanup

It's important to unsubscribe from the channel when the page is unloaded:

```javascript
window.addEventListener('beforeunload', () => {
  supabase.channel('bookings-changes').unsubscribe();
});
```

## Testing the Real-time Functionality

The `bookings.html` file includes a test panel at the bottom of the page that simulates real-time events for demonstration purposes. In a production environment, these events would come from actual database changes.

## Advanced Configuration

### Filtering Events

You can filter which events you receive by specifying additional filters:

```javascript
// Example: Only listen to bookings for a specific hotel
supabase
  .channel('hotel-bookings')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: 'hotel_id=eq.some-hotel-id'
    },
    handleBookingChange
  )
  .subscribe();
```

### User-Specific Bookings

For authenticated users, you might want to only show their own bookings:

```javascript
// Get the current user's ID
const { data: { user } } = await supabase.auth.getUser();

// Subscribe only to the current user's bookings
supabase
  .channel('my-bookings')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `user_id=eq.${user.id}`
    },
    handleBookingChange
  )
  .subscribe();
```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the real-time API:

1. Check that real-time is enabled in your Supabase dashboard
2. Verify that your Supabase URL and API key are correct
3. Check browser console for any errors
4. Ensure your subscription code is running after the page has loaded

### Performance Considerations

For large applications with many concurrent users:

1. Be specific about which tables and events you subscribe to
2. Use filters to limit the data you receive
3. Consider implementing pagination or virtual scrolling for large lists
4. Unsubscribe from channels when they're no longer needed

## Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/subscribe)
- [PostgreSQL Replication](https://www.postgresql.org/docs/current/logical-replication.html)