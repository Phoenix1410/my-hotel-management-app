const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

/**
 * @desc    Create a new room
 * @route   POST /api/rooms
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Created room data
 * 
 * @example
 * // Request body
 * {
 *   "hotelId": "60d0fe4f5311236168a109ca",
 *   "roomType": "Deluxe",
 *   "roomNumber": "101",
 *   "pricePerNight": 150,
 *   "amenities": ["WiFi", "AC", "TV", "Mini Bar"],
 *   "maxGuests": 2,
 *   "description": "Luxurious deluxe room with city view",
 *   "images": ["room1.jpg", "room2.jpg"]
 * }
 */
exports.createRoom = async (req, res, next) => {
  try {
    // Check if hotel exists
    const hotel = await Hotel.findById(req.body.hotelId);
    
    if (!hotel) {
      res.status(404);
      throw new Error(`Hotel not found with id of ${req.body.hotelId}`);
    }

    const room = await Room.create(req.body);

    res.status(201).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all rooms with filtering
 * @route   GET /api/rooms
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Array of rooms
 * 
 * @example
 * // Query parameters
 * // /api/rooms?hotelId=60d0fe4f5311236168a109ca&pricePerNight[lte]=200&amenities=WiFi,AC&sort=pricePerNight&limit=10&page=1
 */
exports.getRooms = async (req, res, next) => {
  try {
    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude from filtering
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Handle amenities filter (convert comma-separated to $in operator)
    if (reqQuery.amenities) {
      const amenities = reqQuery.amenities.split(',');
      reqQuery.amenities = { $in: amenities };
    }

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    let query = Room.find(JSON.parse(queryStr)).populate({
      path: 'hotelId',
      select: 'name location starRating'
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
      query = query.sort('pricePerNight');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Room.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const rooms = await query;

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
      count: rooms.length,
      pagination,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single room
 * @route   GET /api/rooms/:id
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Room data
 */
exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate({
      path: 'hotelId',
      select: 'name location starRating'
    });

    if (!room) {
      res.status(404);
      throw new Error(`Room not found with id of ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update room
 * @route   PUT /api/rooms/:id
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Updated room data
 */
exports.updateRoom = async (req, res, next) => {
  try {
    let room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error(`Room not found with id of ${req.params.id}`);
    }

    // If hotelId is being updated, check if new hotel exists
    if (req.body.hotelId && req.body.hotelId !== room.hotelId.toString()) {
      const hotel = await Hotel.findById(req.body.hotelId);
      
      if (!hotel) {
        res.status(404);
        throw new Error(`Hotel not found with id of ${req.body.hotelId}`);
      }
    }

    room = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'hotelId',
      select: 'name location starRating'
    });

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete room
 * @route   DELETE /api/rooms/:id
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Success message
 */
exports.deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      res.status(404);
      throw new Error(`Room not found with id of ${req.params.id}`);
    }

    await room.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check room availability for dates
 * @route   POST /api/rooms/:id/check-availability
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Availability status
 * 
 * @example
 * // Request body
 * {
 *   "startDate": "2023-09-01",
 *   "endDate": "2023-09-05"
 * }
 */
exports.checkRoomAvailability = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      res.status(400);
      throw new Error('Please provide start and end dates');
    }
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      res.status(404);
      throw new Error(`Room not found with id of ${req.params.id}`);
    }
    
    const isAvailable = await room.isAvailableForDates(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: {
        isAvailable
      }
    });
  } catch (error) {
    next(error);
  }
};