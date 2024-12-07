const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utilities/catchAsync');
const AppError = require('./../utilities/appError.js');

exports.getOverview = catchAsync(async (req, res, next) => {
    // 1) Get tour data from collection
    const tours = await Tour.find();

    // 2) Build template
    // 3) Render template (overview.pug) with tour data 
    // (overview.pug extends base.pug, so we can specify a value for the title within html-head)
    res
        .status(200)
        .render('overview', {
            title: 'All tours',
            tours: tours
        });
});

exports.getTour = catchAsync(async (req, res, next) => {
    const tour = await Tour
        .findOne({ slug: req.params.tourSlug })
        .populate({ path: 'reviews', fields: 'review rating user' });

    if (!tour) {
        throw new AppError('There is no tour with that name', 404)
    }
    // Render template tour.pug
    res
        .status(200)
        .render('tour', {
            title: tour.name,
            tour: tour
        });
});

exports.getLoginForm = (req, res) => {
    // Render template login.pug
    res
        .status(200)
        .render('login', {
            title: 'Login'
        });
};

exports.getRegisterForm = (req, res) => {
    // Render template register.pug
    res
        .status(200)
        .render('register', {
            title: 'Register'
        });
};

exports.getAccount = (req, res) => {
    // Render template account.pug
    res
        .status(200)
        .render('account', {
            title: 'Your account'
        });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
    // 1. Find all bookings
    const bookings = await Booking.find({ user: req.user.id })

    // 2. Find tours with the returned IDs
    const toursIds = bookings.map(booking => booking.tour);
    const tours = await Tour.find({ _id: { $in: toursIds } });

    // 3. Render template (overview.pug) with tour data 
    // (overview.pug extends base.pug, so we can specify a value for the title within html-head)
    res
        .status(200)
        .render('overview', {
            title: 'My Tours',
            tours: tours
        })
});

exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            // new: true -> get updated document as a result of the operation
            new: true,
            runValidators: true
        });

    // Render template account.pug
    res
        .status(200)
        .render('account', {
            title: 'Your account',
            user: updatedUser
        });
});