const express = require('express');
const {
    createBooking,
    getUserBookings,
    getAllBookings,
    cancelBooking,
    getBookingById
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/isAdmin');
const validateRequest = require('../middlewares/validateRequest');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createBookingSchema = Joi.object({
    roomId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    startDate: Joi.date().iso().min('now').required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    numberOfGuests: Joi.number().integer().min(1).required(),
    specialRequests: Joi.string().max(500)
});

// Routes
router.post('/', protect, validateRequest(createBookingSchema), createBooking);
router.get('/', protect, getUserBookings);
router.get('/all', protect, isAdmin, getAllBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
