////////// Routes of the web app /////////////////

const express = require('express');
const viewController = require('./../controllers/viewController.js');
const authController = require('../controllers/authController.js');
const bookingController = require('../controllers/bookingController.js');

// A 'router' object is an instance of middleware and routes. You can think of it as a “mini-application,” capable only of performing middleware and routing functions. 
// Once you’ve created a router object, you can add middleware and HTTP method routes (such as get, put, post, and so on) to it just like an application.
const router = express.Router();

// createBookingCheckout(): This is a temporary solution, a more secure one can be implemented when the application is deployed, with Stripe Webhooks.
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);

router.get('/tour/:tourSlug', authController.isLoggedIn, viewController.getTour);

router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

router.get('/register', viewController.getRegisterForm);

router.get('/me', authController.protect, viewController.getAccount);

router.get('/my-tours', authController.protect, viewController.getMyTours);

router.post('/submit-user-data', authController.protect, viewController.updateUserData);

module.exports = router;