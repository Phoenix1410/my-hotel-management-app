-- Supabase Real-time Setup for Bookings

-- Enable the pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable real-time for the bookings table
-- Note: This is typically done through the Supabase dashboard UI,
-- but this SQL can be run to ensure it's properly configured

-- First, make sure the publication exists
CREATE PUBLICATION IF NOT EXISTS supabase_realtime FOR ALL TABLES;

-- Add the bookings table to the publication if not already included
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- Create a function to notify when a booking status changes
CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger notification when status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Insert a notification for the user
    INSERT INTO notifications (user_id, title, message, related_id, related_type)
    VALUES (
      NEW.user_id,
      'Booking Status Updated',
      CASE 
        WHEN NEW.status = 'confirmed' THEN 'Your booking has been confirmed.'
        WHEN NEW.status = 'cancelled' THEN 'Your booking has been cancelled.'
        ELSE 'Your booking status has been updated to ' || NEW.status || '.'
      END,
      NEW.id,
      'booking'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for the function
DROP TRIGGER IF EXISTS booking_status_change_trigger ON bookings;
CREATE TRIGGER booking_status_change_trigger
AFTER UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_status_change();

-- Create a notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable row level security on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Add notifications to the real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create a function to update room availability when a booking changes
CREATE OR REPLACE FUNCTION update_room_availability_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If a booking is created or status changed to confirmed
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status != 'confirmed') THEN
    
    -- Update the room availability
    UPDATE rooms
    SET is_available = FALSE
    WHERE id = NEW.room_id;
    
  -- If a booking is cancelled or deleted
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'confirmed') OR
        (TG_OP = 'DELETE' AND OLD.status = 'confirmed') THEN
    
    -- Check if there are any other confirmed bookings for this room
    -- that overlap with the current dates
    IF NOT EXISTS (
      SELECT 1 FROM bookings
      WHERE 
        room_id = COALESCE(NEW.room_id, OLD.room_id) AND
        status = 'confirmed' AND
        id != COALESCE(NEW.id, OLD.id) AND
        check_in < COALESCE(NEW.check_out, OLD.check_out) AND
        check_out > COALESCE(NEW.check_in, OLD.check_in)
    ) THEN
      -- If no overlapping bookings, mark the room as available
      UPDATE rooms
      SET is_available = TRUE
      WHERE id = COALESCE(NEW.room_id, OLD.room_id);
    END IF;
    
  END IF;
  
  -- For INSERT and UPDATE operations, return NEW
  -- For DELETE operations, return OLD
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for the room availability function
DROP TRIGGER IF EXISTS booking_insert_room_availability ON bookings;
CREATE TRIGGER booking_insert_room_availability
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_room_availability_on_booking_change();

DROP TRIGGER IF EXISTS booking_update_room_availability ON bookings;
CREATE TRIGGER booking_update_room_availability
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_room_availability_on_booking_change();

DROP TRIGGER IF EXISTS booking_delete_room_availability ON bookings;
CREATE TRIGGER booking_delete_room_availability
AFTER DELETE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_room_availability_on_booking_change();

-- Create a view for active bookings with hotel and room details
CREATE OR REPLACE VIEW active_bookings AS
SELECT 
  b.id,
  b.user_id,
  b.hotel_id,
  h.name AS hotel_name,
  h.location AS hotel_location,
  b.room_id,
  r.room_type,
  r.room_number,
  r.price_per_night,
  b.check_in,
  b.check_out,
  b.guest_count,
  b.status,
  b.total_price,
  b.created_at,
  u.full_name AS user_name,
  u.email AS user_email
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN rooms r ON b.room_id = r.id
JOIN users u ON b.user_id = u.id
WHERE b.status = 'confirmed';

-- Create a function to calculate booking statistics
CREATE OR REPLACE FUNCTION get_booking_stats(hotel_id_param UUID DEFAULT NULL)
RETURNS TABLE (
  total_bookings BIGINT,
  confirmed_bookings BIGINT,
  cancelled_bookings BIGINT,
  total_revenue NUMERIC,
  avg_booking_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS total_bookings,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed_bookings,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_bookings,
    SUM(CASE WHEN status = 'confirmed' THEN total_price ELSE 0 END) AS total_revenue,
    COALESCE(AVG(CASE WHEN status = 'confirmed' THEN total_price END), 0) AS avg_booking_value
  FROM bookings
  WHERE
    hotel_id_param IS NULL OR hotel_id = hotel_id_param;
 END;
$$ LANGUAGE plpgsql;

-- Create a function to get upcoming bookings for a user
CREATE OR REPLACE FUNCTION get_upcoming_bookings(user_id_param UUID)
RETURNS TABLE (
  booking_id UUID,
  hotel_name TEXT,
  room_type TEXT,
  check_in DATE,
  check_out DATE,
  days_until INTEGER,
  total_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id AS booking_id,
    h.name AS hotel_name,
    r.room_type,
    b.check_in,
    b.check_out,
    (b.check_in - CURRENT_DATE) AS days_until,
    b.total_price
  FROM bookings b
  JOIN hotels h ON b.hotel_id = h.id
  JOIN rooms r ON b.room_id = r.id
  WHERE
    b.user_id = user_id_param AND
    b.status = 'confirmed' AND
    b.check_in >= CURRENT_DATE
  ORDER BY b.check_in ASC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to handle booking cancellations
CREATE OR REPLACE FUNCTION cancel_booking(booking_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  booking_exists BOOLEAN;
  is_owner BOOLEAN;
  is_future_booking BOOLEAN;
  is_already_cancelled BOOLEAN;
BEGIN
  -- Check if booking exists and user is the owner
  SELECT 
    EXISTS(SELECT 1 FROM bookings WHERE id = booking_id_param) AS exists,
    EXISTS(SELECT 1 FROM bookings WHERE id = booking_id_param AND user_id = user_id_param) AS owner,
    EXISTS(SELECT 1 FROM bookings WHERE id = booking_id_param AND check_in > CURRENT_DATE) AS future,
    EXISTS(SELECT 1 FROM bookings WHERE id = booking_id_param AND status = 'cancelled') AS cancelled
  INTO booking_exists, is_owner, is_future_booking, is_already_cancelled;
  
  -- Validate conditions
  IF NOT booking_exists THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  
  IF NOT is_owner THEN
    RAISE EXCEPTION 'You are not authorized to cancel this booking';
  END IF;
  
  IF NOT is_future_booking THEN
    RAISE EXCEPTION 'Cannot cancel a past or current booking';
  END IF;
  
  IF is_already_cancelled THEN
    RAISE EXCEPTION 'Booking is already cancelled';
  END IF;
  
  -- Update booking status
  UPDATE bookings
  SET status = 'cancelled'
  WHERE id = booking_id_param;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;