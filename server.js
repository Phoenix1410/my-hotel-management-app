const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path'); // <-- ADDED: Required for serving static files
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*', // Allow all origins if not specified
  credentials: true
}));

// Logger middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ==> ADDED: Serve static files from the 'public' directory
// This will serve your index.html, CSS, and JS files for the frontend.
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/hotels', require('./routes/hotelRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// ==> ADDED: API endpoint to provide frontend configuration
// Your frontend will call this to get the Supabase keys securely.
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY
  });
});


// Error handler middleware (should be last of the 'use' calls)
app.use(errorHandler);

// Handle unhandled API routes (sends a 404 for any /api/* route not found)
app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API Route not found: ${req.originalUrl}`
    });
});
  
// ==> MODIFIED: Fallback for Single Page Applications (SPA)
// This will redirect any non-API, non-file request back to your index.html.
// It's essential for client-side routing if you add it later.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
