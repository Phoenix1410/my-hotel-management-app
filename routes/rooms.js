const express = require('express');
const {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/isAdmin');
const validateRequest = require('../middlewares/validateRequest');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const createRoomSchema = Joi.object({
    hotelId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    roomType: Joi.string().valid('single', 'double', 'suite', 'deluxe', 'premium').required(),
    pricePerNight: Joi.number().min(0).required(),
    amenities: Joi.array().items(Joi.string().valid('WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Kitchen', 'Gym Access', 'Pool Access', 'Parking')),
    maxGuests: Joi.number().integer().min(1).max(10).required(),
    roomNumber: Joi.string().trim().required(),
    description: Joi.string().max(500),
    size: Joi.number().min(0)
});

const updateRoomSchema = Joi.object({
    roomType: Joi.string().valid('single', 'double', 'suite', 'deluxe', 'premium'),
    pricePerNight: Joi.number().min(0),
    amenities: Joi.array().items(Joi.string().valid('WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Kitchen', 'Gym Access', 'Pool Access', 'Parking')),
    maxGuests: Joi.number().integer().min(1).max(10),
    roomNumber: Joi.string().trim(),
    description: Joi.string().max(500),
    size: Joi.number().min(0),
    isAvailable: Joi.boolean()
});

// Routes
router.post('/', protect, isAdmin, validateRequest(createRoomSchema), createRoom);
router.get('/', getRooms);
router.get('/:id', getRoomById);
router.put('/:id', protect, isAdmin, validateRequest(updateRoomSchema), updateRoom);
router.delete('/:id', protect, isAdmin, deleteRoom);

module.exports = router;
