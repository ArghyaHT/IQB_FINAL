import { findAdminByEmailandRole, resetPassword, updateAdmin, updateDefaultSalonId, uploadAdminProPic, createAdmin, createGoogleAdmin, updateGoogleAdmin, googleLoginAdmin } from "../../../services/web/admin/adminService.js";
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import bcrypt from "bcrypt";
import libphonenumber from 'google-libphonenumber';

import { barberApprovalStatus, emailWithNodeMail, sendVerificationCode } from "../../../utils/emailSender/emailSender.js";
import { allSalonsByAdmin, getDefaultSalonDetailsByAdmin, getSalonBySalonId } from "../../../services/web/admin/salonService.js";


import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { approveBarberByadmin, findBarberByBarberEmailAndSalonId } from "../../../services/web/barber/barberService.js";
import { validateEmail } from "../../../middlewares/validator.js";
import { findSalonSetingsBySalonId } from "../../../services/web/salonSettings/salonSettingsService.js";
import { v4 as uuidv4 } from 'uuid';

import { sendMobileVerificationCode } from "../../../utils/mobileMessageSender/mobileMessageSender.js";
import { ErrorHandler } from "../../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../../middlewares/SuccessHandler.js";
import { ADMIN_EXISTS_ERROR, EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, EMAIL_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR, FORGOT_PASSWORD_EMAIL_ERROR, INVALID_EMAIL_ERROR, MOBILE_NUMBER_ERROR, NAME_LENGTH_ERROR, NEW_PASSWORD_ERROR, OLD_PASSWORD_ERROR, EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, PASSWORD_LENGTH_ERROR, PASSWORD_NOT_PRESENT_ERROR, ADMIN_NOT_EXIST_ERROR, IMAGE_EMPTY_ERROR, IMAGE_FILE_SIZE_ERROR, IMAGE_FILE_EXTENSION_ERROR, VERIFICATION_EMAIL_ERROR, EMAIL_VERIFY_CODE_ERROR, MOBILE_VERIFY_CODE_ERROR, FILL_ALL_FIELDS_ERROR, OLD_AND_NEW_PASSWORD_DONOT_MATCH, INCORRECT_OLD_PASSWORD_ERROR, APPROVE_BARBER_SUCCESS, CHANGE_DEFAULT_SALON_SUCCESS, CHANGE_PASSWORD_SUCCESS, EMAIL_VERIFIED_SUCCESS, FORGET_PASSWORD_SUCCESS, GET_DEFAULT_SALON_SUCCESS, IMAGE_UPLOAD_SUCCESS, LOGOUT_SUCCESS, MOBILE_VERIFIED_SUCCESS, RESET_PASSWORD_SUCCESS, SALONS_RETRIEVE_SUCCESS, SEND_VERIFICATION_EMAIL_SUCCESS, SEND_VERIFICATION_MOBILE_SUCCESS, SIGNIN_SUCCESS, SIGNUP_SUCCESS, UPDATE_ADMIN_SUCCESS, APPROVE_BARBER_ERROR } from "../../../constants/web/adminConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../../constants/web/Common/StatusCodeConstant.js";
import { ALLOWED_IMAGE_EXTENSIONS, IMAGE_FAILED_DELETE, MAX_FILE_SIZE } from "../../../constants/web/Common/ImageConstant.js";
import { qListByBarberId } from "../../../services/web/queue/joinQueueService.js";

// Desc: Register Admin
export const registerAdmin = async (req, res, next) => {
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

        const existingUser = await findAdminByEmailandRole(email)

        if (existingUser) {
            return ErrorHandler(ADMIN_EXISTS_ERROR, ERROR_STATUS_CODE, res)
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await createAdmin(email, hashedPassword)

        return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })

    }
    catch (error) {
        next(error);
    }
}

// Desc: Login Admin
export const loginAdmin = async (req, res, next) => {
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

        const foundUser = await findAdminByEmailandRole(email)

        if (!foundUser) {
            return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
        }

        const match = await bcrypt.compare(password, foundUser.password)

        if (!match) {
            return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
        }

        const accessToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )

        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            foundUser
        })
    }
    catch (error) {
        next(error);
    }
};


