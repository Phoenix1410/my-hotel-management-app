# Hotel Booking API

A RESTful API for a hotel booking system built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT, extremely user-friendly.
- Role-based access control (user and admin roles)
- Hotel management (CRUD operations)
- Room management (CRUD operations)
- Booking system with availability checking
- Search and filter functionality
- Error handling and validation

## Tech Stack

- Node.js
- Express
- MongoDB with Mongoose ODM
- JWT for authentication
- Bcrypt for password hashing
- Joi for request validation
- Morgan for logging
- CORS enabled

## Project Structure

```
/
├── config/             # Configuration files
│   └── db.js           # Database connection
├── controllers/        # Route controllers
│   ├── authController.js
│   ├── hotelController.js
│   ├── roomController.js
│   └── bookingController.js
├── middlewares/        # Custom middlewares
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── isAdmin.js
│   └── validateRequest.js
├── models/             # Mongoose models
│   ├── User.js
│   ├── Hotel.js
│   ├── Room.js
│   └── Booking.js
├── routes/             # API routes
│   ├── authRoutes.js
│   ├── hotelRoutes.js
│   ├── roomRoutes.js
│   └── bookingRoutes.js
├── utils/              # Utility functions
│   └── apiResponse.js
├── .env                # Environment variables
├── package.json        # Project dependencies
└── server.js          # Entry point
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `PUT /api/auth/password` - Update password (requires auth)

### Hotels

- `GET /api/hotels` - Get all hotels (with filtering)
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create a new hotel (admin only)
- `PUT /api/hotels/:id` - Update hotel (admin only)
- `DELETE /api/hotels/:id` - Delete hotel (admin only)

### Rooms

- `GET /api/rooms` - Get all rooms (with filtering)
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms` - Create a new room (admin only)
- `PUT /api/rooms/:id` - Update room (admin only)
- `DELETE /api/rooms/:id` - Delete room (admin only)
- `POST /api/rooms/:id/check-availability` - Check room availability

### Bookings

- `POST /api/bookings` - Create a new booking (requires auth)
- `GET /api/bookings` - Get user's bookings (requires auth)
- `GET /api/bookings/:id` - Get booking by ID (requires auth)
- `PUT /api/bookings/:id/cancel` - Cancel booking (requires auth)
- `GET /api/bookings/all` - Get all bookings (admin only)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/hotel-booking
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=30d
   CORS_ORIGIN=http://localhost:3000
   ```
4. Start the server
   ```
   npm run dev
   ```

## API Documentation

### Authentication

#### Register User

```
POST /api/auth/register

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-08-15T10:00:00.000Z"
  }
}
```

#### Login User

```
POST /api/auth/login

Request Body:
{
  "email": "john@example.com",
  "password": "123456"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-08-15T10:00:00.000Z"
  }
}
```

### Hotels

#### Create Hotel (Admin Only)

```
POST /api/hotels

Headers:
Authorization: Bearer <token>

Request Body:
{
  "name": "Grand Hotel",
  "description": "Luxury hotel in the heart of the city",
  "location": "New York",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "starRating": 5,
  "amenities": ["WiFi", "Pool", "Spa", "Gym"],
  "images": ["image1.jpg", "image2.jpg"]
}

Response:
{
  "success": true,
  "data": {
    "_id": "60d0fe4f5311236168a109cb",
    "name": "Grand Hotel",
    "description": "Luxury hotel in the heart of the city",
    "location": "New York",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    },
    "starRating": 5,
    "amenities": ["WiFi", "Pool", "Spa", "Gym"],
    "images": ["image1.jpg", "image2.jpg"],
    "createdBy": "60d0fe4f5311236168a109ca",
    "createdAt": "2023-08-15T10:00:00.000Z"
  }
}
```

### Rooms

#### Create Room (Admin Only)

```
POST /api/rooms

Headers:
Authorization: Bearer <token>

Request Body:
{
  "hotelId": "60d0fe4f5311236168a109cb",
  "roomType": "Deluxe",
  "roomNumber": "101",
  "pricePerNight": 150,
  "amenities": ["WiFi", "AC", "TV", "Mini Bar"],
  "maxGuests": 2,
  "description": "Luxurious deluxe room with city view",
  "images": ["room1.jpg", "room2.jpg"]
}

Response:
{
  "success": true,
  "data": {
    "_id": "60d0fe4f5311236168a109cc",
    "hotelId": "60d0fe4f5311236168a109cb",
    "roomType": "Deluxe",
    "roomNumber": "101",
    "pricePerNight": 150,
    "amenities": ["WiFi", "AC", "TV", "Mini Bar"],
    "maxGuests": 2,
    "isAvailable": true,
    "description": "Luxurious deluxe room with city view",
    "images": ["room1.jpg", "room2.jpg"],
    "createdAt": "2023-08-15T10:00:00.000Z"
  }
}
```

### Bookings

#### Create Booking

```
POST /api/bookings

Headers:
Authorization: Bearer <token>

Request Body:
{
  "roomId": "60d0fe4f5311236168a109cc",
  "startDate": "2023-09-01",
  "endDate": "2023-09-05",
  "guestCount": 2,
  "specialRequests": "Late check-in, around 10 PM"
}

Response:
{
  "success": true,
  "data": {
    "_id": "60d0fe4f5311236168a109cd",
    "userId": "60d0fe4f5311236168a109ca",
    "roomId": {
      "_id": "60d0fe4f5311236168a109cc",
      "roomType": "Deluxe",
      "roomNumber": "101",
      "pricePerNight": 150
    },
    "hotelId": {
      "_id": "60d0fe4f5311236168a109cb",
      "name": "Grand Hotel",
      "location": "New York"
    },
    "startDate": "2023-09-01T00:00:00.000Z",
    "endDate": "2023-09-05T00:00:00.000Z",
    "guestCount": 2,
    "status": "confirmed",
    "totalPrice": 600,
    "specialRequests": "Late check-in, around 10 PM",
    "createdAt": "2023-08-15T10:00:00.000Z"
  }
}
```

## License

This project is licensed under the MIT License.
