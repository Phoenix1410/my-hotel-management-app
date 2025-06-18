const Hotel = require('../models/Hotel');

// @desc    Add new hotel
// @route   POST /hotels
// @access  Private/Admin
// Sample request body: { "name": "Grand Hotel", "description": "Luxury hotel", "location": "Delhi", "starRating": 5, "amenities": ["WiFi", "Pool"] }
const createHotel = async (req, res, next) => {
    try {
        const { name, description, location, starRating, amenities, address, phone, email } = req.body;

        const hotel = await Hotel.create({
            name,
            description,
            location,
            starRating,
            amenities: amenities || [],
            address,
            phone,
            email,
            createdBy: req.user.id
        });

        await hotel.populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            message: 'Hotel created successfully',
            data: { hotel }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all hotels with filtering
// @route   GET /hotels?location=delhi&star=3&name=hotel
// @access  Public
const getHotels = async (req, res, next) => {
    try {
        const { location, star, name, page = 1, limit = 10 } = req.query;
        
        // Build query object
        let query = { isActive: true };
        
        if (location) {
            query.location = { $regex: location, $options: 'i' };
        }
        
        if (star) {
            query.starRating = parseInt(star);
        }
        
        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get hotels with pagination
        const hotels = await Hotel.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Hotel.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                hotels,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalHotels: total,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get hotel by ID
// @route   GET /hotels/:id
// @access  Public
const getHotelById = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!hotel || !hotel.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { hotel }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid hotel ID'
            });
        }
        next(error);
    }
};

// @desc    Update hotel
// @route   PUT /hotels/:id
// @access  Private/Admin
const updateHotel = async (req, res, next) => {
    try {
        const { name, description, location, starRating, amenities, address, phone, email } = req.body;

        let hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Update fields
        hotel.name = name || hotel.name;
        hotel.description = description || hotel.description;
        hotel.location = location || hotel.location;
        hotel.starRating = starRating || hotel.starRating;
        hotel.amenities = amenities || hotel.amenities;
        hotel.address = address || hotel.address;
        hotel.phone = phone || hotel.phone;
        hotel.email = email || hotel.email;

        await hotel.save();
        await hotel.populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Hotel updated successfully',
            data: { hotel }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid hotel ID'
            });
        }
        next(error);
    }
};

// @desc    Delete hotel
// @route   DELETE /hotels/:id
// @access  Private/Admin
const deleteHotel = async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);

        if (!hotel) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Soft delete by setting isActive to false
        hotel.isActive = false;
        await hotel.save();

        res.status(200).json({
            success: true,
            message: 'Hotel deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid hotel ID'
            });
        }
        next(error);
    }
};

module.exports = {
    createHotel,
    getHotels,
    getHotelById,
    updateHotel,
    deleteHotel
};
