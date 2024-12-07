const mongoose = require('mongoose');
const Tour = require('./tourModel.js');


const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review content required']
    },
    rating: {
        type: Number,
        required: [true, 'Review rating required'],
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    tour: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tour',
        required: [true, 'Review must belong to a tour']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user']
    }

}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

///////////// INDEXES /////////// 

// Make the combination of tour and user unique (compound index)
// 1 and -1 means ascending and descending order respectively
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

/////////// STATIC METHODS ///////////
reviewSchema.statics.calcAverageRatings = async function (tourId) {
    // 'this' points at the current Model( in this case Review), so this is a good reason to use a static method
    // 1. match: reviews that match tourId
    // 2. group: group by tourId; count and average of ratings
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour',
                numRatings: { $count: {} },
                avgRating: { $avg: '$rating' }
            }
        }
    ]);

    // stats output example:
    // [
    //     {
    //         _id: new ObjectId('66d3fac5ced30121b5c4f744'),
    //         numRatings: 2,
    //         avgRating: 4.5
    //     }
    // ]

    // update stats
    if (stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].numRatings,
            ratingsAverage: stats[0].avgRating
        });
    } else {
        // default values
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }

};

/////////// DOCUMENT MIDDLEWARE ///////////

// runs after save() and create()
reviewSchema.post('save', function () {
    // 'this' points to the currently processed document

    // this.constructor points to the model, in this case Review
    this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.post('save', async function () {
    // 'this' points to the currently processed document

    // this.constructor points to the model, in this case Review
    await this.constructor.calcAverageRatings(this.tour);
});

////////// QUERY MIDDLEWARE ///////////

// runs after query object(find query, Review.findOneAnd...()) is executed
reviewSchema.post(/^findOneAnd/, async function (updated_document) {
    // calculate/recalculate stats after a review is Updated or Deleted

    // updated_document.constructor points to the model, in this case Review
    await updated_document.constructor.calcAverageRatings(updated_document.tour);
});

// runs before query object(find query, Review.find...()) is executed
reviewSchema.pre(/^find/, function (next) {
    // 'this' points at the current query object
    // this.populate({
    //     path: 'tour',
    //     select: 'name -_id'
    // });
    this.populate({
        path: 'user',
        select: 'name photo -_id'
    });

    next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;