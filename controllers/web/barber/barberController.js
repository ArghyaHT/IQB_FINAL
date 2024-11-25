import { adminAddNewBarberService, adminCreateBarber, adminUpdateBarber, adminUpdateBarberServices, barberClockInStatus, barberCode, barberOnlineStatus, changeBarberStatus, connectBarberSalon, createBarber, createBarberId, createGoogleBarber, deleteBarberProPic, deletedBarber, fetchedBarbers, findBarberByEmailAndRole, findBarberProfileById, getBarberByBarberId, getBarbersByServiceId, googleLoginBarber, resetBarberPassword, totalBarberCount, updateBarber, updateBarberProPic, uploadBarberProPic } from "../../../services/web/barber/barberService.js";
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
import { checkSalonExists, getSalonBySalonId } from "../../../services/web/admin/salonService.js";
import { v4 as uuidv4 } from 'uuid';
import { qListByBarberId } from "../../../services/web/queue/joinQueueService.js";
import { barberLogInTime, barberLogOutTime } from "../../../utils/attendence/barberAttendence.js";
import { sendMobileVerificationCode } from "../../../utils/mobileMessageSender/mobileMessageSender.js";


//DESC:REGISTER A BARBER ====================
export const registerController = async (req, res, next) => {
    try {
        let { email, password } = req.body

        if (!email && !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

          // Convert email to lowercase
          email = email.toLowerCase();

        // Validate password length
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your password."
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }


        // Check if the email is already registered
        const existingUser = await findBarberByEmailAndRole(email)

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Barber already exists"
            });
        }

        const barberId = await createBarberId();

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new user
        const newUser = await createBarber(email, hashedPassword, barberId)


        res.status(200).json({
            success: true,
            message: "Barber registered successfully",
            newUser
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:LOGIN A USER =========================
export const loginController = async (req, res, next) => {
    try {
        let email = req.body.email;
        const password = req.body.password;
        const { webFcmToken, androidFcmToken, iosFcmToken } = req.body;

        if (!email && !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

          // Convert email to lowercase
          email = email.toLowerCase();

        // Validate password length
        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your password."
            });
        }

        // Validate password length
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters."
            });
        }


        // Find user by email in the MongoDB database
        const foundUser = await findBarberByEmailAndRole(email);

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Email or password donot match.'
            })
        }

        const match = await bcrypt.compare(password, foundUser.password)

        if (!match) return res.status(400).json({
            message: false,
            message: 'Email or password donot match.'
        })

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
            { expiresIn: '1d' }
        )

        // Create secure cookie with refresh token 
        res.cookie('BarberToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        res.status(200).json({
            success: true,
            message: "Barber logged in successfully",
            accessToken,
            foundUser
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//GOOGLE SIGNIN ===================================
export const googleBarberSignup = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID

        const token = req.query.token;
        const { webFcmToken, androidFcmToken, iosFcmToken } = req.query;

        console.log(token)

        if (!token) {
            return res.status(404).json({
                success: false,
                message: "Barber token not found"
            })
        }

        const client = new OAuth2Client(CLIENT_ID);

        // Call the verifyIdToken to
        // varify and decode it
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        // Get the JSON with all the user info
        const payload = ticket.getPayload();

        // console.log("Google payload ", payload)

        // Check if the email is already registered
        const existingUser = await findBarberByEmailAndRole(payload.email)

        if (existingUser) {
            return res.status(404).json({ success: false, message: 'Barber already exists' })
        }


        const barberId = await createBarberId();
        const firstTwoLetters = payload.name.slice(0, 2).toUpperCase();
        const barberCode = firstTwoLetters + barberId;

        // Create a new user
        const newUser = await createGoogleBarber(payload.email, barberId, barberCode)


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


        res.status(200).json({
            success: true,
            message: 'Barber registered successfully',
            newUser
        })
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

export const googleBarberLogin = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID

        const token = req.query.token;
        const { webFcmToken, androidFcmToken, iosFcmToken } = req.query;

        if (!token) {
            return res.status(404).json({ success: false, message: "Barber token not found" })
        }

        const client = new OAuth2Client(CLIENT_ID);

        // Call the verifyIdToken to
        // varify and decode it
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        // Get the JSON with all the user info
        const payload = ticket.getPayload();

        console.log("Google Login payload ", payload)

        const foundUser = await googleLoginBarber(payload.email)

        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'Email does not exist' })
        }

        const accessToken = jwt.sign(
            {

                "email": foundUser.email,
                "role": foundUser.role,
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '1d' }
        )

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

        // Create secure cookie with refresh token 
        res.cookie('BarberToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })
        res.status(201).json({
            success: true,
            message: "Barber logged in successfully",
            accessToken,
            foundUser
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:LOGOUT A USER ========================
export const handleLogout = async (req, res, next) => {
    try {
        //cookie parse na use korle ata kaj korbe na
        const cookies = req.cookies

        // Ai line ta lagia ami logout error check korbo
        // if(cookies) { return res.status(401).json({ message:"Unauthorize Barber" }) }

        if (!cookies?.BarberToken) return res.status(404).json({
            success: false,
            message: "Unauthorize Barber"
        }) //No content
        res.clearCookie('BarberToken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true
        })
        res.status(200).json({
            success: true,
            message: 'Barber logout successfull'
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

export const updateBarberInfo = async (req, res, next) => {
    try {
        let { email, name, countryCode, mobileNumber, gender, dateOfBirth } = req.body

        // Convert email to lowercase
        if (email) {
            email = email.toLowerCase();
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email."
            });
        }


        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter name between 1 to 20 characters"
            });
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
            return res.status(400).json({
                success: false,
                message: 'Barber not found.'
            })
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
            { expiresIn: '1d' }
        )

        // const refreshToken = jwt.sign(
        //     { "email": email, "role": foundUser.role },
        //     REFRESH_TOKEN_SECRET,
        //     { expiresIn: '1d' }
        // )

        // Create secure cookie with refresh token 
        res.cookie('BarberToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: 'Barber updated successfully',
            accessToken,
            updatedBarber
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:FORGOT PASSWORD SENDING EMAIL TO USER ===========
export const handleForgetPassword = async (req, res, next) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }



        const user = await findBarberByEmailAndRole(email)

        if (!user) {
            res.status(404).json({
                success: false,
                message: "Email does not exist"
            })
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

        const CLIENT_URL = "https://iqb-final.onrender.com"

        //  const CLIENT_URL = "http://localhost:5173"

        try {
            await emailWithNodeMail(email, user.name, CLIENT_URL, "barberchangepassword", resetToken)
        } catch (error) {
            res.status(400).json({
                success: false,
                message: 'Failed to send reset password email'
            })
        }

        res.status(200).json({
            success: true,
            message: `Please go to your email for reseting password`,
            payload: {
                resetToken
            }
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:RESET PASSWORD =================================
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

        res.status(200).json({
            success: true,
            message: 'Password reset successfully.'
        })

    } catch (error) {
        // //console.log(error);
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

        // Convert email to lowercase
        // email = email.toLowerCase();

        // Convert email to lowercase
        // console.log(email)

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }


        email = email.toLowerCase();

        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter name between 1 to 20 characters."
            });
        }

        if (barberServices.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide services."
            });
        }



        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        console.log(regionCode)

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
        const formattedNumberAsNumber = parseInt(nationalNumber);


        // Check if the barber with the provided email already exists
        const barber = await findBarberByEmailAndRole(email);

        if (barber) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
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
        const barberLoginSubject = 'Your login credentials';
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
                <h1 class="header">Your Login Details</h1>
                <div class="details">
                    <p>Dear ${name},</p>
                    <p>Your auto-generated random password is provided below. Please log in with this password and reset it upon login.</p>
                    <ul>
                        <li>Salon Name: ${salonDetails.salonName}</li>
                        <li>Barber Name: ${name}</li>
                        <li>Password: ${randomPassword}</li>
                    </ul>
                </div>
                <div class="visit">
                    <p><a href="http://localhost:5173/barbersignin?email=${encodeURIComponent(email)}">Click here to log in</a></p>
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

        res.status(201).json({
            success: true,
            message: "Barber created successfully",
            response: savedBarber
        });
    } catch (error) {
        // //console.log(error);
        next(error);
    }
};

