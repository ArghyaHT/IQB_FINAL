export const ErrorHandler = (err, req, res, next) => {
    const errStatus = err.statusCode;
    const errMsg = err.message || 'Something went wrong';
    res.status(errStatus).json({
        success: false,
        status: errStatus,
        message: errMsg ,
        stack: process.env.NODE_ENV === 'development' ? err.stack : {}
    })
}
