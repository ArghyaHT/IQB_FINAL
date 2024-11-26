export const SuccessHandler = (successMessage, successStatusCode,  res, data = {}) => {
 
    res.status(successStatusCode).json({
        success: true,
        status: successStatusCode,
        message: successMessage,
        ...data 
    })
}
