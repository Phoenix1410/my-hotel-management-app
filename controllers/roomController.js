const Room = require('../models/Room');
const Hotel = require('../models/Hotel');

// @desc    Add room to hotel
// @route   POST /rooms
// @access  Private/Admin
// Sample request body: { "hotelId": "64a1b2c3d4e5f6789012", "roomType": "double", "pricePerNight": 2500, "amenities": ["WiFi", "AC"], "maxGuests": 2, "roomNumber": "101" }
const createRoom = async (req, res, next) => {
    try {
        const { hotelId, roomType, pricePerNight, amenities, maxGuests, roomNumber, description, size } = req.body;

        // Check if hotel exists
        const hotel = await Hotel.findById(hotelId);
        if (!hotel || !hotel.isActive) {
            return res.status(404).json({
                success: false,
                message: 'Hotel not found'
            });
        }

        // Check if room number already exists for this hotel
        const existingRoom = await Room.findOne({ hotelId, roomNumber });
        if (existingRoom) {
            return res.status(400).json({
                success: false,
                message: 'Room number already exists for this hotel'
            });
        }

        const room = await Room.create({
            hotelId,
            roomType,
            pricePerNight,
            amenities: amenities || [],
            maxGuests,
            roomNumber,
            description,
            size
        });

        await room.populate('hotelId', 'name location');

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: { room }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get rooms with filtering
// @route   GET /rooms?hotelId=64a1b2c3d4e5f6789012&priceMin=1000&priceMax=4000&amenities=WiFi,AC
// @access  Public
const getRooms = async (req, res, next) => {
    try {
        const { hotelId, priceMin, priceMax, amenities, roomType, page = 1, limit = 10 } = req.query;
        
        // Build query object
        let query = { isAvailable: true };
        
        if (hotelId) {
            query.hotelId = hotelId;
        }
        
        if (priceMin || priceMax) {
            query.pricePerNight = {};
            if (priceMin) query.pricePerNight.$gte = parseInt(priceMin);
            if (priceMax) query.pricePerNight.$lte = parseInt(priceMax);
        }
        
        if (amenities) {
            const amenitiesList = amenities.split(',').map(a => a.trim());
            query.amenities = { $in: amenitiesList };
        }
        
        if (roomType) {
            query.roomType = roomType;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get rooms with pagination
        const rooms = await Room.find(query)
            .populate('hotelId', 'name location starRating')
            .sort({ pricePerNight: 1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const total = await Room.countDocuments(query);
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                rooms,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalRooms: total,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get room by ID
// @route   GET /rooms/:id
// @access  Public
const getRoomById = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id)
            .populate('hotelId', 'name location starRating address phone email');

        if (!room || !room.isAvailable) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { room }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID'
            });
        }
        next(error);
    }
};

// @desc    Update room
// @route   PUT /rooms/:id
// @access  Private/Admin
const updateRoom = async (req, res, next) => {
    try {
        const { roomType, pricePerNight, amenities, maxGuests, roomNumber, description, size, isAvailable } = req.body;

        let room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if room number is being changed and if it already exists
        if (roomNumber && roomNumber !== room.roomNumber) {
            const existingRoom = await Room.findOne({ 
                hotelId: room.hotelId, 
                roomNumber,
                _id: { $ne: room._id }
            });
            if (existingRoom) {
                return res.status(400).json({
                    success: false,
                    message: 'Room number already exists for this hotel'
                });
            }
        }

        // Update fields
        room.roomType = roomType || room.roomType;
        room.pricePerNight = pricePerNight !== undefined ? pricePerNight : room.pricePerNight;
        room.amenities = amenities || room.amenities;
        room.maxGuests = maxGuests || room.maxGuests;
        room.roomNumber = roomNumber || room.roomNumber;
        room.description = description || room.description;
        room.size = size !== undefined ? size : room.size;
        room.isAvailable = isAvailable !== undefined ? isAvailable : room.isAvailable;

        await room.save();
        await room.populate('hotelId', 'name location starRating');

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: { room }
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID'
            });
        }
        next(error);
    }
};

// @desc    Delete room
// @route   DELETE /rooms/:id
// @access  Private/Admin
const deleteRoom = async (req, res, next) => {
    try {
        const room = await Room.findById(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Soft delete by setting isAvailable to false
        room.isAvailable = false;
        await room.save();

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid room ID'
            });
        }
        next(error);
    }
};

module.exports = {
    createRoom,
    getRooms,
    getRoomById,
    updateRoom,
    deleteRoom
};
