const bookingController = require('./../controllers/bookingController.js');
const authController = require('./../controllers/authController.js');
const express = require('express');

// A 'router' object is an instance of middleware and routes. You can think of it as a “mini-application,” capable only of performing middleware and routing functions. 
// Once you’ve created a router object, you can add middleware and HTTP method routes (such as get, put, post, and so on) to it just like an application.

const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);


router.use(authController.restrictTo('lead-guide', 'admin'))

router.route('/')
    .get(bookingController.getAllBookings);
// .post(bookingController.createBooking);

router.route('/:id')
    .get(bookingController.getBooking)
    .delete(bookingController.deleteBooking);
// .patch(bookingController.updateBooking)


module.exports = router;