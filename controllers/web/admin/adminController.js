import { deleteAdmin, deleteAdminProPic, findAdminProfileById, findAdminByEmailandRole, resetPassword, updateAdmin, updateAdminProPic, updateDefaultSalonId, uploadAdminProPic, createAdmin, createGoogleAdmin, updateGoogleAdmin, googleLoginAdmin } from "../../../services/web/admin/adminService.js";

import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import bcrypt from "bcrypt";
import libphonenumber from 'google-libphonenumber';

import { barberApprovalStatus, emailWithNodeMail, sendVerificationCode } from "../../../utils/emailSender/emailSender.js";
import { allSalonsByAdmin, getDefaultSalonDetailsByAdmin, getSalonBySalonId } from "../../../services/web/admin/salonService.js";


//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { approveBarberByadmin } from "../../../services/web/barber/barberService.js";
import { validateEmail } from "../../../middlewares/validator.js";
import { findSalonSetingsBySalonId } from "../../../services/web/salonSettings/salonSettingsService.js";
import { v4 as uuidv4 } from 'uuid';

import moment from "moment"
import { sendMobileVerificationCode } from "../../../utils/mobileMessageSender/mobileMessageSender.js";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


//DESC: REGISTER ADMIN ====================
export const registerAdmin = async (req, res, next) => {
    try {
        let { email, password } = req.body

        // Convert email to lowercase
        email = email.toLowerCase();

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
                message: "Invalid Email Format"
            });
        }

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
        const existingUser = await findAdminByEmailandRole(email)

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Admin already exists"
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create a new user
        const newUser = await createAdmin(email, hashedPassword)

        res.status(200).json({
            success: true,
            message: 'Admin registered successfully',
            newUser
        })
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:LOGIN A ADMIN =========================
export const loginAdmin = async (req, res, next) => {
    try {
        let { email, password } = req.body

        // Convert email to lowercase
        email = email.toLowerCase();

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
                message: "Invalid Email Format"
            });
        }

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

        const foundUser = await findAdminByEmailandRole(email)

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

        const accessToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )

        // const refreshToken = jwt.sign(
        //     { "email": foundUser.email, "role": foundUser.role },
        //     REFRESH_TOKEN_SECRET,
        //     { expiresIn: '1d' }
        // )

        // Create secure cookie with refresh token 
        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: "Admin Logged In Successfully",
            accessToken,
            foundUser
        })
    }
    catch (error) {
        next(error);
    }
};


//DESC:LOGOUT A ADMIN ========================
export const handleLogoutAdmin = async (req, res, next) => {
    try {
        //cookie parse na use korle ata kaj korbe na
        const cookies = req.cookies

        // Ai line ta lagia ami logout error check korbo
        // if(cookies) { return res.status(401).json({ message:"Unauthorize Admin" }) }

        if (!cookies?.AdminToken) return res.status(404).json({
            success: false,
            message: "Unauthorize Admin"
        }) //No content
        res.clearCookie('AdminToken', {
            httpOnly: true,
            sameSite: 'None',
            secure: true
        })
        res.status(200).json({
            success: true,
            message: 'Admin Cookie cleared'
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:FORGOT PASSWORD SENDING EMAIL TO USER ===========
export const handleForgetPasswordAdmin = async (req, res, next) => {
    try {
        let { email } = req.body

        // Convert email to lowercase
        email = email.toLowerCase();

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


        const user = await findAdminByEmailandRole(email)

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

        // const CLIENT_URL = "http://localhost:5173"

        try {
            await emailWithNodeMail(email, user.name, CLIENT_URL, "adminchangepassword", resetToken)
        } catch (error) {
            res.status(500).json({
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
        // console.log(error);
        next(error);
    }
}

//DESC:RESET PASSWORD =================================
export const handleResetPasswordAdmin = async (req, res, next) => {
    try {
        //creating token hash
        const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex")

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

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        })

    } catch (error) {
        console.log(error);
        next(error);
    }
}

//GOOGLE SIGNUP ===================================
export const googleAdminSignup = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        console.log(token)

        if (!token) {
            return res.status(404).json({
                success: false,
                message: "UnAuthorized Admin or Token not present"
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

        console.log("Google payload ", payload)

        // Check if the email is already registered
        const existingUser = await findAdminByEmailandRole(payload.email)

        if (existingUser) {
            return res.status(404).json({ success: false, message: 'Admin Email already exists' })
        }

        // Create a new user
        const newUser = await createGoogleAdmin(payload.email)

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            newUser
        })

    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

//GOOGLE SIGNIN ===================================
export const googleAdminLogin = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        if (!token) {
            return res.status(404).json({ success: false, message: "UnAuthorized Admin or Token not present" })
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

        const foundUser = await googleLoginAdmin(payload.email)

        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'Unauthorized Admin' })
        }

        const accessToken = jwt.sign(
            {

                "email": foundUser.email,
                "role": foundUser.role,
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )


        // Create secure cookie with refresh token 
        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })
        res.status(201).json({
            success: true,
            message: "Admin Logged In Successfully",
            accessToken,
            foundUser
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

export const updateAdminInfo = async (req, res, next) => {
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
                message: "Invalid Email Format"
            });
        }

        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a name that is between 1 and 20 characters in length."
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
        const foundUser = await findAdminByEmailandRole(email)

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Unauthorized Admin'
            })
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

        // const refreshToken = jwt.sign(
        //     { "email": email, "role": foundUser.role },
        //     REFRESH_TOKEN_SECRET,
        //     { expiresIn: '1d' }
        // )

        // Create secure cookie with refresh token 
        res.cookie('AdminToken', accessToken, {
            httpOnly: true, //accessible only by web server 
            secure: true, //https
            sameSite: 'None', //cross-site cookie 
            maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        })

        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: 'Admin information updated successfully',
            accessToken,
            updatedAdmin
        })
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:REFRESH TOKEN ==============================
export const refreshTokenControllerAdmin = async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: "Refresh token not provided." });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const newAccessToken = jwt.sign({ user: decoded.user }, process.env.JWT_ACCESS_SECRET, { expiresIn: "20s" });

        // Set the new access token as an HTTP-only cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            expires: new Date(Date.now() + 20 * 1000),
            secure: true,
            sameSite: "None"
        });

        res.status(201).json({ success: true, message: "New accessToken generated" });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:DELETE ADMIN =================================