// Desc: Logout Admin
export const handleLogoutAdmin = async (req, res, next) => {
    try {
        const cookies = req.cookies

        if (!cookies?.AdminToken) {
            return res.status(404).json({
                success: false,
                message: "Unauthorize Admin"
            })
        }


        res.clearCookie('AdminToken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true
        })

        return SuccessHandler(LOGOUT_SUCCESS, SUCCESS_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}


// Desc: Forgot Password 
export const handleForgetPasswordAdmin = async (req, res, next) => {
    try {
        let { email } = req.body

        if (!email) {
            return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const user = await findAdminByEmailandRole(email)

        if (!user) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        if (user.AuthType === "google") {
            return res.status(ERROR_STATUS_CODE).json({
                success: false,
                message: 'Password cant be changed as you are logged in with google'
            })
        }

        //get ResetPassword Token
        const resetToken = user.getResetPasswordToken()

        await user.save({ validatebeforeSave: false })

        try {
            await emailWithNodeMail(email, user.name, process.env.FORGET_PASSWORD_CLIENT_URL, "adminchangepassword", resetToken)
        } catch (error) {
            return ErrorHandler(FORGOT_PASSWORD_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        return SuccessHandler(FORGET_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { payload: { resetToken } })
    } catch (error) {
        next(error);
    }
}

// Desc: Reset Password 
export const handleResetPasswordAdmin = async (req, res, next) => {
    try {
        const resetToken = req.params.token

        //creating token hash
        const resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex")

        const user = await resetPassword(resetPasswordToken)

        if (!user) {
            res.status(404).json({
                success: false,
                message: "Reset Password Token is invalid or has been expired"
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

// Desc: Google Signup
export const googleAdminSignup = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        if (!token) {
            return res.status(404).json({
                success: false,
                message: "Admin token not found"
            })
        }

        const client = new OAuth2Client(CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });

        const payload = ticket.getPayload();

        const existingUser = await findAdminByEmailandRole(payload.email)

        if (existingUser) {
            return ErrorHandler(ADMIN_EXISTS_ERROR, ERROR_STATUS_CODE, res)
        }

        // Create a new user
        const newUser = await createGoogleAdmin(payload.email)

        return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser })

    }
    catch (error) {
        next(error);
    }
}

// Desc: Google Signin
export const googleAdminLogin = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        if (!token) {
            return res.status(404).json({ success: false, message: "Admin token not found" })
        }

        const client = new OAuth2Client(CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID,
        });


        const payload = ticket.getPayload();

        const foundUser = await googleLoginAdmin(payload.email)

        if (!foundUser) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const accessToken = jwt.sign(
            {

                "email": foundUser.email,
                "role": foundUser.role,
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )


        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        console.log(accessToken)

        return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            foundUser
        })
    } catch (error) {
        next(error);
    }
}

// Desc: Update Admin Info
export const updateAdminInfo = async (req, res, next) => {
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
                return ErrorHandler(MOBILE_NUMBER_ERROR, ERROR_STATUS_CODE, res)
            }

            // Get the national significant number (i.e., without the country code)
            const nationalNumber = phoneNumberProto.getNationalNumber();

            // Convert formatted number back to a number for storage
            formattedNumberAsNumber = parseInt(nationalNumber);
        }

        // Check if the provided email and password match any existing admin
        const foundUser = await findAdminByEmailandRole(email)

        if (!foundUser) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }


        // Update user information
        foundUser.name = name
        foundUser.mobileNumber = formattedNumberAsNumber
        foundUser.gender = gender
        foundUser.mobileCountryCode = countryCode
        foundUser.dateOfBirth = dateOfBirth

        const updatedAdmin = await foundUser.save()

        const accessToken = jwt.sign(
            {
                "email": email,
                "role": foundUser.role,
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )

        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })


        return SuccessHandler(UPDATE_ADMIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            accessToken,
            updatedAdmin
        })

    } catch (error) {
        next(error);
    }
}



