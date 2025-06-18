const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
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
    required: [true, 'Please add a check-in date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add a check-out date']
  },
  guestCount: {
    type: Number,
    required: [true, 'Please specify number of guests'],
    min: [1, 'At least 1 guest is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'confirmed'
  },
  totalPrice: {
    type: Number,
    required: [true, 'Please add total price']
  },
  paymentInfo: {
    paymentMethod: {
      type: String,
      default: 'credit_card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    transactionId: String
  },
  specialRequests: {
    type: String,
    maxlength: [500, 'Special requests cannot be more than 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate that end date is after start date
BookingSchema.pre('validate', function(next) {
  if (this.startDate >= this.endDate) {
    this.invalidate('endDate', 'Check-out date must be after check-in date');
  }
  next();
});

// Calculate booking duration in days
BookingSchema.virtual('durationInDays').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('Booking', BookingSchema);