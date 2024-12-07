const userController = require('./../controllers/userController.js');
const authController = require('./../controllers/authController.js');
const express = require('express');

// A 'router' object is an instance of middleware and routes. You can think of it as a “mini-application,” capable only of performing middleware and routing functions. 
// Once you’ve created a router object, you can add middleware and HTTP method routes (such as get, put, post, and so on) to it just like an application.
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// If the previous routes do not match, the next middleware will be executed, protecting all the remaining routes.
router.use(authController.protect);

router.patch('/update-password', authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser);

router.patch('/update-me', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

router.delete('/delete-me', userController.deleteMe);

// Only administrators can access the following/below routes
router.use(authController.restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers);

router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;