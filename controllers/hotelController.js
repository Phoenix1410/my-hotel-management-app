const Hotel = require('../models/Hotel');

/**
 * @desc    Create a new hotel
 * @route   POST /api/hotels
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Created hotel data
 * 
 * @example
 * // Request body
 * {
 *   "name": "Grand Hotel",
 *   "description": "Luxury hotel in the heart of the city",
 *   "location": "New York",
 *   "address": {
 *     "street": "123 Main St",
 *     "city": "New York",
 *     "state": "NY",
 *     "zipCode": "10001",
 *     "country": "USA"
 *   },
 *   "starRating": 5,
 *   "amenities": ["WiFi", "Pool", "Spa", "Gym"],
 *   "images": ["image1.jpg", "image2.jpg"]
 * }
 */
exports.createHotel = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    const hotel = await Hotel.create(req.body);

    res.status(201).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all hotels with filtering
 * @route   GET /api/hotels
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Array of hotels
 * 
 * @example
 * // Query parameters
 * // /api/hotels?location=New York&starRating[gte]=4&sort=name&limit=10&page=1
 */
exports.getHotels = async (req, res, next) => {
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
    let query = Hotel.find(JSON.parse(queryStr));

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
    const total = await Hotel.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Execute query
    const hotels = await query;

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
      count: hotels.length,
      pagination,
      data: hotels
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single hotel
 * @route   GET /api/hotels/:id
 * @access  Public
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Hotel data
 */
exports.getHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate('rooms');

    if (!hotel) {
      res.status(404);
      throw new Error(`Hotel not found with id of ${req.params.id}`);
    }

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update hotel
 * @route   PUT /api/hotels/:id
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Updated hotel data
 */
exports.updateHotel = async (req, res, next) => {
  try {
    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      res.status(404);
      throw new Error(`Hotel not found with id of ${req.params.id}`);
    }

    // Make sure user is hotel owner or admin
    if (hotel.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to update this hotel`);
    }

    hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete hotel
 * @route   DELETE /api/hotels/:id
 * @access  Private/Admin
 * @param   {Object} req - Express request object
 * @param   {Object} res - Express response object
 * @param   {Function} next - Express next function
 * @returns {Object} Success message
 */
exports.deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      res.status(404);
      throw new Error(`Hotel not found with id of ${req.params.id}`);
    }

    // Make sure user is hotel owner or admin
    if (hotel.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      res.status(403);
      throw new Error(`User ${req.user.id} is not authorized to delete this hotel`);
    }

    await hotel.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};