import { adminAddNewBarberService, adminCreateBarber, adminUpdateBarber, updateBarberServices, barberClockInStatus, barberCode, barberOnlineStatus, changeBarberStatus, connectBarberSalon, createBarber, createBarberId, createGoogleBarber, deleteBarberProPic, deletedBarber, fetchedBarbers, findBarberByEmailAndRole, findBarberProfileById, getBarberByBarberId, getBarbersByServiceId, googleLoginBarber, resetBarberPassword, totalBarberCount, updateBarber, updateBarberProPic, uploadBarberProPic } from "../../../services/web/barber/barberService.js";
import { createBarberFcmToken } from "../../../services/web/userTokenRegister/userTokenRegister.js";
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import bcrypt from "bcrypt";
import libphonenumber from 'google-libphonenumber';

import { barberLogin, emailWithNodeMail, sendVerificationCode } from "../../../utils/emailSender/emailSender.js";

//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { getAverageBarberRating } from "../../../services/web/ratings/ratingsService.js";
import { validateEmail } from "../../../middlewares/validator.js";
import { allSalonServices, checkSalonExists, getSalonBySalonId } from "../../../services/web/admin/salonService.js";
import { v4 as uuidv4 } from 'uuid';
import { qListByBarberId } from "../../../services/web/queue/joinQueueService.js";
import { barberLogInTime, barberLogOutTime } from "../../../utils/attendence/barberAttendence.js";
import { sendMobileVerificationCode } from "../../../utils/mobileMessageSender/mobileMessageSender.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, EMAIL_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR, EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, EMAIL_VERIFIED_SUCCESS, EMAIL_VERIFY_CODE_ERROR, FILL_ALL_FIELDS_ERROR, FORGET_PASSWORD_SUCCESS, FORGOT_PASSWORD_EMAIL_ERROR, IMAGE_EMPTY_ERROR, IMAGE_FILE_EXTENSION_ERROR, IMAGE_FILE_SIZE_ERROR, IMAGE_UPLOAD_SUCCESS, INCORRECT_OLD_PASSWORD_ERROR, INVALID_EMAIL_ERROR, MOBILE_NUMBER_ERROR, MOBILE_VERIFIED_SUCCESS, MOBILE_VERIFY_CODE_ERROR, NAME_LENGTH_ERROR, NEW_PASSWORD_ERROR, OLD_AND_NEW_PASSWORD_DONOT_MATCH, OLD_PASSWORD_ERROR, PASSWORD_LENGTH_ERROR, PASSWORD_NOT_PRESENT_ERROR, RESET_PASSWORD_SUCCESS, SEND_VERIFICATION_EMAIL_SUCCESS, SEND_VERIFICATION_MOBILE_SUCCESS, VERIFICATION_EMAIL_ERROR } from "../../../constants/web/adminConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { BARBER_CLOCKIN_ERROR, BARBER_CLOCKIN_SUCCESS, BARBER_CLOCKOUT_SUCCESS, BARBER_CONNECT_SALON_SUCCESS, BARBER_DETAILS_SUCCESS, BARBER_EXISTS_ERROR, BARBER_NOT_APPROVE_ERROR, BARBER_NOT_EXIST_ERROR, BARBER_SERVICES_SUCCESS, CHANGE_BARBER_ONLINE_SUCCESS, CHANGE_PASSWORD_SUCCESS, CREATE_BARBER_SUCCESS, CUSTOMERS_IN_QUEUE_ERROR, EMPTY_SERVICE_ERROR, GET_ALL_BARBER_SUCCESS, LOGOUT_SUCCESS, NO_BARBER_SERVICEID_ERROR, NO_BARBERS_ERROR, SELECT_SERVICE_ERROR, SIGNIN_SUCCESS, SIGNUP_SUCCESS, UPDATE_BARBER_SUCCESS } from "../../../constants/web/BarberConstants.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ALLOWED_IMAGE_EXTENSIONS, BARBER_IMAGE_EMPTY_ERROR, IMAGE_FAILED_DELETE, MAX_FILE_SIZE } from "../../../constants/web/Common/ImageConstant.js";
import { SALON_EXISTS_ERROR, SALON_NOT_CREATED_ERROR, SALON_NOT_FOUND_ERROR, SALON_SERVICES_RETRIEVED_SUCESS } from "../../../constants/web/SalonConstants.js";
import { NO_SALON_CONNECTED_ERROR } from "../../../constants/web/QueueConstants.js";


