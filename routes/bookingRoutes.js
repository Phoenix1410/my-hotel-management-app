const express = require('express');
const {
  createBooking,
  getMyBookings,
  getAllBookings,
  getBooking,
  cancelBooking
} = require('../controllers/bookingController');
const protect = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// User booking routes
router.post('/', createBooking);
router.get('/', getMyBookings);
router.get('/:id', getBooking);
router.put('/:id/cancel', cancelBooking);

// Admin only routes
router.use(isAdmin);
router.get('/all', getAllBookings);

module.exports = router;