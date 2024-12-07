// https://docs.stripe.com/payments/accept-a-payment?platform=web&ui=checkout
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel.js');
const Booking = require('../models/bookingModel.js');
const catchAsync = require('../utilities/catchAsync.js');
const factory = require('./handlerFactory.js');

// test credit card: 5105105105105100
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    // 1. Get currently booked tour
    const bookedTour = await Tour.findById(req.params.tourId)

    // 2. Create checkout session
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        // Add data needed to create a new booking, as a query string.
        // This is a temporary solution, a more secure one can be implemented when the 
        // application is deployed, with Stripe Webhooks.
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${bookedTour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${bookedTour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: `${bookedTour.name} Tour`,
                        // Only in production
                        // images: [`https://www.natours.dev/img/tours/${bookedTour.imageCover}`],
                        // Test
                        images: ['https://images.unsplash.com/photo-1428258777435-0a778e1e3c58?q=80&w=3870&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D']
                    },
                    // in cents
                    unit_amount: bookedTour.price * 100,
                },
                quantity: 1,
            },
        ],
    });

    // 3. Send session
    res.status(200).json({ status: 'success', session: session });
});

// This is a temporary solution (because everyone can make bookings without paying), 
// a more secure one can be implemented when the application is deployed, with Stripe Webhooks.
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
    const { tour, user, price } = req.query;

    if (!tour && !user && !price) {
        return next();
    }

    await Booking.create({ tour: tour, user: user, price: price })

    // redirect to homepage and remove query string
    res.redirect(req.originalUrl.split('?')[0]);
});

exports.getAllBookings = factory.getAll(Booking);

exports.getBooking = factory.getOne(Booking);

exports.createBooking = factory.createOne(Booking);

exports.updateBooking = factory.updateOne(Booking);

exports.deleteBooking = factory.deleteOne(Booking);
