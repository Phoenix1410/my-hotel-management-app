const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Hotel ID is required']
  },
  roomType: {
    type: String,
    required: [true, 'Please specify room type'],
    enum: ['Single', 'Double', 'Deluxe', 'Suite', 'Presidential'],
    trim: true
  },
  roomNumber: {
    type: String,
    required: [true, 'Please add a room number'],
    trim: true
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please add a price per night'],
    min: [0, 'Price must be a positive number']
  },
  amenities: {
    type: [String],
    default: []
  },
  maxGuests: {
    type: Number,
    required: [true, 'Please specify maximum number of guests'],
    min: [1, 'Room must accommodate at least 1 guest']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  images: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bookings of this room
RoomSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'roomId',
  justOne: false
});

// Method to check if room is available for a date range
RoomSchema.methods.isAvailableForDates = async function(startDate, endDate) {
  if (!this.isAvailable) {
    return false;
  }
  
  const Booking = mongoose.model('Booking');
  
  // Convert to Date objects if they're not already
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Find any overlapping bookings
  const bookings = await Booking.find({
    roomId: this._id,
    status: 'confirmed',
    $or: [
      // New booking starts during an existing booking
      { startDate: { $lte: end }, endDate: { $gte: start } },
      // New booking contains an existing booking
      { startDate: { $gte: start, $lte: end } },
      // Existing booking contains new booking
      { startDate: { $lte: start }, endDate: { $gte: end } }
    ]
  });
  
  return bookings.length === 0;
};

module.exports = mongoose.model('Room', RoomSchema);