// Desc: Update Account Details
export const updateAdminAccountDetails = async (req, res, next) => {
    try {
        let { name, gender, email, countryCode, mobileNumber, dateOfBirth } = req.body;

        if (name && (name.length < 1 || name.length > 20)) {
            return ErrorHandler(NAME_LENGTH_ERROR, ERROR_STATUS_CODE, res)
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

        // Get the current admin details
        const currentAdmin = await findAdminByEmailandRole(email);

        // Check if the mobile number has changed
        if (formattedNumberAsNumber && currentAdmin.mobileNumber !== formattedNumberAsNumber) {
            currentAdmin.mobileVerified = false;
        }

        const admin = await updateAdmin(name, gender, email, countryCode, formattedNumberAsNumber, dateOfBirth, currentAdmin.mobileVerified);

        return SuccessHandler(UPDATE_ADMIN_SUCCESS, SUCCESS_STATUS_CODE, res, { response: admin });
    }
    catch (error) {
        next(error);
    }
}

// Desc: Upload Admin Profile Pic (Upload, Update, Delete) in same api
export const uploadAdminprofilePic = async (req, res, next) => {
    try {

        let profiles = req.files.profile;
        const { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!req.files || !req.files.profile) {
            return ErrorHandler(IMAGE_EMPTY_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!Array.isArray(profiles)) {
            profiles = [profiles]; // Ensure profiles is always an array
        }

        // Allowed file extensions
        const allowedExtensions = ALLOWED_IMAGE_EXTENSIONS;
        const maxFileSize = MAX_FILE_SIZE;

        // Find the existing admin by email and role
        const existingAdmin = await findAdminByEmailandRole(email);

        if (!existingAdmin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
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
            const folderPath = `admins`;

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

        const profileimg = await Promise.all(uploadPromises);

        const adminImage = await uploadAdminProPic(email, profileimg);

        return SuccessHandler(IMAGE_UPLOAD_SUCCESS, SUCCESS_STATUS_CODE, res, { adminImage });
    } catch (error) {
        next(error);
    }
};

// Desc: Admin Send Verification Code
export const sendVerificationCodeForAdminEmail = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        const user = await findAdminByEmailandRole(email);

        if (!user) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
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

// Desc: Change Admin Email Verifiied Status
export const changeEmailVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email);

        if (admin && admin.verificationCode === verificationCode) {
            admin.verificationCode = '';
            admin.emailVerified = true;
            await admin.save();

            return SuccessHandler(EMAIL_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: admin });
        }

        return ErrorHandler(EMAIL_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}

// Desc: Get All Salons of that active admin
export const getAllSalonsByAdmin = async (req, res, next) => {
    try {
        const { adminEmail } = req.body;

        let email = adminEmail

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email)

        if (!admin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        // Fetch all salons associated with the admin from registeredSalons array
        const salons = await allSalonsByAdmin(admin.registeredSalons)

        // Create a list to store the salons with their settings
        const salonsWithSettings = [];

        for (const salon of salons) {
            // Fetch settings for each salon
            const settings = await findSalonSetingsBySalonId(salon.salonId);

            // Merge the settings into the salon object
            const salonWithSettings = {
                ...salon.toObject(),  // Assuming `salon` is a Mongoose document, use `_doc` to get the plain object
                appointmentSettings: settings ? settings.appointmentSettings : " "
            };

            // Add the merged salon object to the list
            salonsWithSettings.push(salonWithSettings);
        }

        return SuccessHandler(SALONS_RETRIEVE_SUCCESS, SUCCESS_STATUS_CODE, res, { salons: salonsWithSettings })

    } catch (error) {
        next(error);
    }
}

// Desc: Salon that admin currently selected
export const getDefaultSalonByAdmin = async (req, res, next) => {
    try {
        const { adminEmail } = req.body;

        let email = adminEmail

        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email)
        if (!admin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        if (admin.salonId === 0) {
            res.status(SUCCESS_STATUS_CODE).json({
                success: false,
                message: "There are no salons present for this admin",
                response: []
            });
        } else {

            const defaultSalon = await getDefaultSalonDetailsByAdmin(admin.salonId);

            return SuccessHandler(GET_DEFAULT_SALON_SUCCESS, SUCCESS_STATUS_CODE, res, { response: defaultSalon });

        }
    }
    catch (error) {
        next(error);
    }
}

// Desc: Change default Salon ID of admin
export const changeDefaultSalonIdOfAdmin = async (req, res, next) => {
    try {
        const { adminEmail, salonId } = req.body;

        let email = adminEmail

        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email);

        if (!admin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        const salon = await getSalonBySalonId(salonId);

        if (!salon) {

            res.status(ERROR_STATUS_CODE).json({
                success: true,
                message: 'Salon not found',
            });
        }



        // Update the default salonId of the admin
        const updatedAdmin = await updateDefaultSalonId(admin, salonId);

        return SuccessHandler(CHANGE_DEFAULT_SALON_SUCCESS, SUCCESS_STATUS_CODE, res, {
            admin: {
                ...updatedAdmin.toObject(),
                salonName: salon.salonName
            },
        });


    } catch (error) {
        next(error);
    }
};

// Desc: Approve Barber of admin
export const approveBarber = async (req, res, next) => {
    try {
        let { salonId, email, isApproved } = req.body;


        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        if (isApproved === false) {
            // Fetch barber details by email and salonId
            const barber = await findBarberByBarberEmailAndSalonId(email, salonId);
        
            // Fetch barber's queue list
            const barberQlist = await qListByBarberId(salonId, barber.barberId);
        
            // If queue list exists, return an error and stop further processing
            if (barberQlist.length > 0) {
                return ErrorHandler(APPROVE_BARBER_ERROR, ERROR_STATUS_CODE, res);
            }
        
            // If no queue exists, update the barber's clock-in and online status
            const barberApprovedStatus = await approveBarberByadmin(salonId, email, isApproved);
        
            barberApprovedStatus.isClockedIn = false;
            barberApprovedStatus.isOnline = false;
        
            // Save the updated status
            await barberApprovedStatus.save();

            const salon = await getSalonBySalonId(salonId);
    
            const emailSubject = `${salon.salonName} Your Request has been approved`;
            const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Queue Position Changed</title>
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
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: SUCCESS_STATUS_CODEpx;
                    }
                    .email-content {
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-content">
                    <div class="logo">
                    <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                </div>
                        <h1 style="text-align: center;">Queue Position Changed</h1>
                        <p>Dear ${barberApprovedStatus.name},</p>
                        <p>Your request has been approved. Please reload the web page to see your dashboard.</p>
                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                            ${salon.salonName}<br>
                            Contact No.: +${salon.contactTel}<br>
                            EmailId: ${salon.salonEmail}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    
            try {
                await barberApprovalStatus(email, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
            }
    
            return SuccessHandler(APPROVE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberApprovedStatus })

        } else if (isApproved === true) {
            // Approve the barber
            const barberApprovedStatus = await approveBarberByadmin(salonId, email, isApproved);
        
            // No additional checks needed; save the approved status
            barberApprovedStatus.isApproved = true;
        
            // Save the updated status
            await barberApprovedStatus.save();

            const salon = await getSalonBySalonId(salonId);

            // const formattedDate = moment(dateJoined, 'YYYY-MM-DD').format('DD-MM-YYYY');
    
            const emailSubject = `${salon.salonName} Your Request has been approved`;
            const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Queue Position Changed</title>
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
                    }
                    .logo {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .logo img {
                        max-width: SUCCESS_STATUS_CODEpx;
                    }
                    .email-content {
                        background-color: #f8f8f8;
                        padding: 20px;
                        border-radius: 10px;
                    }
                    ul {
                        padding-left: 20px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="email-content">
                    <div class="logo">
                    <img src=${salon?.salonLogo[0]?.url} alt="Salon Logo">
                </div>
                        <h1 style="text-align: center;">Queue Position Changed</h1>
                        <p>Dear ${barberApprovedStatus.name},</p>
                        <p>Your request has been approved. Please reload the web page to see your dashboard.</p>
                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                            ${salon.salonName}<br>
                            Contact No.: +${salon.contactTel}<br>
                            EmailId: ${salon.salonEmail}
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;
    
            try {
                await barberApprovalStatus(email, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
            }
    
            return SuccessHandler(APPROVE_BARBER_SUCCESS, SUCCESS_STATUS_CODE, res, { response: barberApprovedStatus })
        }

    }
    catch (error) {
        next(error);
    }
}


// Desc: Send Verification Code
export const sendVerificationCodeForAdminMobile = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const user = await findAdminByEmailandRole(email);

        if (!user) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
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

// Desc: Change Mobile Verified Status
export const changeMobileVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;


        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email);

        if (admin && admin.verificationCode === verificationCode) {
            admin.verificationCode = '';
            admin.mobileVerified = true;
            await admin.save();

            return SuccessHandler(MOBILE_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: admin })
        }
        else {
            return ErrorHandler(MOBILE_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)
        }

    } catch (error) {
        next(error);
    }
}