//DESC:UPDATE BARBER BY ADMIN =====================
export const updateBarberByAdmin = async (req, res, next) => {
    try {
        let { email, name, nickName, salonId, countryCode, mobileNumber, dateOfBirth, barberServices } = req.body;

        // Convert email to lowercase
        if (email) {
            email = email.toLowerCase();
        }

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter name between 1 to 20 characters"
            });
        }

        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        console.log(regionCode)

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
        const formattedNumberAsNumber = parseInt(nationalNumber);


        //If barberServices is present for updating
        if (barberServices && barberServices.length > 0) {
            //Update the services accordingly
            for (const service of barberServices) {
                const { serviceId, serviceName, serviceIcon, serviceCode, servicePrice, vipService, barberServiceEWT } = service;

                const updateService = await adminUpdateBarberServices(email, salonId, serviceId, serviceIcon, serviceName, serviceCode, servicePrice, vipService, barberServiceEWT);

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
            res.status(404).json({
                success: false,
                message: 'Barber not found',
            });
        }

        res.status(200).json({
            success: true,
            message: "Barber updated successfully",
            response: updatedBarber
        })
    }
    catch (error) {
        //console.log(error);
        next(error);
    }

}

//DESC:UPLOAD BARBER PROFILE PICTURE ============================
export const uploadBarberprofilePic = async (req, res, next) => {
    try {
        let profiles = req.files.profile;
        let email = req.body.email;

        email = email.toLowerCase();

        if (!profiles) {
            return res.status(400).json({ success: false, message: "Barber profile image is empty." });
        }

        // Ensure profiles is an array for single or multiple uploads
        if (!Array.isArray(profiles)) {
            profiles = [profiles];
        }

        // Allowed file extensions and maximum file size (2MB)
        const allowedExtensions = ["jpg", "png", "jfif", "svg", "jpeg", "webp"];
        const maxFileSize = 2 * 1024 * 1024;

        // Find the existing barber by email
        const existingBarber = await findBarberByEmailAndRole(email);

        // Validate files before uploading
        for (let profile of profiles) {
            const extension = path.extname(profile.name).toLowerCase().slice(1);

            if (!allowedExtensions.includes(extension)) {
                return res.status(400).json({ success: false, message: "Invalid file extension. Allowed extensions are jpg, png, jfif, svg, jpeg, webp." });
            }

            if (profile.size > maxFileSize) {
                return res.status(400).json({ success: false, message: "File size must be lower than 2MB." });
            }
        }

        // Delete the existing profile picture if it exists
        if (existingBarber && existingBarber.profile && Array.isArray(existingBarber.profile) && existingBarber.profile.length > 0) {
            const oldProfile = existingBarber.profile[0];
            if (oldProfile && oldProfile.public_id) {
                try {
                    console.log('Deleting old profile picture with public_id:', oldProfile.public_id);
                    const result = await cloudinary.uploader.destroy(oldProfile.public_id);
                    console.log('Deletion result:', result);

                    if (result.result !== 'ok') {
                        return res.status(400).json({ success: false, message: 'Failed to delete old image.' });
                    }
                } catch (err) {
                    console.error('Error during deletion:', err);
                    return res.status(500).json({ success: false, message: 'Failed to delete old image.', error: err.message });
                }
            } else {
                console.log('No valid profile picture found or missing public_id for deletion');
            }
        } else {
            console.log('No existing profile picture or profile array is empty');
        }

        // Upload new profile image(s) to Cloudinary
        const uploadPromises = profiles.map(profile => {
            const public_id = `${profile.name.split('.')[0]}_${uuidv4()}`;
            const folderPath = `barbers`;

            return cloudinary.uploader.upload(profile.tempFilePath, {
                public_id,
                folder: folderPath,
            }).then(image => {
                // Delete the temporary file after uploading
                fs.unlink(profile.tempFilePath, err => {
                    if (err) console.error('Failed to delete temporary file:', err);
                });
                return { public_id: image.public_id, url: image.secure_url };
            });
        });

        const profileImg = await Promise.all(uploadPromises);

        // Update the barber profile picture in the database
        const barberImage = await uploadBarberProPic(email, profileImg);

        // Send the response
        res.status(200).json({
            success: true,
            message: "Files uploaded successfully",
            response: barberImage,
        });
    } catch (error) {
        console.error('Error during barber profile picture upload:', error);
        next(error);
    }
};



