const path = require('path');
const express = require('express');
const morgan = require('morgan'); // http request logger middleware
const rateLimit = require('express-rate-limit'); // Use to limit repeated requests to public APIs and/or endpoints such as password reset
const helmet = require('helmet'); // helps secure Express apps by setting HTTP response headers.
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp'); // middleware to protect against HTTP Parameter Pollution attacks
const cookieParser = require('cookie-parser');

const AppError = require('./utilities/appError.js');
const globalErrorHandler = require('./controllers/errorController.js');
const tourRouter = require('./routes/tourRoutes.js');
const userRouter = require('./routes/userRoutes.js');
const reviewRouter = require('./routes/reviewRoutes.js');
const bookingRouter = require('./routes/bookingRoutes.js');
const viewRouter = require('./routes/viewRoutes.js');


const app = express();

// Set template engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// ////////////////////////////////////////////////// //
// //////////// GLOBAL MIDDLEWARES  ////////////////// //

// a) Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// b) Set security http headers
const scriptSrcUrls = [
    "https://unpkg.com",
    "https://cdn.jsdelivr.net",
    "https://tile.openstreetmap.org",
    "https://api.tiles.mapbox.com/",
    "https://cdn.maptiler.com",
    "https://js.stripe.com/v3/"
];
const styleSrcUrls = [
    "https://unpkg.com",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.maptiler.com/"
];
const connectSrcUrls = [
    "https://api.maptiler.com",
    "http://127.0.0.1:3000",
    "ws://localhost:1234",
    "http://localhost:3000"
];
const fontSrcUrls = [
    "https://fonts.gstatic.com"
];
const imgSrcUrls = [
    "https://tile.openstreetmap.org",
    "https://cdn.maptiler.com",
    "https://api.maptiler.com"
];

// 'self' allows resources from the current domain, while 'unsafe-inline' and 'unsafe-eval' permit inline scripts and styles. 
// The domains listed after these keywords are additional sources from which resources can be loaded.

app.use(
    helmet({
        'contentSecurityPolicy':
        {
            directives: {
                defaultSrc: ["'self'"],
                connectSrc: ["'self'", ...connectSrcUrls],
                scriptSrc: ["'unsafe-inline'", "'unsafe-eval'", "'self'", ...scriptSrcUrls],
                styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
                workerSrc: ["'self'", "blob:"],
                objectSrc: [],
                imgSrc: [
                    "'self'",
                    "blob:",
                    "data:",
                    ...imgSrcUrls
                ],
                fontSrc: ["'self'", ...fontSrcUrls],
                frameSrc: ["https://js.stripe.com/v3/"]
            },
        }
    })
);

// c) Development logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// d) Limit requests
const limiter = rateLimit({
    windowMs: 30 * 60 * 1000, // 30 minutes
    limit: 100, // Limit each IP to 100 requests per `window` (here, per 30 minutes).
    message: "Too many requests from this IP, please try again in 30 minutes.",
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    // store: ... , // Redis, Memcached, etc. See below.
});


// e) Apply the rate limiting middleware to all requests to the api.
app.use('/api', limiter)

// f) Body parser. Data from the body is added to the request object
app.use(express.json({ limit: '10kb' }));

// Parse data coming from a 'html form'.
// It parses incoming requests with urlencoded payloads(use in this project to update user data in a 'html form') 
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// g) Cookie parser. Parse data from cookies.
// Parse cookie header and populate req.cookies with an object keyed by the cookie names.
app.use(cookieParser());

// h) Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// i) Protect against HTTP Parameter Pollution attacks
app.use(hpp({
    // allow duplicates in the query string for:
    whitelist: ['duration', 'ratingsAverage', 'ratingsQuantity', 'maxGroupSize']
}));

// Custom middlewares. Apply to every request (it is like a global middleware)
// app.use((req, res, next) => {
//     console.log('Hello from middleware 🏆');
//     next();
// });

// app.use((req, res, next) => {
//     req.requestTime = new Date().toISOString();
//     next();
// });


// ////////////////////////////////////////////////// //
// //////////// ROUTES  ////////////////// //

// A router (tourRouter, userRouter, reviewRouter, etc) behaves like middleware itself, so you can use it as an argument to app.use() or as the argument to another router’s use() method.

// The next routers are middlewares
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// For all Unhandled routes
app.all('*', (req, res, next) => {
    // When passing an argument (usually an error) to the 'next()' function, it will
    // go straight to the Error handling middleware
    next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

// ////////////////////////////////////////////////// //
// //////////// START SERVER  ////////////////// //

module.exports = app;