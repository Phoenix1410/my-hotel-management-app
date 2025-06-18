const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Hotel name is required'],
        trim: true,
        maxlength: [100, 'Hotel name cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Hotel description is required'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    location: {
        type: String,
        required: [true, 'Hotel location is required'],
        trim: true,
        maxlength: [100, 'Location cannot be more than 100 characters']
    },
    starRating: {
        type: Number,
        required: [true, 'Star rating is required'],
        min: [1, 'Star rating must be at least 1'],
        max: [5, 'Star rating cannot be more than 5']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    amenities: [{
        type: String,
        trim: true
    }],
    images: [{
        type: String,
        trim: true
    }],
    address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot be more than 200 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
    },
    email: {
        type: String,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    }
}, {
    timestamps: true
});

// Index for search optimization
hotelSchema.index({ location: 1, starRating: 1 });
hotelSchema.index({ name: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
