export const GlobalErrorHandler = (err, req, res, next) => {
  const errStatus = err.status || res.statusCode || 500;
  const errMsg = err.message || 'Something went wrong';
  res.status(errStatus).json({
      success: false,
      status: errStatus,
      message: errMsg ,
      stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  })
}