// Desc: Change Admin Password 
export const adminchangepassword = async (req, res, next) => {
    try {
        let { email, oldPassword, password } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!oldPassword && !password) {
            return ErrorHandler(FILL_ALL_FIELDS_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!oldPassword) {
            return ErrorHandler(OLD_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!password) {
            return ErrorHandler(NEW_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const getAdmin = await findAdminByEmailandRole(email)

        if (!getAdmin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        if (getAdmin.AuthType === "local") {

            if (oldPassword === password) {
                return ErrorHandler(OLD_AND_NEW_PASSWORD_DONOT_MATCH, ERROR_STATUS_CODE, res)
            }

            const isMatch = await bcrypt.compare(oldPassword, getAdmin.password);

            if (!isMatch) {
                return ErrorHandler(INCORRECT_OLD_PASSWORD_ERROR, ERROR_STATUS_CODE, res)
            }

            if (password && password.length < 8) {
                return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
            }


            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);


            getAdmin.password = hashedPassword;

            getAdmin.save();

            return SuccessHandler(CHANGE_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getAdmin })
        }
        else {

            if (password && password.length < 8) {
                return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
            }

            // Hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);

            getAdmin.password = hashedPassword;

            getAdmin.save();

            return SuccessHandler(CHANGE_PASSWORD_SUCCESS, SUCCESS_STATUS_CODE, res, { response: getAdmin })
        }

    }
    catch (error) {
        next(error);
    }
}