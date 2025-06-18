const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required']
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: [true, 'Room ID is required']
    },
    hotelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hotel',
        required: [true, 'Hotel ID is required']
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required'],
        validate: {
            validator: function(value) {
                return value >= new Date();
            },
            message: 'Start date cannot be in the past'
        }
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required'],
        validate: {
            validator: function(value) {
                return value > this.startDate;
            },
            message: 'End date must be after start date'
        }
    },
    status: {
        type: String,
        enum: ['confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    totalPrice: {
        type: Number,
        required: [true, 'Total price is required'],
        min: [0, 'Total price cannot be negative']
    },
    numberOfGuests: {
        type: Number,
        required: [true, 'Number of guests is required'],
        min: [1, 'At least 1 guest required']
    },
    specialRequests: {
        type: String,
        maxlength: [500, 'Special requests cannot be more than 500 characters']
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    bookingReference: {
        type: String,
        unique: true,
        required: true
    }
}, {
    timestamps: true
});

// Generate booking reference before saving
bookingSchema.pre('save', function(next) {
    if (!this.bookingReference) {
        this.bookingReference = 'BK' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();
    }
    next();
});

// Index for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ roomId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