// Desc: Register
export const registerController = async (req, res, next) => {
    try {
        let { email, password } = req.body

        if (!email && !password) {
            return ErrorHandler(EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!password) {
            return ErrorHandler(PASSWORD_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (password.length < 8) {
            return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const existingUser = await findBarberByEmailAndRole(email)

        if (existingUser) {
            return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
        }

        const barberId = await createBarberId();

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await createBarber(email, hashedPassword, barberId)

        return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })
    } catch (error) {
        next(error);
    }
}

// Desc: Login
export const loginController = async (req, res, next) => {
    try {
        let email = req.body.email;
        const password = req.body.password;
        const { webFcmToken, androidFcmToken, iosFcmToken } = req.body;

        if (!email && !password) {
            return ErrorHandler(EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!password) {
            return ErrorHandler(PASSWORD_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (password.length < 8) {
            return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        // Find user by email in the MongoDB database
        const foundUser = await findBarberByEmailAndRole(email);

        if (!foundUser) {
            return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
        }

        const match = await bcrypt.compare(password, foundUser.password)

        if (!match) {
            return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
        }

        // // Save FCM Tokens based on the switch-case logic
        let tokenType, tokenValue;
        if (webFcmToken) {
            tokenType = 'webFcmToken';
            tokenValue = webFcmToken;
        } else if (androidFcmToken) {
            tokenType = 'androidFcmToken';
            tokenValue = androidFcmToken;
        } else if (iosFcmToken) {
            tokenType = 'iosFcmToken';
            tokenValue = iosFcmToken;
        }

        if (tokenType && tokenValue) {
            await createBarberFcmToken(email, tokenType, tokenValue)
        }
        const accessToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '7d' }
        )

        // res.cookie('BarberToken', accessToken, {
        //     httpOnly: true, //accessible only by web server 
        //     secure: true, //https
        //     sameSite: 'None', //cross-site cookie 
        //     maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        // })

        return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            foundUser
        })
    } catch (error) {
        next(error);
    }
};

// Desc: Barber Logout
export const handleLogout = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if (!cookies?.BarberToken) return res.status(404).json({
            success: false,
            message: "Unauthorize Barber"
        })

        res.clearCookie('BarberToken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true
        })
        return SuccessHandler(LOGOUT_SUCCESS, SUCCESS_STATUS_CODE, res)
    } catch (error) {
        next(error);
    }
}

// // Desc: Google Signup
// export const googleBarberSignup = async (req, res, next) => {
//     try {
//         const CLIENT_ID = process.env.CLIENT_ID

//         const token = req.query.token;
//         const { webFcmToken, androidFcmToken, iosFcmToken } = req.query;

//         if (!token) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Barber token not found"
//             })
//         }

//         const client = new OAuth2Client(CLIENT_ID);

//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID,
//         });

//         const payload = ticket.getPayload();

//         const existingUser = await findBarberByEmailAndRole(payload.email)

//         if (existingUser) {
//             return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
//         }


//         const barberId = await createBarberId();
//         const firstTwoLetters = payload.name.slice(0, 2).toUpperCase();
//         const barberCode = firstTwoLetters + barberId;

//         // Create a new user
//         const newUser = await createGoogleBarber(payload.email, barberId, barberCode)


//         //   let tokenType, tokenValue;
//         //   if (webFcmToken) {
//         //     tokenType = 'webFcmToken';
//         //     tokenValue = webFcmToken;
//         //   } else if (androidFcmToken) {
//         //     tokenType = 'androidFcmToken';
//         //     tokenValue = androidFcmToken;
//         //   } else if (iosFcmToken) {
//         //     tokenType = 'iosFcmToken';
//         //     tokenValue = iosFcmToken;
//         //   }

//         //   if (tokenType && tokenValue) {
//         //     await UserTokenTable.findOneAndUpdate(
//         //       { email: payload.email },
//         //       { [tokenType]: tokenValue, type: "barber" },
//         //       { upsert: true, new: true }
//         //     );
//         //   }

//         return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })
//     }
//     catch (error) {
//         next(error);
//     }
// }

// // Desc: Google Signin
// export const googleBarberLogin = async (req, res, next) => {
//     try {
//         const CLIENT_ID = process.env.CLIENT_ID

//         const token = req.query.token;
//         const { webFcmToken, androidFcmToken, iosFcmToken } = req.query;

//         if (!token) {
//             return res.status(404).json({ success: false, message: "Barber token not found" })
//         }

//         const client = new OAuth2Client(CLIENT_ID);

//         // Call the verifyIdToken to
//         // varify and decode it
//         const ticket = await client.verifyIdToken({
//             idToken: token,
//             audience: CLIENT_ID,
//         });

//         // Get the JSON with all the user info
//         const payload = ticket.getPayload();

//         const foundUser = await googleLoginBarber(payload.email)

//         if (!foundUser) {
//             return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
//         }

//         const accessToken = jwt.sign(
//             {

//                 "email": foundUser.email,
//                 "role": foundUser.role,
//             },
//             process.env.JWT_BARBER_ACCESS_SECRET,
//             { expiresIn: '1d' }
//         )

//         let tokenType, tokenValue;
//         if (webFcmToken) {
//             tokenType = 'webFcmToken';
//             tokenValue = webFcmToken;
//         } else if (androidFcmToken) {
//             tokenType = 'androidFcmToken';
//             tokenValue = androidFcmToken;
//         } else if (iosFcmToken) {
//             tokenType = 'iosFcmToken';
//             tokenValue = iosFcmToken;
//         }

//         if (tokenType && tokenValue) {
//             await createBarberFcmToken(email, tokenType, tokenValue)
//         }

//         // Create secure cookie with refresh token 
//         res.cookie('BarberToken', accessToken, {
//             httpOnly: true, //accessible only by web server 
//             secure: true, //https
//             sameSite: 'None', //cross-site cookie 
//             maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
//         })

//         return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
//             accessToken,
//             foundUser
//         })
//     } catch (error) {
//         next(error);
//     }
// }


