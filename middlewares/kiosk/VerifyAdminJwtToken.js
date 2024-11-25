import jwt from "jsonwebtoken"
import { jwtDecode } from "jwt-decode";

export const VerifyAdminJwtToken = (req, res, next) => {
    try {
        const token = req.body.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "UnAuthorized Admin "
            })
        }

        const decoded = jwtDecode(token);
        
        console.log("JWT DECODED TOKEN ",decoded)
        // here decode the token using jwt-decode . after decoding you will get role 

        if(decoded.role === "Admin")
        {
            jwt.verify(
                token,
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
        }

        else{
            jwt.verify(
                token,
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
        }

       

    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}
