const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

/**
 * @desc    Create a new booking
 * @route   POST /api/bookings
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Created booking data
 * 
 * @example
 * // Request body
 * {
 *   "roomId": "60d0fe4f5311236168a109ca",
 *   "startDate": "2023-09-01",
 *   "endDate": "2023-09-05",
 *   "guestCount": 2,
 *   "specialRequests": "Late check-in, around 10 PM"
 * }
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { roomId, startDate, endDate, guestCount, specialRequests } = req.body;

    // Check if room exists
    const room = await Room.findById(roomId);
    
    if (!room) {
      res.status(404);
      throw new Error(`Room not found with id of ${roomId}`);
    }

    // Check if room is available for the dates
    const isAvailable = await room.isAvailableForDates(startDate, endDate);
    
    if (!isAvailable) {
      res.status(400);
      throw new Error('Room is not available for the selected dates');
    }

    // Check if guest count is valid
    if (guestCount > room.maxGuests) {
      res.status(400);
      throw new Error(`Room can only accommodate ${room.maxGuests} guests`);
    }

    // Calculate total price
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const totalPrice = diffDays * room.pricePerNight;

    // Create booking
    const booking = await Booking.create({
      userId: req.user.id,
      roomId,
      hotelId: room.hotelId,
      startDate,
      endDate,
      guestCount,
      specialRequests,
      totalPrice,
      status: 'confirmed'
    });

    // Populate booking with room and hotel details
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'roomId',
        select: 'roomType roomNumber pricePerNight'
      })
      .populate({
        path: 'hotelId',
        select: 'name location'
      });

    res.status(201).json({
      success: true,
      data: populatedBooking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings for current user
 * @route   GET /api/bookings
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Array of bookings
 */
exports.getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .populate({
        path: 'roomId',
        select: 'roomType roomNumber pricePerNight'
      })
      .populate({
        path: 'hotelId',
        select: 'name location'
      })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all bookings (admin only)
 * @route   GET /api/bookings/all
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Array of bookings
 */
exports.getAllBookings = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Booking.find(JSON.parse(queryStr))
      .populate({
        path: 'userId',
        select: 'name email'
      })
      .populate({
        path: 'roomId',
        select: 'roomType roomNumber pricePerNight'
      })
      .populate({
        path: 'hotelId',
        select: 'name location'
      });

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Booking.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const bookings = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: bookings.length,
      pagination,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Booking data
 */
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'roomId',
        select: 'roomType roomNumber pricePerNight'
      })
      .populate({
        path: 'hotelId',
        select: 'name location'
      });

    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }

    // Make sure user is booking owner or admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to access this booking`);
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Updated booking data
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      res.status(404);
      throw new Error(`Booking not found with id of ${req.params.id}`);
    }

    // Make sure user is booking owner or admin
    if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to cancel this booking`);
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      res.status(400);
      throw new Error('Booking is already cancelled');
    }

    // Check if booking is in the past
    if (new Date(booking.startDate) < new Date()) {
      res.status(400);
      throw new Error('Cannot cancel a booking that has already started or completed');
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};