// Desc: Google Signup
export const googleBarberSignup = async (req, res, next) => {
    try {
        const email = req.body.email

        const existingUser = await findBarberByEmailAndRole(email)

        if (existingUser) {
            return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
        }


        const barberId = await createBarberId();
        // const firstTwoLetters = payload.name.slice(0, 2).toUpperCase();
        // const barberCode = firstTwoLetters + barberId;

        // Create a new user
        const newUser = await createGoogleBarber(email, barberId)


        //   let tokenType, tokenValue;
        //   if (webFcmToken) {
        //     tokenType = 'webFcmToken';
        //     tokenValue = webFcmToken;
        //   } else if (androidFcmToken) {
        //     tokenType = 'androidFcmToken';
        //     tokenValue = androidFcmToken;
        //   } else if (iosFcmToken) {
        //     tokenType = 'iosFcmToken';
        //     tokenValue = iosFcmToken;
        //   }

        //   if (tokenType && tokenValue) {
        //     await UserTokenTable.findOneAndUpdate(
        //       { email: payload.email },
        //       { [tokenType]: tokenValue, type: "barber" },
        //       { upsert: true, new: true }
        //     );
        //   }

        return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })
    }
    catch (error) {
        next(error);
    }
}

// Desc: Google Signin
export const googleBarberLogin = async (req, res, next) => {
    try {
        const email = req.body.email

        const foundUser = await googleLoginBarber(email)

        if (!foundUser) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const accessToken = jwt.sign(
            {

                "email": foundUser.email,
                "role": foundUser.role,
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '7d' }
        )

        // let tokenType, tokenValue;
        // if (webFcmToken) {
        //     tokenType = 'webFcmToken';
        //     tokenValue = webFcmToken;
        // } else if (androidFcmToken) {
        //     tokenType = 'androidFcmToken';
        //     tokenValue = androidFcmToken;
        // } else if (iosFcmToken) {
        //     tokenType = 'iosFcmToken';
        //     tokenValue = iosFcmToken;
        // }

        // if (tokenType && tokenValue) {
        //     await createBarberFcmToken(email, tokenType, tokenValue)
        // }

        // Create secure cookie with refresh token 
        res.cookie('BarberToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            foundUser
        })
    } catch (error) {
        next(error);
    }
}

export const updateBarberInfo = async (req, res, next) => {
    try {
        let { email, name, countryCode, mobileNumber, gender, dateOfBirth } = req.body

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        if (name && (name.length < 1 || name.length > 20)) {
            return ErrorHandler(NAME_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        let formattedNumberAsNumber = null;

        // Proceed with mobile number validation if provided
        if (mobileNumber) {
            // Convert mobile number to string only if it's a number
            let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

            const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

            const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

            // Parse the mobile number, specifying the region code
            const phoneNumberProto = phoneUtil.parse(mobileNumberStr, regionCode);

            // Check if the parsed phone number is valid
            const isValid = phoneUtil.isValidNumber(phoneNumberProto);

            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Mobile Number"
                });
            }

            // Get the national significant number (i.e., without the country code)
            const nationalNumber = phoneNumberProto.getNationalNumber();

            // Convert formatted number back to a number for storage
            formattedNumberAsNumber = parseInt(nationalNumber);
        }

        // Check if the provided email and password match any existing admin
        const foundUser = await findBarberByEmailAndRole(email)

        if (!foundUser) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }


        // Update user information
        foundUser.name = name
        foundUser.mobileNumber = formattedNumberAsNumber
        foundUser.gender = gender
        foundUser.mobileCountryCode = countryCode
        foundUser.dateOfBirth = dateOfBirth

        const updatedBarber = await foundUser.save()

        const accessToken = jwt.sign(
            {
                "email": email,
                "role": foundUser.role,
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '7d' }
        )

        // res.cookie('BarberToken', accessToken, {
        //     httpOnly: true, //accessible only by web server 
        //     secure: true, //https
        //     sameSite: 'None', //cross-site cookie 
        //     maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        // })


        return SuccessHandler(UPDATE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            updatedBarber
        })
    } catch (error) {
        next(error);
    }
}

export const handleForgetPassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }



        const user = await findBarberByEmailAndRole(email)

        if (!user) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }


        if (user.AuthType === "google") {
            return res.status(400).json({
                success: false,
                message: 'Password cant be changed as you are logged in with google'
            })
        }

        //get ResetPassword Token
        const resetToken = user.getResetPasswordToken()

        await user.save({ validatebeforeSave: false })

        try {
            await emailWithNodeMail(email, user.name, process.env.FORGET_PASSWORD_CLIENT_URL, "barberchangepassword", resetToken)
        } catch (error) {
            return ErrorHandler(FORGOT_PASSWORD_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(FORGET_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { payload: { resetToken } })
    } catch (error) {
        next(error);
    }
}

