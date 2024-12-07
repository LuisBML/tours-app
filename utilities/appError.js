class AppError extends Error {
    constructor(message, statusCode) {
        // Call parent constructor
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        // create .stack property on a target object
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;