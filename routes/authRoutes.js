const express = require('express');
const {
  register,
  login,
  getProfile,
  updateProfile,
  updatePassword
} = require('../controllers/authController');
const protect = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.use(protect); // All routes below this middleware require authentication
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

module.exports = router;