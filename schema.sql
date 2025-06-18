-- PostgreSQL Schema for Hotel Booking Application (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotels Table
CREATE TABLE hotels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  address JSONB, -- Structured address data
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  amenities TEXT[], -- Array of hotel amenities
  images TEXT[], -- Array of image URLs
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on hotel location for faster searches
CREATE INDEX idx_hotels_location ON hotels(location);

-- Rooms Table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  price_per_night NUMERIC(10, 2) NOT NULL,
  max_guests INTEGER NOT NULL,
  amenities TEXT[], -- Array of room amenities
  is_available BOOLEAN DEFAULT TRUE,
  description TEXT,
  images TEXT[], -- Array of image URLs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure room numbers are unique within a hotel
  UNIQUE(hotel_id, room_number)
);

-- Create index on hotel_id for faster joins
CREATE INDEX idx_rooms_hotel_id ON rooms(hotel_id);

-- Bookings Table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guest_count INTEGER NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'cancelled', 'completed')) DEFAULT 'confirmed',
  total_price NUMERIC(10, 2) NOT NULL,
  payment_info JSONB, -- Payment details
  special_requests TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure check_out is after check_in
  CONSTRAINT valid_dates CHECK (check_out > check_in)
);

-- Create indexes for faster booking lookups
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_hotel_id ON bookings(hotel_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hotel_id UUID REFERENCES hotels(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5) NOT NULL,
  comment TEXT,
  images TEXT[], -- Allow users to upload images with reviews
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one review per booking
  UNIQUE(booking_id)
);

-- Create index for faster review lookups
CREATE INDEX idx_reviews_hotel_id ON reviews(hotel_id);

-- Room Availability Table (for efficient availability searches)
CREATE TABLE room_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one entry per room per date
  UNIQUE(room_id, date)
);

-- Create index for faster availability searches
CREATE INDEX idx_room_availability_date ON room_availability(date);
CREATE INDEX idx_room_availability_room_id ON room_availability(room_id);

-- Hotel Images Table (for better image management)
CREATE TABLE hotel_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Images Table (for better image management)
CREATE TABLE room_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wishlists Table (for users to save favorite hotels)
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Ensure one entry per user per hotel
  UNIQUE(user_id, hotel_id)
);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
CREATE TRIGGER update_hotels_timestamp
BEFORE UPDATE ON hotels
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_rooms_timestamp
BEFORE UPDATE ON rooms
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_bookings_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_reviews_timestamp
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Function to update room availability when a booking is made or cancelled
CREATE OR REPLACE FUNCTION update_room_availability()
RETURNS TRIGGER AS $$
DECLARE
  curr_date DATE;
BEGIN
  -- If booking is created or status changed to confirmed
  IF (TG_OP = 'INSERT' AND NEW.status = 'confirmed') OR 
     (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'cancelled') THEN
    
    -- For each date in the booking range
    curr_date := NEW.check_in;
    WHILE curr_date < NEW.check_out LOOP
      -- Insert or update availability record
      INSERT INTO room_availability (room_id, date, is_available, booking_id)
      VALUES (NEW.room_id, curr_date, FALSE, NEW.id)
      ON CONFLICT (room_id, date) DO UPDATE
      SET is_available = FALSE, booking_id = NEW.id;
      
      curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
    
  -- If booking is cancelled
  ELSIF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'confirmed') THEN
    
    -- For each date in the booking range
    curr_date := NEW.check_in;
    WHILE curr_date < NEW.check_out LOOP
      -- Update availability record
      UPDATE room_availability
      SET is_available = TRUE, booking_id = NULL
      WHERE room_id = NEW.room_id AND date = curr_date AND booking_id = NEW.id;
      
      curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
    
  -- If booking is deleted
  ELSIF (TG_OP = 'DELETE') THEN
    
    -- For each date in the booking range
    curr_date := OLD.check_in;
    WHILE curr_date < OLD.check_out LOOP
      -- Update availability record
      UPDATE room_availability
      SET is_available = TRUE, booking_id = NULL
      WHERE room_id = OLD.room_id AND date = curr_date AND booking_id = OLD.id;
      
      curr_date := curr_date + INTERVAL '1 day';
    END LOOP;
    
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for booking changes
CREATE TRIGGER after_booking_insert
AFTER INSERT ON bookings
FOR EACH ROW EXECUTE FUNCTION update_room_availability();

