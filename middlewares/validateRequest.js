const Joi = require('joi');

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400);
      throw new Error(error.details.map(detail => detail.message).join(', '));
    }
    
    next();
  };
};

// Common validation schemas
const schemas = {
  // Auth schemas
  userRegister: Joi.object({
    name: Joi.string().required().max(50).trim(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('user', 'admin')
  }),
  
  userLogin: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    name: Joi.string().max(50).trim(),
    email: Joi.string().email()
  }),
  
  updatePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(6)
  }),
  
  // Hotel schemas
  createHotel: Joi.object({
    name: Joi.string().required().max(100).trim(),
    description: Joi.string().required().max(1000),
    location: Joi.string().required().trim(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string().required(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string().required()
    }).required(),
    starRating: Joi.number().required().min(1).max(5),
    amenities: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string())
  }),
  
  // Room schemas
  createRoom: Joi.object({
    hotelId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    roomType: Joi.string().required().valid('Single', 'Double', 'Deluxe', 'Suite', 'Presidential'),
    roomNumber: Joi.string().required().trim(),
    pricePerNight: Joi.number().required().min(0),
    amenities: Joi.array().items(Joi.string()),
    maxGuests: Joi.number().required().min(1),
    isAvailable: Joi.boolean(),
    description: Joi.string().max(500),
    images: Joi.array().items(Joi.string())
  }),
  
  // Booking schemas
  createBooking: Joi.object({
    roomId: Joi.string().required().pattern(/^[0-9a-fA-F]{24}$/),
    startDate: Joi.date().required().greater('now'),
    endDate: Joi.date().required().greater(Joi.ref('startDate')),
    guestCount: Joi.number().required().min(1),
    specialRequests: Joi.string().max(500)
  }),
  
  checkAvailability: Joi.object({
    startDate: Joi.date().required().greater('now'),
    endDate: Joi.date().required().greater(Joi.ref('startDate'))
  })
};

module.exports = {
  validateRequest,
  schemas
};