//DESC:UPDATE BARBER PROFILE PICTURE ============================
export const updateBarberProfilePic = async (req, res, next) => {
    try {
        const id = req.body.id;

        const barberProfile = await findBarberProfileById(id);

        const public_imgid = req.body.public_imgid;
        const profile = req.files.profile;
        const salonId = req.body.salonId;

        // Validate Image
        const fileSize = profile.size / 1000;
        const fileExt = profile.name.split(".")[1];

        if (fileSize > 2048) {
            return res.status(400).json({ success: false, message: "File size must be lower than 2mb" });
        }

        if (!["jpg", "png", "jfif", "jpeg", "svg"].includes(fileExt)) {
            return res.status(400).json({ success: false, message: "File extension must be jpg or png" });
        }

        // Generate a unique public_id based on the original file name
        const public_id = `${profile.name.split(".")[0]}`;
        const folderPath = `barbers`

        cloudinary.uploader.upload(profile.tempFilePath, {
            public_id: public_id,
            folder: folderPath,
        })
            .then(async (image) => {

                const result = await cloudinary.uploader.destroy(public_imgid);

                if (result.result === 'ok') {
                    console.log("cloud img deleted")

                } else {
                    res.status(500).json({
                        message: 'Failed to delete image.'
                    });
                }

                // Delete the temporary file after uploading to Cloudinary
                fs.unlink(profile.tempFilePath, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });

                const updatedBarber = await updateBarberProPic(id, image)
                // Find the newly added advertisement
                const updatedBarberImage = updatedBarber.profile.find(br => br.public_id === image.public_id);

                res.status(200).json({
                    success: true,
                    message: "Files Updated successfully",
                    response: updatedBarberImage
                });

            })



    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:DELETE BARBER PROFILE PICTURE ============================
export const deleteBarberProfilePicture = async (req, res, next) => {
    try {
        const public_id = req.body.public_id
        const img_id = req.body.img_id

        const { updatedBarber, deletedImage } = await deleteBarberProPic(img_id);

        const result = await cloudinary.uploader.destroy(public_id);

        if (result.result === 'ok') {
            console.log("cloud img deleted")

        } else {
            res.status(500).json({
                success: true,
                message: 'Failed to delete image.'
            });
        }


        if (updatedBarber) {
            res.status(200).json({
                success: true,
                message: "Image successfully deleted",
                response: deletedImage
            })
        } else {
            res.status(404).json({
                success: false,
                message: 'Image not found in the student profile'
            });
        }
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:CONNECT BARBER TO SALON ======================
export const connectBarberToSalon = async (req, res, next) => {
    try {
        const { email, salonId, barberServices } = req.body;

        // const getBarber = await findBarberByEmailAndRole(email);

        const approvePendingMessage = "Your request has been sent for approval. Please wait."

        if (barberServices.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select a service",
            });
        }

        const barber = await connectBarberSalon(email, salonId, barberServices, approvePendingMessage)

        //If barber not found
        if (!barber) {
            return res.status(404).json({
                success: false,
                message: "Barber not found",
            });
        }


        return res.status(200).json({
            success: true,
            message: "Your connect salon request has been sent for approval. Please wait",
            // response: barber,
            // "Your request has been sent for approval. Please wait"
        });
    }
    catch (error) {
        // //console.log(error);
        next(error);
    }
}

//DESC:GET ALL BARBERS BY SALONID =================
export const getAllBarberbySalonId = async (req, res, next) => {
    try {
        // const { salonId, name, email, page = 1, limit = 10, sortField, sortOrder } = req.query;
        const { salonId, name, email, page = 1, sortField, sortOrder } = req.query;


        if (Number(salonId) === 0) {
            res.status(200).json({
                success: false,
                message: "No barbers is currently available to show.",
                getAllBarbers: []
            });
        }
        else {

            // Check if the salon exists in the database
            const salonExists = await checkSalonExists(salonId); // Assuming checkSalonExists is a function that checks if the salon exists
            if (salonExists === null) {
                return res.status(400).json({
                    success: false,
                    message: "Salon does not exist.",
                });
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

            if (getAllBarbers) {
                res.status(200).json({
                    success: true,
                    message: "All barbers fetched successfully",
                    getAllBarbers: getAllBarbers,
                    // totalPages: Math.ceil(totalBarbers / Number(limit)),
                    // currentPage: Number(page),
                    totalBarbers,
                });
            }
            else {
                res.status(200).json({
                    success: false,
                    message: "No barber to show",
                    getAllBarbers: [],
                });
            }
        }

    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:UPDATE BARBER ACCOUNT DETAILS =======================
export const updateBarberAccountDetails = async (req, res, next) => {
    try {
        const barberData = req.body;

        let { name, email, nickName, countryCode, mobileNumber, dateOfBirth, gender } = barberData

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please Enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid email"
            });
        }

        email = email.toLowerCase();


        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter name between 1 to 20 characters"
            });
        }


        // Convert mobile number to string only if it's a number
        let mobileNumberStr = typeof mobileNumber === 'number' ? mobileNumber.toString() : mobileNumber;

        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();

        const regionCode = phoneUtil.getRegionCodeForCountryCode(countryCode);

        console.log(regionCode)

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
        const formattedNumberAsNumber = parseInt(nationalNumber);


        //Creating an object other than the password field 
        let updateFields = {
            name,
            nickName,
            gender,
            mobileCountryCode: countryCode,
            dateOfBirth,
            mobileNumber: formattedNumberAsNumber,
        };


        const getBarber = await findBarberByEmailAndRole(email);

        // Check if the mobile number has changed
        if (mobileNumber && getBarber.mobileNumber !== mobileNumber) {
            updateFields.mobileVerified = false;
        }

        //Updating the Barber Document
        const barber = await updateBarber(email, updateFields)

        // Generating the barberCode based on the updated name and existing barberId
        const firstTwoLetters = name.slice(0, 2).toUpperCase();
        const updatedBarberCode = firstTwoLetters + barber.barberId;

        // Updating the barberCode in the database
        await barberCode(email, updatedBarberCode);

        res.status(200).json({
            success: true,
            message: "Barber updated successfully",
            response: barber
        });
        // }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:DELETE BARBER ==========================
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
        //console.log(error);
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
        //console.log(error);
        next(error);
    }

}

