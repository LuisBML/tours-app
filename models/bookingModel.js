const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'Booking must belong to a Tour']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a User']
    },
    price: {
        type: Number,
        required: [true, 'Booking must have a price']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        // For creating a booking outside of stripe
        type: Boolean,
        default: true
    }
});

////////// QUERY MIDDLEWARE ///////////

// runs before query object(find query - Booking.find...()) is executed
bookingSchema.pre(/^find/, function (next) {
    // 'this' points at the current query object
    this
        .populate('user')
        .populate({
            path: 'tour',
            select: 'name'
        });

    next();
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;