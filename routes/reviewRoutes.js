const reviewController = require('./../controllers/reviewController.js');
const authController = require('./../controllers/authController.js');
const express = require('express');

// A 'router' object is an instance of middleware and routes. You can think of it as a “mini-application,” capable only of performing middleware and routing functions. 
// Once you’ve created a router object, you can add middleware and HTTP method routes (such as get, put, post, and so on) to it just like an application.

// mergeParams - to get access to the req.params in the parent router
// in this case the tourRouter, because in tourRoutes.js the review router
// was used/mounted
const router = express.Router({ mergeParams: true });

// These will work:

// POST /tours/23423fd/reviews
// POST /reviews

// GET /tours/23423fd/reviews
// GET /reviews 

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewController.setTourUserIds,
        reviewController.createReview);

router.route('/:id')
    .get(reviewController.getReview)
    .delete(
        authController.restrictTo('user', 'admin'), reviewController.deleteReview)
    .patch(
        authController.restrictTo('user', 'admin'), reviewController.updateReview);


module.exports = router;