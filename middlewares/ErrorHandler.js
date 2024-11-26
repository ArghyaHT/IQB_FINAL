export const ErrorHandler = (errMessage, errStatusCode, res) => {
 
    res.status(errStatusCode).json({
        success: false,
        status: errStatusCode,
        message: errMessage 
    })
}