// Desc: Reset Password
export const handleResetPassword = async (req, res, next) => {
    try {
        //creating token hash
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

        const user = await resetBarberPassword(resetPasswordToken)

        if (!user) {
            res.status(404).json({
                success: false,
                message: "Please try again. Reset password token already expired."
            })
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save()

        return SuccessHandler(RESET_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}

//DESC:CREATE BARBER BY ADMIN ======================
export const createBarberByAdmin = async (req, res, next) => {
    try {
        let {
            email,
            name,
            nickName,
            countryCode,
            mobileNumber,
            salonId,
            dateOfBirth,
            webFcmToken,
            barberExp,
            barberServices
        } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }


        if (name && (name.length < 1 || name.length > 20)) {
            return ErrorHandler(NAME_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        if (barberServices.length === 0) {
            return ErrorHandler(EMPTY_SERVICE_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        // Parse the mobile number, specifying the region code
        const phoneNumberProto = phoneUtil.parse(mobileNumberStr, regionCode);

        // Check if the parsed phone number is valid
        const isValid = phoneUtil.isValidNumber(phoneNumberProto);

        if (!isValid) {
            return ErrorHandler(MOBILE_NUMBER_ERROR, ERROR_STATUS_CODE, res)
        }

        // Get the national significant number (i.e., without the country code)
        const nationalNumber = phoneNumberProto.getNationalNumber();

        // Convert formatted number back to a number for storage
        const formattedNumberAsNumber = parseInt(nationalNumber);


        // Check if the barber with the provided email already exists
        const barber = await findBarberByEmailAndRole(email);

        if (barber) {
            return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res)
        }

        //Creating the random Password of ^ digit
        const randomPassword = Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;
        const randomString = randomPassword.toString();

        // Hashing the password
        const hashedPassword = await bcrypt.hash(randomString, 10);

        // Creating the barberId and barberCode
        const barberId = await createBarberId();
        const firstTwoLetters = name.slice(0, 2).toUpperCase();
        const barberCode = firstTwoLetters + barberId;

        // Save the new barber to the database
        const savedBarber = await adminCreateBarber(email, hashedPassword, name, nickName, salonId, countryCode, formattedNumberAsNumber, dateOfBirth, barberCode, barberId, barberExp, barberServices);

        //   // Save FCM Tokens based on the switch-case logic
        //   let tokenType, tokenValue;
        //   switch (true) {
        //       case !!webFcmToken:
        //           tokenType = 'webFcmToken';
        //           tokenValue = webFcmToken;
        //           break;
        //       case !!androidFcmToken:
        //           tokenType = 'androidFcmToken';
        //           tokenValue = androidFcmToken;
        //           break;
        //       case !!iosFcmToken:
        //           tokenType = 'iosFcmToken';
        //           tokenValue = iosFcmToken;
        //           break;
        //       default:
        //           return res.status(201).json({
        //               success: false,
        //               message: "No valid FCM tokens present"
        //           })

        //   }

        //   if (tokenType && tokenValue) {
        //       await createBarberFcmToken(email, tokenType, tokenValue)
        //   }

        const salonDetails = await getSalonBySalonId(salonId);
        const barberLoginSubject = `${salonDetails.salonName}-Your login credentials`;
        const servedEmailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You have been served!</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
    
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f8f8;
                    border-radius: 10px;
                }
                .header {
                    text-align: center;
                    color: #333;
                    margin-bottom: 20px;
                }
                .details {
                    margin-bottom: 20px;
                }
                .details ul {
                    list-style-type: none;
                    padding: 0;
                }
                .details li {
                    margin-bottom: 5px;
                }
                .visit {
                    text-align: center;
                    margin-top: 20px;
                    font-weight: bold;
                    color: #007bff;
                    font-size: 20px;
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
               .logo img {
                                    max-width: 200px;
                                    border-radius: 50%; /* Makes the shape circular */
                                    width: 200px; /* Ensure the width and height are equal */
                                    height: 200px; /* Ensure the width and height are equal */
                                    object-fit: cover; /* Ensures the image fits nicely within the circular shape */
                                    }
                .visit {
                text-align: center;
                margin-top: 20px;
                font-weight: bold;
                color: #007bff;
                font-size: 20px;
            }
            </style>
        </head>
        <body>
        
            <div class="container">
                <div class="logo">
                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                </div>
                <h1 class="header">Your Login Credentials</h1>
                <div class="details">
                    <p>Dear Barber,</p>
                    <p>Your auto-generated random password is provided below. Please log in with this password and reset it upon login.</p>
                    <ul>
                        <li>Salon Name: ${salonDetails.salonName}</li>
                        <li>Email: ${email}</li>
                        <li>Password: ${randomPassword}</li>
                    </ul>
                </div>
                <div class="visit">
                    <p><a href="https://iqb-final.onrender.com//barbersignin?email=${encodeURIComponent(email)}">Click here to log in</a></p>
                </div>
                <p>Please feel free to contact us if you need further assistance.</p>
                <p>Best regards,<br>
                ${salonDetails.salonName}<br>
                Contact No.: ${salonDetails.contactTel}<br>
                Email: ${salonDetails.salonEmail}</p>
            </div>
        </body>
        </html>
    `;

        // Send email to the customer who is getting served
        try {
            await barberLogin(email, barberLoginSubject, servedEmailBody);
            // console.log('Email sent to barber successfully.');
        } catch (error) {
            console.error('Error sending email to the served customer:', error);
            // Handle error if email sending fails
        }

        return SuccessHandler(CREATE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: savedBarber })

    } catch (error) {
        next(error);
    }
};

//DESC:UPDATE BARBER BY ADMIN =====================
export const updateBarberByAdmin = async (req, res, next) => {
    try {
        let { email, name, nickName, salonId, countryCode, mobileNumber, dateOfBirth, barberServices } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }


        if (name && (name.length < 1 || name.length > 20)) {
            return ErrorHandler(NAME_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        if (barberServices.length === 0) {
            return ErrorHandler(SELECT_SERVICE_ERROR, ERROR_STATUS_CODE, res)
        }

        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        // Parse the mobile number, specifying the region code
        const phoneNumberProto = phoneUtil.parse(mobileNumberStr, regionCode);

        // Check if the parsed phone number is valid
        const isValid = phoneUtil.isValidNumber(phoneNumberProto);

        if (!isValid) {
            return ErrorHandler(MOBILE_NUMBER_ERROR, ERROR_STATUS_CODE, res)
        }

        // Get the national significant number (i.e., without the country code)
        const nationalNumber = phoneNumberProto.getNationalNumber();

        // Convert formatted number back to a number for storage
        const formattedNumberAsNumber = parseInt(nationalNumber);


        //If barberServices is present for updating
        if (barberServices && barberServices.length > 0) {
            //Update the services accordingly
            for (const service of barberServices) {
                const { serviceId, serviceName, serviceIcon, serviceCode, servicePrice, vipService, barberServiceEWT } = service;

                const updateService = await updateBarberServices(email, salonId, serviceId, serviceIcon, serviceName, serviceCode, servicePrice, vipService, barberServiceEWT);

                // If BarberServices Not Present
                if (!updateService) {
                    const newService = {
                        serviceId,
                        serviceCode,
                        serviceName,
                        servicePrice,
                        serviceIcon,
                        vipService,
                        barberServiceEWT: barberServiceEWT
                    };
                    await adminAddNewBarberService(email, salonId, newService)
                }
            }
        }

        const updatedBarber = await adminUpdateBarber(email, name, nickName, countryCode, formattedNumberAsNumber, dateOfBirth, barberServices);

        if (!updatedBarber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(UPDATE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedBarber })
    }
    catch (error) {
        next(error);
    }

}


// Desc: Upload Barber Profile Pic
// export const uploadBarberprofilePic = async (req, res, next) => {
//     try {
//         let profiles = req.files.profile;
//         let email = req.body.email;

//         if (!email) {
//             return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
//         }

//         if (!profiles) {
//             return ErrorHandler(IMAGE_EMPTY_ERROR, ERROR_STATUS_CODE, res)
//         }

//         // Ensure profiles is an array for single or multiple uploads
//         if (!Array.isArray(profiles)) {
//             profiles = [profiles];
//         }

//         // Allowed file extensions and maximum file size (2MB)
//         const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
//         const maxFileSize = MAX_FILE_SIZE;

//         // Find the existing barber by email
//         const existingBarber = await findBarberByEmailAndRole(email);

// // Validate files before uploading
// for (let profile of profiles) {
//     const extension = path.extname(profile.name).toLowerCase().slice(1);

//     if (!allowedExtensions.includes(extension)) {
//         return res.status(400).json({ success: false, message: "Invalid file extension. Allowed extensions are jpg, png, jfif, svg, jpeg, webp." });
//     }

//     if (profile.size > maxFileSize) {
//         return res.status(400).json({ success: false, message: "File size must be lower than 2MB." });
//     }
// }

//         // Delete the existing profile picture if it exists
//         if (existingBarber && existingBarber.profile && Array.isArray(existingBarber.profile) && existingBarber.profile.length > 0) {
//             const oldProfile = existingBarber.profile[0];
//             if (oldProfile && oldProfile.public_id) {
//                 try {
//                     const result = await cloudinary.uploader.destroy(oldProfile.public_id);

//                     if (result.result !== 'ok') {
//                         return res.status(400).json({ success: false, message: 'Failed to delete old image.' });
//                     }
//                 } catch (err) {
//                     return res.status(500).json({ success: false, message: 'Failed to delete old image.', error: err.message });
//                 }
//             } else {
//                 console.log('No valid profile picture found or missing public_id for deletion');
//             }
//         } else {
//             console.log('No existing profile picture or profile array is empty');
//         }

//         // Upload new profile image(s) to Cloudinary
//         const uploadPromises = profiles.map(profile => {
//             const public_id = `${profile.name.split('.')[0]}_${uuidv4()}`;
//             const folderPath = `barbers`;

//             return cloudinary.uploader.upload(profile.tempFilePath, {
//                 public_id,
//                 folder: folderPath,
//             }).then(image => {
//                 // Delete the temporary file after uploading
//                 fs.unlink(profile.tempFilePath, err => {
//                     if (err) console.error('Failed to delete temporary file:', err);
//                 });
//                 return { public_id: image.public_id, url: image.secure_url };
//             });
//         });

//         const profileImg = await Promise.all(uploadPromises);

//         // Update the barber profile picture in the database
//         const barberImage = await uploadBarberProPic(email, profileImg);

//         // Send the response
//         res.status(200).json({
//             success: true,
//             message: "Files uploaded successfully",
//             response: barberImage,
//         });

//     } catch (error) {
//         next(error);
//     }
// };


export const uploadBarberprofilePic = async (req, res, next) => {
    try {

        let profiles = req.files.profile;
        const { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!req.files || !req.files.profile) {
            return ErrorHandler(BARBER_IMAGE_EMPTY_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!Array.isArray(profiles)) {
            profiles = [profiles]; // Ensure profiles is always an array
        }

        // Allowed file extensions
        const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
        const maxFileSize = MAX_FILE_SIZE;

        // Find the existing barber by email
        const existingBarber = await findBarberByEmailAndRole(email);

        if (!existingBarber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        // Validate each profile image before uploading
        for (const profile of profiles) {
            const extension = path.extname(profile.name).toLowerCase().slice(1);
            if (!allowedExtensions.includes(extension)) {
                return ErrorHandler(IMAGE_FILE_EXTENSION_ERROR, ERROR_STATUS_CODE, res)
            }

            if (profile.size > maxFileSize) {
                return ErrorHandler(IMAGE_FILE_SIZE_ERROR, ERROR_STATUS_CODE, res)
            }
        }

        // Process the valid profile images and upload to Cloudinary
        const uploadPromises = profiles.map(profile => {
            const public_id = `${profile.name.split('.')[0]}_${uuidv4()}`;
            const folderPath = `barbers`;

            return cloudinary.uploader.upload(profile.tempFilePath, { public_id, folder: folderPath })
                .then(image => {
                    // Delete the temporary file after uploading
                    fs.unlink(profile.tempFilePath, err => {
                        if (err)
                            return console.log(IMAGE_FAILED_DELETE, err)

                    });

                    return { public_id: image.public_id, url: image.secure_url };
                });
        });

        const profileImg = await Promise.all(uploadPromises);

        const barberImage = await uploadBarberProPic(email, profileImg);

        return SuccessHandler(IMAGE_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberImage });
    } catch (error) {
        next(error);
    }
};


// Desc: Connect Barber To Salon 
export const connectBarberToSalon = async (req, res, next) => {
    try {
        const { email, salonId, barberServices } = req.body;

        // const getBarber = await findBarberByEmailAndRole(email);

        const approvePendingMessage = "Your request has been sent for approval. Please wait."

        if (barberServices.length === 0) {
            return ErrorHandler(SELECT_SERVICE_ERROR, ERROR_STATUS_CODE, res)
        }

        const barber = await connectBarberSalon(email, salonId, barberServices, approvePendingMessage)

        //If barber not found
        if (!barber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(BARBER_CONNECT_SALON_SUCCESS, SUCCESS_STATUS_CODE, res)
    }
    catch (error) {
        next(error);
    }
}

// Desc: Get All Barbers in Admin 
export const getAllBarberbySalonId = async (req, res, next) => {
    try {
        // const { salonId, name, email, page = 1, limit = 10, sortField, sortOrder } = req.query;
        const { salonId, name, email, page = 1, sortField, sortOrder } = req.query;


        if (Number(salonId) === 0) {
            return ErrorHandler(SALON_NOT_CREATED_ERROR, ERROR_STATUS_CODE, res)
        }
        else {
            // Check if the salon exists in the database
            const salonExists = await checkSalonExists(salonId); // Assuming checkSalonExists is a function that checks if the salon exists
            if (salonExists === null) {
                return ErrorHandler(SALON_EXISTS_ERROR, ERROR_STATUS_CODE, res)
            }

            let query = {}; // Filter for isDeleted set to false

            const searchRegExpName = new RegExp('.*' + name + ".*", 'i');
            const searchRegExpEmail = new RegExp('.*' + email + ".*", 'i');

            if (salonId) {
                query.salonId = salonId;
            }

            if (name || email) {
                query.$or = [
                    { name: { $regex: searchRegExpName } },
                    { email: { $regex: searchRegExpEmail } }
                ];
            }

            const sortOptions = {};
            if (sortField && sortOrder) {
                sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;
            }

            // const skip = Number(page - 1) * Number(limit);
            // const skip = Number(page - 1) * Number(limit);

            // const getAllBarbers = await Barber.find({ salonId, isDeleted: false }).sort(sortOptions).skip(skip).limit(Number(limit));

            // const getAllBarbers = await Barber.find({ salonId, isDeleted: false }).sort(sortOptions);

            const getAllBarbers = await fetchedBarbers(salonId, sortOptions);

            const totalBarbers = await totalBarberCount(query);

            return SuccessHandler(GET_ALL_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { getAllBarbers, totalBarbers })
        }

    } catch (error) {
        next(error);
    }
};

// Desc: Update Barber Account Details
export const updateBarberAccountDetails = async (req, res, next) => {
    try {
        const barberData = req.body;

        let { name, email, nickName, countryCode, mobileNumber, dateOfBirth, gender, barberServices } = barberData

        if (name && (name.length < 1 || name.length > 20)) {
            return ErrorHandler(NAME_LENGTH_ERROR, ERROR_STATUS_CODE, res)
        }

        if (barberServices.length === 0) {
            return ErrorHandler(SELECT_SERVICE_ERROR, ERROR_STATUS_CODE, res)
        }

        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        // Parse the mobile number, specifying the region code
        const phoneNumberProto = phoneUtil.parse(mobileNumberStr, regionCode);

        // Check if the parsed phone number is valid
        const isValid = phoneUtil.isValidNumber(phoneNumberProto);

        if (!isValid) {
            return ErrorHandler(MOBILE_NUMBER_ERROR, ERROR_STATUS_CODE, res)
        }

        // Get the national significant number (i.e., without the country code)
        const nationalNumber = phoneNumberProto.getNationalNumber();

        // Convert formatted number back to a number for storage
        const formattedNumberAsNumber = parseInt(nationalNumber);

        const getBarber = await findBarberByEmailAndRole(email);

        // Check if the mobile number has changed
        if (mobileNumber && getBarber.mobileNumber !== mobileNumber) {
            getBarber.mobileVerified = false;
        }


        //If barberServices is present for updating
        if (barberServices && barberServices.length > 0) {
            //Update the services accordingly
            for (const service of barberServices) {
                const { serviceId, serviceName, serviceIcon, serviceCode, servicePrice, vipService, barberServiceEWT } = service;

                const updateService = await updateBarberServices(email, getBarber.salonId, serviceId, serviceIcon, serviceName, serviceCode, servicePrice, vipService, barberServiceEWT);

                // If BarberServices Not Present
                if (!updateService) {
                    const newService = {
                        serviceId,
                        serviceCode,
                        serviceName,
                        servicePrice,
                        serviceIcon,
                        vipService,
                        barberServiceEWT: barberServiceEWT
                    };
                    await adminAddNewBarberService(email, getBarber.salonId, newService)
                }
            }
        }
        // //Creating an object other than the password field 
        // let updateFields = {
        //     name,
        //     nickName,
        //     gender,
        //     mobileCountryCode: countryCode,
        //     dateOfBirth,
        //     mobileNumber: formattedNumberAsNumber,
        // };


        // //Updating the Barber Document
        // const barber = await updateBarber(email, updateFields)

        const barber = await updateBarber(email, name, nickName, gender, countryCode, formattedNumberAsNumber, dateOfBirth, barberServices)

        // Generating the barberCode based on the updated name and existing barberId
        const firstTwoLetters = name.slice(0, 2).toUpperCase();
        const updatedBarberCode = firstTwoLetters + barber.barberId;

        // Updating the barberCode in the database
        await barberCode(email, updatedBarberCode);

        return SuccessHandler(UPDATE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barber });
    }
    catch (error) {
        next(error);
    }
}

// Desc: Delete Barber In Admin
export const deleteBarber = async (req, res, next) => {
    try {
        let { email } = req.body;
        const { salonId } = req.body;

        email = email.toLowerCase();

        const deleteBarber = await deletedBarber(salonId, email)
        if (!deleteBarber) {
            res.status(400).json({
                success: false,
                message: "Barber not deleted. Please check your credentials",
            });
        }

        res.status(200).json({
            success: true,
            message: "Barber deleted successfully",
            response: deleteBarber
        });
    }
    catch (error) {
        next(error);
    }
}

//DESC:CHANGE BARBER WORKING STATUS ========================
export const changeBarberWorkingStatus = async (req, res, next) => {
    try {
        const { barberId } = req.params;
        const { isActive } = req.body;

        // Update the isActive status in the database
        const updatedBarber = await changeBarberStatus(barberId, isActive)

        if (!updatedBarber) {
            return res.status(404).json({ success: false, message: "Barber not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Barber working status changed",
            respone: updatedBarber
        });
    } catch (error) {
        next(error);
    }

}


//Desc: Change Barber Clock In Status
export const changeBarberClockInStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isClockedIn } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline' });
        }

        const getBarber = await getBarberByBarberId(barberId);

        if (getBarber.isApproved === false) {
            return ErrorHandler(BARBER_NOT_APPROVE_ERROR, ERROR_STATUS_CODE, res)
        }

        if (isClockedIn === true) {
            // Now, you can proceed with the logic after verifying the token
            const updatedBarber = await barberClockInStatus(barberId, salonId, isClockedIn);

            if (!updatedBarber) {
                return ErrorHandler(`Cant clockedIn as ${BARBER_NOT_EXIST_ERROR}`, ERROR_STATUS_CODE, res)
            }
            await barberLogInTime(updatedBarber.salonId, updatedBarber.barberId, updatedBarber.updatedAt);

            return SuccessHandler(BARBER_CLOCKIN_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedBarber })
        }
        else {

            const getQlistByBarber = await qListByBarberId(salonId, barberId);

            const isOnline = false;
            if (getQlistByBarber.length === 0) {
                await barberOnlineStatus(barberId, salonId, isOnline)

                // Now, you can proceed with the logic after verifying the token
                const updatedBarber = await barberClockInStatus(barberId, salonId, isClockedIn);

                if (!updatedBarber) {
                    return ErrorHandler(`Cant clockedIn as ${BARBER_NOT_EXIST_ERROR}`, ERROR_STATUS_CODE, res)
                }

                await barberLogOutTime(updatedBarber.salonId, updatedBarber.barberId, updatedBarber.updatedAt);

                return SuccessHandler(BARBER_CLOCKOUT_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedBarber })
            }
            else {
                return ErrorHandler(CUSTOMERS_IN_QUEUE_ERROR, ERROR_STATUS_CODE, res)
            }
        }

    } catch (error) {
        next(error);
    }
};

// Desc: Change BarberOnline Status
export const changeBarberOnlineStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isOnline } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline' });
        }
        const getbarber = await getBarberByBarberId(barberId);

        if (getbarber.isApproved === false) {
            return ErrorHandler(BARBER_NOT_APPROVE_ERROR, ERROR_STATUS_CODE, res)
        }

        if (getbarber.isClockedIn === false) {
            return ErrorHandler(BARBER_CLOCKIN_ERROR, ERROR_STATUS_CODE, res)
        }

        // Now, you can proceed with the logic after verifying the token
        const updatedBarber = await barberOnlineStatus(barberId, salonId, isOnline);

        if (!updatedBarber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }


        return SuccessHandler(CHANGE_BARBER_ONLINE_SUCCESS, SUCCESS_STATUS_CODE, res, { response: updatedBarber })

    } catch (error) {
        next(error);
    }
};

// Desc: Get all barbers by service Id
export const getAllBarbersByServiceId = async (req, res, next) => {
    try {
        const { serviceId } = req.query;

        const barbers = await getBarbersByServiceId(serviceId)
        if (!barbers || barbers.length === 0) {
            return ErrorHandler(NO_BARBER_SERVICEID_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(GET_ALL_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barbers })

    }
    catch (error) {
        next(error);
    }
}

// Desc: get barber services by barber Id
export const getBarberServicesByBarberId = async (req, res, next) => {
    try {
        const { barberId } = req.query;

        const barbers = await getBarberByBarberId(barberId)

        const barberServices = barbers.barberServices;

        if (!barbers) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(BARBER_SERVICES_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberServices })
    }
    catch (error) {
        next(error);
    }

}

//Desc: Send verification code to barber email
export const sendVerificationCodeForBarberEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await findBarberByEmailAndRole(email)
        if (!user) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        try {
            await sendVerificationCode(email, user.name, verificationCode);
        } catch (error) {
            return ErrorHandler(VERIFICATION_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(SEND_VERIFICATION_EMAIL_SUCCESS, SUCCESS_STATUS_CODE, res);

    } catch (error) {
        next(error);
    }
}

// Desc: Change barber email verified status
export const changeBarberEmailVerifiedStatus = async (req, res, next) => {
    try {
        const { email, verificationCode } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        // FIND THE CUSTOMER 
        const barber = await findBarberByEmailAndRole(email);

        if (barber && barber.verificationCode === verificationCode) {
            barber.verificationCode = '';
            barber.emailVerified = true;
            await barber.save()

            return SuccessHandler(EMAIL_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barber });
        }

        return ErrorHandler(EMAIL_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}

//Desc get barber Detail By Email
export const getBarberDetailsByEmail = async (req, res) => {
    try {
        let { email } = req.body;

        email = email.toLowerCase();

        const barber = await findBarberByEmailAndRole(email)

        if (!barber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const getBarberRating = await getAverageBarberRating(barber.salonId, barber.barberId)

        return SuccessHandler(BARBER_DETAILS_SUCCESS, SUCCESS_STATUS_CODE, res, {
            response: {
                ...barber.toObject(),
                barberRating: getBarberRating,
            }
        })
    }
    catch (error) {
        next(error);
    }
}

//DESC:SEND ADMIN MOBILE NUMBER VERIFICATION CODE ============================
export const sendVerificationCodeForBarberMobile = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const user = await findBarberByEmailAndRole(email);

        if (!user) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        // Format the mobile number with the country code
        const formattedNumber = `+${user.mobileCountryCode}${String(user.mobileNumber)}`;

        try {
            await sendMobileVerificationCode(formattedNumber, verificationCode);
        } catch (error) {
            next(error);
        }

        return SuccessHandler(SEND_VERIFICATION_MOBILE_SUCCESS, SUCCESS_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}

//DESC:CHANGE ADMIN MOBILE VERIFIED STATUS ============================
export const changeBarberMobileVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        // FIND THE CUSTOMER 
        const barber = await findBarberByEmailAndRole(email);

        if (barber && barber.verificationCode === verificationCode) {
            barber.verificationCode = '';
            barber.mobileVerified = true;
            await barber.save();

            return SuccessHandler(MOBILE_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barber })
        }
        else {
            return ErrorHandler(MOBILE_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)
        }
    } catch (error) {
        next(error);
    }
}

//DESC:CHANGE ADMIN PASSWORD ============================
export const barberchangepassword = async (req, res, next) => {
    try {
        let { email, oldPassword, password } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        // if (!oldPassword && !password) {
        //     return ErrorHandler(FILL_ALL_FIELDS_ERROR, ERROR_STATUS_CODE, res)
        // }

       
        if (!password) {
            return ErrorHandler(NEW_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const getBarber = await findBarberByEmailAndRole(email)

        if (!getBarber) {
            return ErrorHandler(BARBER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        if (getBarber.AuthType === "local") {

             if (!oldPassword && !password) {
            return ErrorHandler(FILL_ALL_FIELDS_ERROR, ERROR_STATUS_CODE, res)
        }


            if (!oldPassword) {
                return ErrorHandler(OLD_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
            }

            if (oldPassword === password) {
                return ErrorHandler(OLD_AND_NEW_PASSWORD_DONOT_MATCH, ERROR_STATUS_CODE, res)
            }

            //Match the old password
            const isMatch = await bcrypt.compare(oldPassword, getBarber.password);

            if (!isMatch) {
                return ErrorHandler(INCORRECT_OLD_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
            }

            if (password && password.length < 8) {
                return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);


            getBarber.password = hashedPassword;

            getBarber.save();

            return SuccessHandler(CHANGE_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getBarber })
        }
        else {

            if (password && password.length < 8) {
                return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
            }
            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);

            getBarber.password = hashedPassword;

            getBarber.save();

            return SuccessHandler(CHANGE_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getBarber })
        }

    }
    catch (error) {
        next(error);
    }
}

//DESC:GET ALL SALON SERVICES ======================
export const getAllSalonServicesForBarber = async (req, res, next) => {
    try {
  
      const { salonId } = req.query;
  
      if (Number(salonId) === 0) {
        return ErrorHandler(NO_SALON_CONNECTED_ERROR, ERROR_STATUS_CODE, res)
    }
  
      const salon = await getSalonBySalonId(salonId)

          // Assuming the salon object includes a `currency` field
    const { services, currency } = salon;
  
      return SuccessHandler(SALON_SERVICES_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, { response: {
        services,
        currency, 
    }
    })
    }
    catch (error) {
      next(error);
    }
  }

