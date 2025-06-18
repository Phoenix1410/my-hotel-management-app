const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a hotel name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true
  },
  address: {
    street: String,
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    state: String,
    zipCode: String,
    country: {
      type: String,
      required: [true, 'Please add a country']
    }
  },
  starRating: {
    type: Number,
    required: [true, 'Please add a star rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  amenities: {
    type: [String],
    default: []
  },
  images: {
    type: [String],
    default: []
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for rooms in this hotel
HotelSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hotelId',
  justOne: false
});

// Cascade delete rooms when a hotel is deleted
HotelSchema.pre('remove', async function(next) {
  await this.model('Room').deleteMany({ hotelId: this._id });
  next();
});

module.exports = mongoose.model('Hotel', HotelSchema);