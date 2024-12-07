const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel.js');
// const validator = require('validator');

const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name'],
        trim: true,
        unique: true,
        maxlength: [40, 'The name of a tour must have 40 or less characters.'],
        minlength: [10, 'The name of a tour must have 10 or more characters.']
    },
    slug: String,
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size']
    },
    difficulty: {
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum: {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium or difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        // 'set' function runs every time the value on this field changes
        // Math.round(4.777 * 10 -> 47.77) = 48 / 10 = 4.8 
        set: val => Math.round(val * 10) / 10

    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function (value) {
                // 'this' points to current document when creating a new one. Verify it
                return value < this.price;
            },
            message: 'Discount price should be below the regular price'
        }
    },
    summary: {
        type: String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },
    description: {
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a cover image']
    },
    images: [String],
    createdAt: {
        type: Date,
        default: Date.now(),
        select: false
    },
    startDates: [Date],
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        // GeoJSON: in this case an object describing a point on Earth
        // To be recognized as 'GeoJSON' need to provide 'type' and 'coordinates' fields
        type: {
            type: String,
            default: 'Point',
            enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point'],
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }
    ]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});


///////////// INDEXES /////////// 
// Indexes: Indexes support efficient execution of queries in MongoDB. Without indexes, MongoDB must scan every document in a collection to return query results. If an appropriate index exists for a query, MongoDB uses the index to limit the number of documents it must scan. 

// Use cases: If your application is repeatedly running queries on the same fields, you can create an index on those fields to improve performance. 

// -by MongoDB documentation

// 1 and -1 means ascending and descending order respectively
// works as a compound or invidual index
tourSchema.index({ price: 1, ratingsAverage: -1 });

// invidual index
tourSchema.index({ slug: 1 });

// 2dsphere: 2 dimensional sphere index
tourSchema.index({ startLocation: '2dsphere' });

///////////// VIRTUAL PROPERTIES /////////// 

// don't get persisted in the DB
tourSchema.virtual('durationWeeks').get(function () {
    // 'this' points to the current document
    return `Week(s): ${Math.floor(this.duration / 7)}, Days: ${this.duration % 7}`;
});

// Virtual populate
tourSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'tour',
    localField: '_id'
});

/////////// DOCUMENT MIDDLEWARE ///////////

// runs before save() and create()
tourSchema.pre('save', function (next) {
    // 'this' points to the currently processed document
    this.slug = slugify(this.name, { lower: true });
    next();
});

// * Embedding *
// tourSchema.pre('save', async function (next) {
//     // 'this' points to the currently processed document
//     // async functions return a promise
//     const tourGuidesPromises = this.guides.map(async userId => await User.findById(userId));

//     this.guides = await Promise.all(tourGuidesPromises);

//     next();
// })

// runs after all pre middlewares
// tourSchema.post('save', function (doc, next) {
//     console.log(doc);
//     next();
// });

////////// QUERY MIDDLEWARE ///////////

// runs before query object(find query, in this case Tour.find...()) is executed
tourSchema.pre(/^find/, function (next) {
    // add 'start' field
    this.start = Date.now();

    // 'this' points at the current query object
    this.find({ secretTour: { $ne: true } });
    next();
});

// runs before query object(find query, in this case Tour.find...()) is executed
tourSchema.pre(/^find/, function (next) {
    // 'this' points at the current query object
    this.populate({ path: 'guides', select: '-email -_id -__v -passwordChangedAt' });

    next();
});

// runs after query object(find query, in this case Tour.find...()) execution
tourSchema.post(/^find/, function (docs, next) {
    console.log(`Query took ${Date.now() - this.start} ms`);
    next();
});

/////////// AGGREGATION MIDDLEWARE ///////////

// runs before aggregation object is executed
// tourSchema.pre('aggregate', function (next) {
//     // 'this' points to the current aggregation object
//     this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

// const testTour = new Tour({
//     name: 'Hell',
//     rating: 4.7,
//     price: 666
// });

// testTour
//     .save()
//     .then(document => {
//         console.log(document);
//     })
//     .catch(err => { console.log(`⚠️ ${err} ⚠️`) });