//DESC:CHANGE BARBER ONLINE STATUS ===========================
export const changeBarberOnlineStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isOnline } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline' });
        }
        const getbarber = await getBarberByBarberId(barberId);



        if (getbarber.isClockedIn === false) {
            return res.status(404).json({ success: false, message: "Unable to change online status as you are currently clocked out" });
        }

        // Now, you can proceed with the logic after verifying the token
        const updatedBarber = await barberOnlineStatus(barberId, salonId, isOnline);

        if (!updatedBarber) {
            return res.status(404).json({ success: false, message: "Barber not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Barber online status changed successfully.",
            response: updatedBarber
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:GET ALL BARBERS BY SERVICEID =========================
export const getAllBarbersByServiceId = async (req, res, next) => {
    try {
        const { serviceId } = req.query;

        const barbers = await getBarbersByServiceId(serviceId)
        if (!barbers || barbers.length === 0) {
            return res.status(200).json({
                success: false,
                message: "No barbers found for the given serviceId"
            });
        }

        return res.status(200).json({
            success: true,
            message: "All Barbers fetched successfully",
            response: barbers
        });
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET ALL BARBER SERVICES BY BARBERID ===================
export const getBarberServicesByBarberId = async (req, res, next) => {
    try {
        const { barberId } = req.query;

        const barbers = await getBarberByBarberId(barberId)

        const barberServices = barbers.barberServices;

        if (!barbers) {
            return res.status(404).json({
                success: false,
                message: "No barber found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Barber services retrieved",
            response: barberServices
        });
    }
    catch (error) {
        //console.log(error);
        next(error);
    }

}

//DESC:SEND EMAIL VERIFICATION CODE TO VERIFY BARBER EMAIL ===============
export const sendVerificationCodeForBarberEmail = async (req, res, next) => {
    try {
        const { email } = req.body;

        const user = await findBarberByEmailAndRole(email)
        if (!user) {
            return res.status(404).json({
                success: false,
                response: "Please register first",
            });
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        try {
            await sendVerificationCode(email, user.name, verificationCode);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: 'Failed to Verify email',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: `Please check mail for verification.`,
            verificationCode: verificationCode
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:CHANGE BARBER EMAIL VERIFIED STATUS =====================
export const changeBarberEmailVerifiedStatus = async (req, res, next) => {
    try {
        const { email, verificationCode } = req.body;

        // FIND THE CUSTOMER 
        const barber = await findBarberByEmailAndRole(email);

        if (barber && barber.verificationCode === verificationCode) {
            // If verification code matches, clear it from the database
            barber.verificationCode = '';
            barber.emailVerified = true;
            await barber.save();

            return res.status(200).json({
                success: true,
                message: "Email verified successfully",
                response: barber,
            });
        }

        // If verification code doesn't match or customer not found
        return res.status(400).json({
            success: false,
            message: "Enter valid Verification code",
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET BARBER DETAILS BY BARBER EMAIL =====================
export const getBarberDetailsByEmail = async (req, res) => {
    try {
        let { email } = req.body;

        email = email.toLowerCase();

        const barber = await findBarberByEmailAndRole(email)

        if (!barber) {
            return res.status(404).json({
                success: false,
                message: "Barber not found",
            });
        }

        const getBarberRating = await getAverageBarberRating(barber.salonId, barber.barberId)

        res.status(200).json({
            success: true,
            message: "Barber retrived successfully",
            response: {
                ...barber.toObject(), // Convert Mongoose document to plain JavaScript object
                barberRating: getBarberRating,
            },
        });
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:CHANGE BARBER CLOCKIN STATUS ===========================
export const changeBarberClockInStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isClockedIn } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline' });
        }

        const getBarber = await getBarberByBarberId(barberId);

        if (getBarber.isApproved === false) {
            return res.status(400).json({ success: false, message: 'Barber is not approved.' });
        }

        if (isClockedIn === true) {
            // Now, you can proceed with the logic after verifying the token
            const updatedBarber = await barberClockInStatus(barberId, salonId, isClockedIn);

            if (!updatedBarber) {
                return res.status(404).json({ success: false, message: "Cant clockedIn as barber not found" });
            }
            await barberLogInTime(updatedBarber.salonId, updatedBarber.barberId, updatedBarber.updatedAt);

            return res.status(200).json({
                success: true,
                message: "You are clocked in ",
                response: updatedBarber
            });
        }
        else {

            const getQlistByBarber = await qListByBarberId(salonId, barberId);
            const isOnline = false;
            if (getQlistByBarber.length === 0) {
                await barberOnlineStatus(barberId, salonId, isOnline)

                // Now, you can proceed with the logic after verifying the token
                const updatedBarber = await barberClockInStatus(barberId, salonId, isClockedIn);

                if (!updatedBarber) {
                    return res.status(404).json({ success: false, message: "Cant clockedIn as barber not found" });
                }

                await barberLogOutTime(updatedBarber.salonId, updatedBarber.barberId, updatedBarber.updatedAt);

                return res.status(200).json({
                    success: true,
                    message: "You are clocked out",
                    response: updatedBarber
                });
            }

            else {
                return res.status(404).json({
                    success: false,
                    message: "Cant clock you out as you have customers in the queue",
                });
            }
        }

    } catch (error) {
        //console.log(error);
        next(error);
    }
};


//DESC:SEND ADMIN MOBILE NUMBER VERIFICATION CODE ============================
export const sendVerificationCodeForBarberMobile = async (req, res, next) => {
    try {
        let { email } = req.body;

        // Validate input fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please Enter your email."
            });
        }

        // Convert email to lowercase
        email = email.toLowerCase();

        const user = await findBarberByEmailAndRole(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                response: "Please register first",
            });
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        // Format the mobile number with the country code
        const formattedNumber = `+${user.mobileCountryCode}${String(user.mobileNumber)}`;

        try {
            await sendMobileVerificationCode(formattedNumber, verificationCode);
        } catch (error) {
            //console.log(error);
            next(error);
        }

        return res.status(200).json({
            success: true,
            message: `Please check your mobile inbox for verification code.`,
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:CHANGE ADMIN MOBILE VERIFIED STATUS ============================
export const changeBarberMobileVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        // Validate input fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please Enter your email."
            });
        }

        // Convert email to lowercase
        email = email.toLowerCase();

        // FIND THE CUSTOMER 
        const barber = await findBarberByEmailAndRole(email);

        if (barber && barber.verificationCode === verificationCode) {
            // If verification code matches, clear it from the database
            barber.verificationCode = '';
            barber.mobileVerified = true;
            await barber.save();

            return res.status(200).json({
                success: true,
                message: "Your mobile number has been verified successfully.",
                response: barber,
            });
        }
        else {

            // If verification code doesn't match or customer not found
            return res.status(400).json({
                success: false,
                message: "Enter valid Verification code",
            });
        }
    } catch (error) {
        //console.log(error);
        next(error);
    }
}


//DESC:CHANGE ADMIN PASSWORD ============================
export const barberchangepassword = async (req, res, next) => {
    try {
        let { email, oldPassword, password } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        if (!oldPassword && !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter all the fields."
            });
        }

        if (!oldPassword) {
            return res.status(400).json({
                success: false,
                message: "Please enter your old password."
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: "Please enter your new password."
            });
        }

        // Convert email to lowercase
        email = email.toLowerCase();

        const getBarber = await findBarberByEmailAndRole(email)

        if (!getBarber) {
            return res.status(404).json({
                success: false,
                message: "Barber not found."
            });
        }

        if (getBarber.AuthType === "local") {


            if (oldPassword === password) {
                return res.status(400).json({
                    success: false,
                    message: "Old and new password can't be same."
                });
            }

            //Match the old password
            const isMatch = await bcrypt.compare(oldPassword, getBarber.password);

            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: "Old password is incorrect."
                });
            }

            if (password) {
                // Check if the password meets the minimum length requirement
                if (password.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: "Password must be at least 8 characters.",
                    });
                }
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);


            getBarber.password = hashedPassword;

            getBarber.save();

            res.status(200).json({
                success: true,
                message: "Barber password updated successfully",
                response: getBarber
            })
        }
        else {

            if (password) {
                // Check if the password meets the minimum length requirement
                if (password.length < 8) {
                    return res.status(400).json({
                        success: false,
                        message: "Password must be at least 8 characters.",
                    });
                }
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);

            getBarber.password = hashedPassword;

            getBarber.save();

            res.status(200).json({
                success: true,
                message: "Barber password updated successfully.",
                response: getBarber
            })
        }

    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}
