const User = require('./../models/userModel.js');
const catchAsync = require('./../utilities/catchAsync.js');
const AppError = require('./../utilities/appError.js');
const Email = require('./../utilities/email.js');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { promisify } = require('util');

// const signToken = userId => {
//     return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
//         expiresIn: process.env.JWT_EXPIRES_IN
//     });
// }

// Email uses https://mailtrap.io/, see utilities/email.js

const createSendToken = (user, statusCode, res, sendUser) => {
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        // cookie cannot be accessed or modified by the browser, only store it and send it
        httpOnly: true,
        sameSite: 'none',
        secure: true
    }

    const jsonResData = {
        status: 'success',
        token: token
    }

    if (process.env.NODE_ENV === 'production') {
        // sent cookie only in an ecrypted connection (https)
        cookieOptions.secure = true;
    }

    if (sendUser) {
        // remove password from the output, not DB
        user.password = undefined;

        // Add user to the jsonResData object
        jsonResData.data = { user: user }
    }

    res.cookie('jwt', token, cookieOptions);

    res.status(statusCode).json(jsonResData);
};

exports.signup = catchAsync(async (req, res) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        role: req.body.role
    });

    const url = `${req.protocol}://${req.get('host')}/me`;
    // sendWelcome() returns a promise, await it
    await new Email(newUser, url).sendWelcome();

    createSendToken(newUser, 201, res, true);
});

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // 1. Verify if email and password exists //
    if (!email || !password) {
        throw new AppError('Please provide email and password.', 400);
    }

    // 2. Verify if users exists and password is correct //
    // find document and select/add an extra field to it (because password is hidden by default in the schema)
    const user = await User.findOne({ email: email }).select('+password');

    // using instance method on the user document
    const isCorrectPass = await user?.correctPassword(password);

    if (!user || !isCorrectPass) {
        throw new AppError('Incorrect email or password.', 401);
    }

    // 3. Send token to client //
    createSendToken(user, 200, res, false);
});

exports.logout = (req, res) => {
    const cookieOptions = {
        httpOnly: true,
        sameSite: 'none',
        secure: true
    }

    // build cookie
    // res.cookie('jwt', 'byebye', cookieOptions);

    res.clearCookie('jwt', cookieOptions);

    // send response
    res.status(200).json({ status: 'success' });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
    // 1. Get user by email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        throw new AppError('There is no user with that email address.', 404);
    }

    // 2. Generate random reset token
    const resetToken = user.createPasswordResetToken();

    // save changes made by createPasswordResetToken()
    await user.save({ validateBeforeSave: false });


    // Handle sendPasswordReset()
    try {

        // 3. Send token to user's email
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;

        // sendPasswordReset() returns a promise, await it
        await new Email(user, resetURL).sendPasswordReset();

        res
            .status(200)
            .json({
                status: 'success',
                message: 'Token sent to email'
            })
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        // save changes 
        await user.save({ validateBeforeSave: false });

        return next(new AppError('There was an error sending the email. Try again later.', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res) => {
    // 1. Get user based on token
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');


    // 2. If the token has not yet expired and there is a user, set the new password
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError('Token is invalid or has expired', 400);
    }

    // 3. Updated passwordChangedAt property on user document
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();


    // 4, Log the user in, send JWT
    createSendToken(user, 200, res, false);

});

exports.updatePassword = catchAsync(async (req, res) => {
    // 1. Get user 
    // find document and select/add an extra field to it (because password is hidden when by default in the schema);
    const user = await User.findById(req.user.id).select('+password');

    // 2. Check if password (on req object) is correct
    if (!(await user.correctPassword(req.body.currentPassword))) {
        throw new AppError('Invalid password', 401);
    }

    // 3. Update password
    user.password = req.body.newPassword;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    // 4. Log user in, send JWT
    createSendToken(user, 200, res, false);

});

// ASK FOR ACCESS / AUTHENTICATION MIDDLEWARE
exports.protect = catchAsync(async (req, res, next) => {
    const { authorization } = req.headers;
    let token;

    // 1. Verify if token exists
    if (authorization && authorization.startsWith('Bearer')) {
        token = authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        throw new AppError('Please log in to get access.', 401);
    }

    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const activeUser = await User.findById(decoded.id);
    if (!activeUser) {
        throw new AppError('The user no longer exists.', 401);
    }

    // 4. Check if user changed password after the token was issued

    // using instance method on the user document
    if (activeUser.changedPasswordAfter(decoded.iat)) {
        throw new AppError('User recently changed password. Please log in again', 401);
    }

    // req object travels from middleware to middleware, add active user to it
    req.user = activeUser;

    // Every pug template (every view) have access to res.locals
    res.locals.user = activeUser;

    // Go to next middleware. In other words grant access
    next();
});

// Only for rendered pages, there will be no errors
exports.isLoggedIn = async (req, res, next) => {
    // 1. Verify if token exists
    if (req.cookies.jwt) {
        const token = req.cookies.jwt;

        // 2. Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

        // 3. Check if user still exists
        const activeUser = await User.findById(decoded.id);
        if (!activeUser) {
            return next();
        }

        // 4. Check if user changed password after the token was issued
        // using instance method on the user document
        if (activeUser.changedPasswordAfter(decoded.iat)) {
            return next();
        }

        // 5. There is a logged in user

        // Every pug template (every view) have access to res.locals
        res.locals.user = activeUser;

    }
    // Go to next middleware.
    next();
};

// RESTRICT ACCESS / AUTHORIZATION MIDDLEWARE
exports.restrictTo = (...roles) => {
    // The following function will have access to the roles[], because of the 'closure'
    return (req, res, next) => {
        // req.user === activeUser
        if (!roles.includes(req.user.role)) {
            throw new AppError('You do not have permission to perform this action', 403);
        }

        next();
    };
};