CREATE TRIGGER after_booking_update
AFTER UPDATE OF status, check_in, check_out ON bookings
FOR EACH ROW EXECUTE FUNCTION update_room_availability();

CREATE TRIGGER after_booking_delete
AFTER DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION update_room_availability();

-- Function to calculate average rating for hotels
CREATE OR REPLACE FUNCTION calculate_hotel_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update hotel with average rating
  UPDATE hotels
  SET rating = (
    SELECT AVG(rating)
    FROM reviews
    WHERE hotel_id = NEW.hotel_id
  )
  WHERE id = NEW.hotel_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update hotel rating when a review is added, updated or deleted
CREATE TRIGGER after_review_change
AFTER INSERT OR UPDATE OF rating OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION calculate_hotel_rating();

-- Function to handle new Supabase Auth users
CREATE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'full_name', ''));
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new Supabase Auth users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Hotels table policies
CREATE POLICY "Hotels are viewable by everyone" ON hotels
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert hotels" ON hotels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update hotels" ON hotels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete hotels" ON hotels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Rooms table policies
CREATE POLICY "Rooms are viewable by everyone" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert rooms" ON rooms
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update rooms" ON rooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete rooms" ON rooms
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookings table policies
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all bookings" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Reviews table policies
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Wishlists table policies
CREATE POLICY "Users can view their own wishlists" ON wishlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- Create views for common queries

-- Available rooms view
CREATE OR REPLACE VIEW available_rooms AS
SELECT r.*, h.name as hotel_name, h.location as hotel_location, h.star_rating
FROM rooms r
JOIN hotels h ON r.hotel_id = h.id
WHERE r.is_available = TRUE;

-- Hotel ratings view
CREATE OR REPLACE VIEW hotel_ratings AS
SELECT 
  h.id, 
  h.name, 
  h.location, 
  h.star_rating,
  COUNT(r.id) as review_count,
  COALESCE(AVG(r.rating), 0) as average_rating
FROM hotels h
LEFT JOIN reviews r ON h.id = r.hotel_id
GROUP BY h.id, h.name, h.location, h.star_rating;

-- User bookings view
CREATE OR REPLACE VIEW user_bookings AS
SELECT 
  b.id as booking_id,
  b.user_id,
  b.check_in,
  b.check_out,
  b.status,
  b.total_price,
  h.id as hotel_id,
  h.name as hotel_name,
  h.location as hotel_location,
  r.id as room_id,
  r.room_type,
  r.room_number
FROM bookings b
JOIN hotels h ON b.hotel_id = h.id
JOIN rooms r ON b.room_id = r.id;

-- Function to check room availability for a date range
CREATE OR REPLACE FUNCTION check_room_availability(
  p_hotel_id UUID,
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER DEFAULT 1
)
RETURNS TABLE (
  room_id UUID,
  room_number TEXT,
  room_type TEXT,
  price_per_night NUMERIC(10, 2),
  max_guests INTEGER,
  amenities TEXT[],
  images TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.room_number,
    r.room_type,
    r.price_per_night,
    r.max_guests,
    r.amenities,
    r.images
  FROM rooms r
  WHERE 
    r.hotel_id = p_hotel_id AND
    r.max_guests >= p_guests AND
    NOT EXISTS (
      SELECT 1
      FROM bookings b
      WHERE 
        b.room_id = r.id AND
        b.status = 'confirmed' AND
        (b.check_in < p_check_out AND b.check_out > p_check_in)
    );
    
  RETURN;
END;
$$ LANGUAGE plpgsql;