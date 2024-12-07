module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next)
            .catch(err => next(err))
        // .catch(next(err)) works in the the same way as the line above;
        // next(err) -> Goest to the Error handling middleware (globalErrorHandler)
    }
};