const express = require('express');
const {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  checkRoomAvailability
} = require('../controllers/roomController');
const protect = require('../middlewares/authMiddleware');
const isAdmin = require('../middlewares/isAdmin');

const router = express.Router({ mergeParams: true });

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoom);
router.post('/:id/check-availability', checkRoomAvailability);

// Protected admin routes
router.use(protect);
router.use(isAdmin);
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

module.exports = router;