const express = require('express');
const {
  createHotel,
  getHotels,
  getHotel,
  updateHotel,
  deleteHotel
} = require('../controllers/hotelController');
const protect = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

// Include room router for nested routes
const roomRouter = require('./roomRoutes');

const router = express.Router();

// Re-route into other resource routers
router.use('/:hotelId/rooms', roomRouter);

// Public routes
router.get('/', getHotels);
router.get('/:id', getHotel);

// Protected admin routes
router.use(protect);
router.use(isAdmin);
router.post('/', createHotel);
router.put('/:id', updateHotel);
router.delete('/:id', deleteHotel);

module.exports = router;