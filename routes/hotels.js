const express = require('express');
const {
    createHotel,
    getHotels,
    getHotelById,
    updateHotel,
    deleteHotel
} = require('../controllers/hotelController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/isAdmin');
const validateRequest = require('../middlewares/validateRequest');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createHotelSchema = Joi.object({
    name: Joi.string().trim().max(100).required(),
    description: Joi.string().max(1000).required(),
    location: Joi.string().trim().max(100).required(),
    starRating: Joi.number().integer().min(1).max(5).required(),
    amenities: Joi.array().items(Joi.string().trim()),
    address: Joi.string().trim().max(200),
    phone: Joi.string().trim().pattern(/^\+?[\d\s\-\(\)]+$/),
    email: Joi.string().email()
});

const updateHotelSchema = Joi.object({
    name: Joi.string().trim().max(100),
    description: Joi.string().max(1000),
    location: Joi.string().trim().max(100),
    starRating: Joi.number().integer().min(1).max(5),
    amenities: Joi.array().items(Joi.string().trim()),
    address: Joi.string().trim().max(200),
    phone: Joi.string().trim().pattern(/^\+?[\d\s\-\(\)]+$/),
    email: Joi.string().email()
});

// Routes
router.post('/', protect, isAdmin, validateRequest(createHotelSchema), createHotel);
router.get('/', getHotels);
router.get('/:id', getHotelById);
router.put('/:id', protect, isAdmin, validateRequest(updateHotelSchema), updateHotel);
router.delete('/:id', protect, isAdmin, deleteHotel);

module.exports = router;
