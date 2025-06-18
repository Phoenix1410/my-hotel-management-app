const express = require('express');
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validateRequest = require('../middlewares/validateRequest');
const Joi = require('joi');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
    name: Joi.string().trim().max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('user', 'admin').optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/profile', protect, getProfile);

module.exports = router;
