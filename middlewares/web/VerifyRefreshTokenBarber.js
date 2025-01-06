import jwt from "jsonwebtoken"
import { jwtDecode } from "jwt-decode";

// const JWT_BARBER_ACCESS_SECRET = "accessTokenBarber"
// const JWT_REFRESH_SECRET_BARBER = "refreshTokenBarber"


// export const verifyRefreshTokenBarber = (req, res, next) => {
//     try {
//         const barbercookie = req.cookies

//         console.log(barbercookie)

//         if (!barbercookie?.BarberToken) {
//             return res.status(401).json({
//                 success: false,
//                 message: "UnAuthorized Barber"
//             })
//         }

//         jwt.verify(
//             barbercookie?.BarberToken,
//             process.env.JWT_BARBER_ACCESS_SECRET,
//             async (err, decoded) => {
//                 if (err) return res.status(403).json({ success: false, message: 'Forbidden Admin' })
//                 req.email = decoded.email
//                 req.role = decoded.role
//                 next()
//             }
//         )
//     }
//     catch (error) {
//         //console.log(error);
//         next(error);
//     }
// }

export const verifyRefreshTokenBarber = (req, res, next) => {
    try {
        // const accessToken = req.body.accessToken;

        // if (!accessToken) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "UnAuthorized Barber"
        //     })
        // }

        // const decoded = jwtDecode(accessToken);


        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Barber: Missing or Invalid Authorization Header',
            });
        }

        // Extract the token from the header
        const accessToken = authHeader.split(' ')[1];

        // console.log("JWT DECODED TOKEN ", decoded)

        jwt.verify(
            accessToken,
            process.env.JWT_BARBER_ACCESS_SECRET,
            async (err, decoded) => {
                if (err) {
                    if (err.name === 'JsonWebTokenError') {
                        // Token is invalid (e.g., malformed, tampered, or expired)
                        return res.status(403).json({ success: false, message: 'Invalid Token' });
                    }
                    if (err.name === 'TokenExpiredError') {
                        // Token is expired
                        return res.status(403).json({ success: false, message: 'Expired Token' });
                    }
                    // Other errors
                    return res.status(500).json({ success: false, message: 'Internal Server Error' });
                }

                // Check for forbidden admin
                if (decoded.role === 'barber') {
                    return res.status(403).json({ success: false, message: 'Forbidden Barber' });
                }

                req.email = decoded.email;
                req.role = decoded.role;
                next();
            }
        );

        // jwt.verify(
        //     barbercookie?.BarberToken,
        //     process.env.JWT_BARBER_ACCESS_SECRET,
        //     async (err, decoded) => {
        //         if (err) return res.status(403).json({ success: false, message: 'Forbidden Admin' })
        //         req.email = decoded.email
        //         req.role = decoded.role
        //         next()
        //     }
        // )
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

