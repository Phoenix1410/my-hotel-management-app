const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Create new booking
// @route   POST /bookings
// @access  Private
// Sample request body: { "roomId": "64a1b2c3d4e5f6789012", "startDate": "2024-01-15", "endDate": "2024-01-18", "numberOfGuests": 2, "specialRequests": "Late checkout" }
const createBooking = async (req, res, next) => {
    try {
        const { roomId, startDate, endDate, numberOfGuests, specialRequests } = req.body;

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        const now = new Date();

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be in the past'
            });
        }

        if (end <= start) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        // Check if room exists and is available
        const room = await Room.findById(roomId).populate('hotelId');
        if (!room || !room.isAvailable) {
            return res.status(404).json({
                success: false,
                message: 'Room not found or not available'
            });
        }

        // Check if number of guests exceeds room capacity
        if (numberOfGuests > room.maxGuests) {
            return res.status(400).json({
                success: false,
                message: `Room can accommodate maximum ${room.maxGuests} guests`
            });
        }

        // Check for overlapping bookings
        const overlappingBooking = await Booking.findOne({
            roomId,
            status: { $in: ['confirmed'] },
            $or: [
                {
                    startDate: { $lte: start },
                    endDate: { $gt: start }
                },
                {
                    startDate: { $lt: end },
                    endDate: { $gte: end }
                },
                {
                    startDate: { $gte: start },
                    endDate: { $lte: end }
                }
            ]
        });

        if (overlappingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Room is not available for the selected dates'
            });
        }

        // Calculate total price
        const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * room.pricePerNight;

        // Create booking
        const booking = await Booking.create({
            userId: req.user.id,
            roomId,
            hotelId: room.hotelId._id,
            startDate: start,
            endDate: end,
            numberOfGuests,
            specialRequests,
            totalPrice
        });

        await booking.populate([
            { path: 'userId', select: 'name email' },
            { path: 'roomId', select: 'roomType roomNumber pricePerNight' },
            { path: 'hotelId', select: 'name location' }
        ]);

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: { booking }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get user's bookings
// @route   GET /bookings
// @access  Private
const getUserBookings = async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        // Build query object
        let query = { userId: req.user.id };
        
        if (status) {
            query.status = status;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const bookings = await Booking.find(query)
            .populate('roomId', 'roomType roomNumber pricePerNight amenities')
            .populate('hotelId', 'name location starRating address phone')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Booking.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                bookings,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBookings: total,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all bookings (Admin only)
// @route   GET /bookings/all
// @access  Private/Admin
const getAllBookings = async (req, res, next) => {
    try {
        const { status, hotelId, userId, page = 1, limit = 10 } = req.query;
        
        // Build query object
        let query = {};
        
        if (status) {
            query.status = status;
        }
        
        if (hotelId) {
            query.hotelId = hotelId;
        }
        
        if (userId) {
            query.userId = userId;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const bookings = await Booking.find(query)
            .populate('userId', 'name email')
            .populate('roomId', 'roomType roomNumber pricePerNight')
            .populate('hotelId', 'name location starRating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Booking.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                bookings,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalBookings: total,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Cancel booking
// @route   PUT /bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to cancel this booking'
            });
        }

        // Check if booking can be cancelled
        if (booking.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Booking is already cancelled'
            });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel completed booking'
            });
        }

        // Check if booking start date has passed
        if (new Date(booking.startDate) <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel booking that has already started'
            });
        }

        booking.status = 'cancelled';
        booking.paymentStatus = 'refunded';
        await booking.save();

        await booking.populate([
            { path: 'userId', select: 'name email' },
            { path: 'roomId', select: 'roomType roomNumber' },
            { path: 'hotelId', select: 'name location' }
        ]);

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: { booking }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }
        next(error);
    }
};

// @desc    Get booking by ID
// @route   GET /bookings/:id
// @access  Private
const getBookingById = async (req, res, next) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('roomId', 'roomType roomNumber pricePerNight amenities')
            .populate('hotelId', 'name location starRating address phone email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if user owns this booking or is admin
        if (booking.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this booking'
            });
        }

        res.status(200).json({
            success: true,
            data: { booking }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking ID'
            });
        }
        next(error);
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    getAllBookings,
    cancelBooking,
    getBookingById
};
