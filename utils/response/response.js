export const responseHandler = (res,statusCode,message,success,data) => {
    return res.status(statusCode).json({
        success,
        message,
        response: data,
    });
}

export const errorApiHandler = (res,statusCode,message,success) => {
    return res.status(statusCode).json({
        success,
        message,
        response: [],
    });
}