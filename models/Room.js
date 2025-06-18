const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Hotel ID is required']
    },
    roomType: {
        type: String,
        required: [true, 'Room type is required'],
        enum: ['single', 'double', 'suite', 'deluxe', 'premium'],
        trim: true
    },
    pricePerNight: {
        type: Number,
        required: [true, 'Price per night is required'],
        min: [0, 'Price cannot be negative']
    },
    amenities: [{
        type: String,
        trim: true,
        enum: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Room Service', 'Balcony', 'Kitchen', 'Gym Access', 'Pool Access', 'Parking']
    }],
    maxGuests: {
        type: Number,
        required: [true, 'Maximum guests is required'],
        min: [1, 'At least 1 guest must be allowed'],
        max: [10, 'Maximum 10 guests allowed']
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    roomNumber: {
        type: String,
        required: [true, 'Room number is required'],
        trim: true
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot be more than 500 characters']
    },
    images: [{
        type: String,
        trim: true
    }],
    size: {
        type: Number, // in square feet
        min: [0, 'Room size cannot be negative']
    }
}, {
    timestamps: true
});

// Compound index to ensure unique room numbers per hotel
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true });

// Index for search optimization
roomSchema.index({ pricePerNight: 1, roomType: 1, isAvailable: 1 });

module.exports = mongoose.model('Room', roomSchema);
