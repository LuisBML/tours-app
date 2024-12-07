const AppError = require("../utilities/appError");

const handleCastErrorDB = errDB => {
    const message = `Invalid ${errDB.path}: ${errDB.value}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = errDB => {
    const message = `Duplicate field value: ${errDB.keyValue.name}`;
    return new AppError(message, 400);
}

const handleValidationErrorDB = errDB => {
    // const outputMsg = [];
    // for (const key in errDB.errors) {
    //     outputMsg.push(errDB.errors[key].message)
    // }
    const errorsDB = Object.values(errDB.errors).map(obj => obj.message);

    const message = `Invalid input data. ${errorsDB.join('. ')}`;

    return new AppError(message, 400);
}

const handleJWTError = () => new AppError('Invalid token. Please login again', 401);

const handleJWTExpiredError = () => new AppError('Token has expired. Please login again', 401);

const sendErrorDev = (err, req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        // API
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Rendered Website
        console.error('Error ⚠️', err)
        res
            .status(err.statusCode)
            .render('errorView', {
                title: 'Something went wrong',
                msg: err.message
            })
    }

}

// For production
const sendErrorProd = (err, req, res) => {
    // API
    if (req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            // Opertaional error: message to client
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });

        }
        // Programming or other unknown error: don't leak details
        console.error('Error ⚠️', err)
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }

    // Rendered Website
    if (err.isOperational) {
        // Opertaional error: message to client
        return res
            .status(err.statusCode)
            .render('errorView', {
                title: 'Something went wrong',
                msg: err.message
            })

    }
    // Programming or other unknown error: don't leak details
    console.error('Error ⚠️', err)
    return res
        .status(err.statusCode)
        .render('errorView', {
            title: 'Something went wrong',
            msg: 'Please try again later'
        })


};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);

    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        error.message = err.message;

        if (error.name = 'CastError') {
            // MongooseError
            error = handleCastErrorDB(error);
        } else if (error.code = 11000) {
            // MongooseError
            error = handleDuplicateFieldsDB(error);
        } else if (error.name = 'ValidationError') {
            // MongooseError
            error = handleValidationErrorDB(error);
        } else if (error.name = 'JsonWebTokenError') {
            // MongooseError
            error = handleJWTError();
        } else if (error.name = 'TokenExpiredError') {
            // MongooseError
            error = handleJWTExpiredError();
        }

        sendErrorProd(error, req, res);
    }
};