export const deleteSingleAdmin = async (req, res, next) => {
    let { email } = req.body;

    // Convert email to lowercase
    email = email.toLowerCase();

    try {
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email Format"
            });
        }

        const admin = await deleteAdmin(email);
        res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
            response: admin
        })

    }
    catch (error) {
        console.log(error);
        next(error);
    }
}


//DESC:UPDATE ADMIN =================================
export const updateAdminAccountDetails = async (req, res, next) => {
    try {

        let { name, gender, email, countryCode, mobileNumber, dateOfBirth } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email Format"
            });
        }


        if (name && (name.length < 1 || name.length > 20)) {
            return res.status(400).json({
                success: false,
                message: "Please enter name between 1 to 20 characters."
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

        // Get the current admin details
        const currentAdmin = await findAdminByEmailandRole(email);

        // Check if the mobile number has changed
        if (formattedNumberAsNumber && currentAdmin.mobileNumber !== formattedNumberAsNumber) {
            currentAdmin.mobileVerified = false;
        }

        const admin = await updateAdmin(name, gender, email, countryCode, formattedNumberAsNumber, dateOfBirth, currentAdmin.mobileVerified);

        res.status(200).json({
            success: true,
            message: "Admin updated successfully",
            response: admin
        })

    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:UPLOAD ADMIN PROFILE PICTURE ============================
export const uploadAdminprofilePic = async (req, res, next) => {
    try {
     

        let profiles = req.files.profile;
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email does not exist"
            });
        }

        if (!req.files || !req.files.profile) {
            return res.status(400).json({ success: false, message: "Admin profile image empty." });
        }

        // console.log('Received profiles:', profiles); 

        if (!Array.isArray(profiles)) {
            profiles = [profiles]; // Ensure profiles is always an array
        }

        // Allowed file extensions
        const allowedExtensions = ["jpg", "png", "jfif", "svg", "jpeg", "webp"];
        // Maximum file size in bytes (e.g., 2MB)
        const maxFileSize = 2 * 1024 * 1024;

        // Find the existing admin by email and role
        const existingAdmin = await findAdminByEmailandRole(email);

        if (!existingAdmin) {
            // console.log('Admin not found');
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Validate each profile image before uploading
        for (const profile of profiles) {
            const extension = path.extname(profile.name).toLowerCase().slice(1);
            if (!allowedExtensions.includes(extension)) {
                return res.status(400).json({ success: false, message: "File extension must be jpg, png, jfif, svg, jpeg, webp" });
            }

            if (profile.size > maxFileSize) {
                return res.status(400).json({ success: false, message: "File size must be lower than 2MB" });
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
                        if (err) console.error('Failed to delete temporary file:', err);
                    });

                    return { public_id: image.public_id, url: image.secure_url };
                });
        });

        const profileimg = await Promise.all(uploadPromises);

        // Update the admin profile picture without deleting old image
        const adminImage = await uploadAdminProPic(email, profileimg);

        return res.status(200).json({
            success: true,
            message: "File Uploaded successfully",
            adminImage,
        });

    } catch (error) {
        // console.log('Error uploading profile picture:', error);
        next(error);
    }
};


