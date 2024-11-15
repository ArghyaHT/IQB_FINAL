import jwt from "jsonwebtoken"


// const JWT_REFRESH_SECRET_BARBER = "refreshTokenBarber"


export const verifyBarberRefreshToken = (req, res, next) => {
    try {
        const barbercookie = req.cookies

        console.log(barbercookie)

        if (!barbercookie?.BarberToken) {
            return res.status(401).json({
                success: false,
                message: "UnAuthorized Barber"
            })
        }

        jwt.verify(
            barbercookie?.BarberToken,
            process.env.JWT_BARBER_ACCESS_SECRET,
            async (err, decoded) => {
                if (err) return res.status(403).json({ success: false, message: 'Forbidden Barber' })
                req.email = decoded.email
                req.role = decoded.role
                next()
            }
        )
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}
