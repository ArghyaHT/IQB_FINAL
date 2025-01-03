import jwt from "jsonwebtoken"
import { jwtDecode } from "jwt-decode";

// const JWT_REFRESH_SECRET = "refreshToken"

// export const verifyRefreshTokenAdmin = (req, res, next) => {

//     // // accessToken aschena atar dutoi way ache either user page refresh koreche tai access token uregech or
//     // // refresh token expire kore geche tai access token generate hochena
//     try {
//         const admincookie = req.cookies

//         console.log(admincookie)

//         if (!admincookie?.AdminToken) {
//             return res.status(401).json({
//                 success: false,
//                 message: "UnAuthorized Admin"
//             })
//         }

//         jwt.verify(
//             admincookie?.AdminToken,
//             process.env.JWT_ADMIN_ACCESS_SECRET,
//             async (err, decoded) => {
//                 if (err) return res.status(403).json({success: false, message: 'Forbidden Admin' })

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

export const verifyRefreshTokenAdmin = (req, res, next) => {

    // // accessToken aschena atar dutoi way ache either user page refresh koreche tai access token uregech or
    // // refresh token expire kore geche tai access token generate hochena
    try {
        // const accessToken = req.body.accessToken;

        // if (!accessToken) {
        //     return res.status(401).json({
        //         success: false,
        //         message: "UnAuthorized Admin"
        //     })
        // }

        // const decoded = jwtDecode(accessToken);

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized Admin: Missing or Invalid Authorization Header',
            });
        }

        // Extract the token from the header
        const accessToken = authHeader.split(' ')[1];

        // console.log("JWT DECODED TOKEN ", decoded)
        // here decode the token using jwt-decode . after decoding you will get role 

        jwt.verify(
            accessToken,
            process.env.JWT_ADMIN_ACCESS_SECRET,
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
                if (decoded.role === 'admin') {
                    return res.status(403).json({ success: false, message: 'Forbidden Admin' });
                }

                req.email = decoded.email;
                req.role = decoded.role;
                next();
            }
        );

        // jwt.verify(
        //     admincookie?.AdminToken,
        //     process.env.JWT_ADMIN_ACCESS_SECRET,
        //     async (err, decoded) => {
        //         if (err) return res.status(403).json({success: false, message: 'Forbidden Admin' })

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