//DESC:UPDATE ADMIN PROFILE PICTURE ============================
export const updateAdminProfilePic = async (req, res, next) => {
    try {
        const id = req.body.id;
        const public_imgid = req.body.public_imgid;
        const profile = req.files.profile;
        const salonId = req.body.salonId;

        const adminProfile = await findAdminProfileById(id);

        // Validate Image
        const fileSize = profile.size / 1000;
        const fileExt = profile.name.split(".")[1];

        if (fileSize > 2048) {
            return res.status(400).json({ success: false, message: "File size must be lower than 2mb" });
        }

        if (!["jpg", "png", "jfif", "svg", "jpeg", "webp"].includes(fileExt)) {
            return res.status(400).json({ success: false, message: "File extension must be jpg or png" });
        }

        // Generate a unique public_id based on the original file name
        const public_id = `${profile.name.split(".")[0]}`;
        const folderPath = `admins/salon-${salonId}`

        cloudinary.uploader.upload(profile.tempFilePath, {
            public_id: public_id,
            folder: folderPath
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

                const updatedAdmin = await updateAdminProPic(id, image)

                // Find the newly added advertisement
                const updatedAdminImage = updatedAdmin.profile.find(adm => adm.public_id === image.public_id);

                res.status(200).json({
                    success: true,
                    message: "Files Updated successfully",
                    response: updatedAdminImage
                });

            })

    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:DELETE ADMIN PROFILE PICTURE ============================
export const deleteAdminProfilePicture = async (req, res, next) => {
    try {
        const { public_id, img_id } = req.body;

        const { updatedAdmin, deletedImage } = await deleteAdminProPic(img_id);

        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(public_id);

        if (result.result !== 'ok') {
            return res.status(404).json({
                success: false,
                message: 'Failed to delete image from Cloudinary'
            });
        }

        console.log("Cloudinary image deleted");

        if (updatedAdmin) {
            return res.status(200).json({
                success: true,
                message: "Image successfully deleted",
                response: deletedImage // Include the updated admin data if necessary
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Image not found in the admin profile'
            });
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};

//DESC:SEND ADMIN EMAIL VERIFICATION CODE ============================
export const sendVerificationCodeForAdminEmail = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email not found"
            });
        }


        // Convert email to lowercase
        email = email.toLowerCase();

        const user = await findAdminByEmailandRole(email);
        if (!user) {
            return res.status(404).json({
                success: false,
                response: "Email does not exist",
            });
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        try {
            await sendVerificationCode(email, user.name, verificationCode);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Failed to send verification code',
                error: error.message
            });
        }

        return res.status(200).json({
            success: true,
            message: `Please check your email (${email}) for verification code.`,
        });
    } catch (error) {
        // console.log(error);
        next(error);
    }
}

//DESC:CHANGE ADMIN EMAIL VERIFIED STATUS ============================
export const changeEmailVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        // FIND THE CUSTOMER 
        const admin = await findAdminByEmailandRole(email);

        if (admin && admin.verificationCode === verificationCode) {
            // If verification code matches, clear it from the database
            admin.verificationCode = '';
            admin.emailVerified = true;
            await admin.save();

            return res.status(200).json({
                success: true,
                message: "Your email has been verified successfully.",
                response: admin,
            });
        }

        // If verification code doesn't match or customer not found
        return res.status(400).json({
            success: false,
            response: "Verification Code didn't match",
            message: "Enter a valid Verification code",
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:GET ALL SALONS BY ADMIN ============================
export const getAllSalonsByAdmin = async (req, res, next) => {
    try {
        const { adminEmail } = req.body; // Assuming admin's email is provided in the request body

        let email = adminEmail

        // Convert email to lowercase
        email = email.toLowerCase();

        // Find the admin based on the email
        const admin = await findAdminByEmailandRole(email)

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found',
            });
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

        if (salonsWithSettings) {
            res.status(200).json({
                success: true,
                message: 'Salons retrieved successfully',
                salons: salonsWithSettings,
            });
        }
        else {
            res.status(200).json({
                success: false,
                message: 'No salons to show',
                salons: [],
            });
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:GET DEFAULT SALON BY ADMIN ============================
export const getDefaultSalonByAdmin = async (req, res, next) => {
    try {
        const { adminEmail } = req.body;

        let email = adminEmail

        // Convert email to lowercase
        email = email.toLowerCase();

        const admin = await findAdminByEmailandRole(email)
        if (!admin) {
            res.status(404).json({
                success: false,
                message: 'No admin found.',
            });
        }

        if (admin.salonId === 0) {
            res.status(200).json({
                success: false,
                message: "There are no salons present for this admin",
                response: []
            });
        } else {

            const defaultSalon = await getDefaultSalonDetailsByAdmin(admin.salonId);

            res.status(200).json({
                success: true,
                message: "Salon Found",
                response: defaultSalon
            })
        }
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

//DESC:CHANGE ADMIN DEFAULT SALON ============================
export const changeDefaultSalonIdOfAdmin = async (req, res, next) => {
    try {
        const { adminEmail, salonId } = req.body; // Assuming admin's email and new salonId are provided in the request body

        let email = adminEmail

        // Convert email to lowercase
        email = email.toLowerCase();

        // Find the admin based on the provided email
        const admin = await findAdminByEmailandRole(email);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found',
            });
        }

        const salon = await getSalonBySalonId(salonId);

        if (!salon) {

            res.status(400).json({
                success: true,
                message: 'Salon not found',
            });
        }



        // Update the default salonId of the admin
        const updatedAdmin = await updateDefaultSalonId(admin, salonId);

        res.status(200).json({
            success: true,
            message: 'Default salon ID of admin updated successfully',
            admin: {
                ...updatedAdmin.toObject(),
                salonName: salon.salonName
            },
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

//DESC: APPROVE BARBER================
export const approveBarber = async (req, res, next) => {
    try {
        let { salonId, email, isApproved } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Please ensure the email field is filled correctly."
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email Format"
            });
        }

        const barberApprovedStatus = await approveBarberByadmin(salonId, email, isApproved)

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
                    max-width: 200px;
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
            console.log('Email sent successfully.');
        } catch (error) {
            console.error('Error sending email:', error);
            // Handle error if email sending fails
        }

        res.status(200).json({
            success: true,
            message: "Barber has been approved",
            response: barberApprovedStatus
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}


//DESC:SEND ADMIN MOBILE NUMBER VERIFICATION CODE ============================
export const sendVerificationCodeForAdminMobile = async (req, res, next) => {
    try {
        let { email } = req.body;

        // Validate input fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // Convert email to lowercase
        email = email.toLowerCase();

        const user = await findAdminByEmailandRole(email);

        if (!user) {
            return res.status(404).json({
                success: false,
                response: "Email does not exist.",
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
            // console.log(error);
            next(error);
        }

        return res.status(200).json({
            success: true,
            message: `Please check your mobile inbox for verification code.`,
        });
    } catch (error) {
        // console.log(error);
        next(error);
    }
}

//DESC:CHANGE ADMIN MOBILE VERIFIED STATUS ============================
export const changeMobileVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        // Validate input fields
        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        // Convert email to lowercase
        email = email.toLowerCase();

        // FIND THE CUSTOMER 
        const admin = await findAdminByEmailandRole(email);

        if (admin && admin.verificationCode === verificationCode) {
            // If verification code matches, clear it from the database
            admin.verificationCode = '';
            admin.mobileVerified = true;
            await admin.save();

            return res.status(200).json({
                success: true,
                message: "Your mobile number has been verified successfully.",
                response: admin,
            });
        }
        else {
            // If verification code doesn't match or customer not found
            return res.status(400).json({
                success: false,
                message: "Enter a valid Verification code",
            });
        }

    } catch (error) {
        console.log(error);
        next(error);
    }
}


//DESC:CHANGE ADMIN PASSWORD ============================
export const adminchangepassword = async (req, res, next) => {
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
                message: "Invalid Email Format"
            });
        }

        if(!oldPassword && !password){
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

        const getAdmin = await findAdminByEmailandRole(email)

        if (!getAdmin) {
            return res.status(404).json({
                success: false,
                message: "Admin not found."
            });
        }

        if (getAdmin.AuthType === "local") {

            if (oldPassword === password) {
                return res.status(400).json({
                    success: false,
                    message: "Old and new password can't be same."
                });
            }

            //Match the old password
            const isMatch = await bcrypt.compare(oldPassword, getAdmin.password);

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


            getAdmin.password = hashedPassword;

            getAdmin.save();

            res.status(200).json({
                success: true,
                message: "Admin password updated successfully",
                response: getAdmin
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

            getAdmin.password = hashedPassword;

            getAdmin.save();

            res.status(200).json({
                success: true,
                message: "Admin password updated successfully",
                response: getAdmin
            })
        }

    }
    catch (error) {
        console.log(error);
        next(error);
    }
}