import { createGoogleCustomer, deleteCustomer, deleteCustomerProPic, fetchedCustomers, findCustomerByEmail, findCustomerProfileById, googleLoginCustomer, saveCustomer, totalCustomerCount, updateCustomerDetails, updateCustomerProPic, uploadCustomerProPic } from "../../services/mobile/customerService.js";

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import { bulkEmail, sendCustomerMail, sendForgetPasswordMail, sendVerificationCode } from "../../utils/emailSender/emailSender.js";
import { findSalonBySalonId, getCustomerConnectedSalons, getCustomerFavouriteSalon, getSalonBySalonId } from "../../services/mobile/salonServices.js";


//Upload Profile Picture Config
import path from "path"
import fs from "fs"
import { v2 as cloudinary } from "cloudinary";
import { OAuth2Client } from "google-auth-library";
import { validateEmail } from "../../middlewares/validator.js";
import { getCustomerAppointments } from "../../services/mobile/appointmentService.js";
import { findBarbersBySalonIdforCustomerDashboard } from "../../services/mobile/barberService.js";
import { getSalonQlist } from "../../services/mobile/joinQueueService.js";
import { sendMobileVerificationCode } from "../../utils/mobileMessageSender/mobileMessageSender.js";
import { CUSTOMER_NOT_EXIST_ERROR, EMAIL_EXISTS_ERROR } from "../../constants/mobile/CustomerConstants.js";
import { EMAIL_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR, EMAIL_VERIFIED_SUCCESS, EMAIL_VERIFY_CODE_ERROR, INVALID_EMAIL_ERROR, MOBILE_VERIFIED_SUCCESS, MOBILE_VERIFY_CODE_ERROR, SEND_VERIFICATION_EMAIL_SUCCESS, SEND_VERIFICATION_MOBILE_SUCCESS, VERIFICATION_EMAIL_ERROR } from "../../constants/web/adminConstants.js";
import { ERROR_STATUS_CODE_201 } from "../../constants/mobile/StatusCodeConstants.js";
import { ErrorHandler } from "../../middlewares/ErrorHandler.js"
import { SUCCESS_STATUS_CODE } from "../../constants/web/Common/StatusCodeConstant.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { getSalonSettings } from "../../services/mobile/salonSettingsService.js";
import { ERROR_STATUS_CODE } from "../../constants/kiosk/StatusCodeConstants.js";


//DESC:CHECK WEATHER THE EMAIL ALREADY EXISTS IN THE DATABASE =======
export const checkEmail = async (req, res, next) => {
    try {
        let { email } = req.body;

        // if (!email) {
        //     return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE_201, res)
        // }

        // if (!validateEmail(email)) {
        //     return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE_201, res)
        // }

        email = email.toLowerCase();

        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        //Find existing email for a particular customer
        const existingCustomer = await findCustomerByEmail(email)

        if (existingCustomer) {
            res.status(400).json({
                success: false,
                message: "This emailid already exists",
            });
            // return ErrorHandler(EMAIL_EXISTS_ERROR, ERROR_STATUS_CODE_201, res)
        }

        else {
            res.status(200).json({
                success: true,
                message: "The email is available for signup",
                response: email,
            });
        }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

// DESC: SIGNUP A NEW CUSTOMER WHEN THE NEW EMAIL  =================
export const signUp = async (req, res, next) => {
    try {
        let {
            email,
            name,
            gender,
            dateOfBirth,
            mobileCountryCode,
            mobileNumber,
            countryFlag,
            countryCca2,
            password,
        } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        // Validate password length
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }
        if (name.length < 1 || name.length > 20) {
            return res.status(400).json({ success: false, message: "Please enter a name that is between 1 and 20 characters in length." });
        }
        // Validate mobile number format if parsed successfully
        // if (mobileNumber == null || mobileNumber == undefined || mobileNumber.length !== 10) {
        //     return res.status(201).json({ success: false, message: "Mobile number should be 10 digit" });
        // }

        // const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        const existingCustomer = await findCustomerByEmail(email)
        if (existingCustomer) {
            return res.status(400).json({
                success: false,
                message: "Customer with the email already exists",
            });
        }

        //Hashing the Password
        const hashedPassword = await bcrypt.hash(password, 10);

        //Creating the Customer Object
        const newCustomer = ({
            email,
            name,
            gender,
            mobileCountryCode: mobileCountryCode,
            countryFlag,
            countryCca2,
            dateOfBirth,
            mobileNumber,
            hashedPassword,
            // verificationCode,
        })


        //Saving the Customer
        const savedCustomer = await saveCustomer(newCustomer)

        // Format the mobile number with the country code

        // const formattedNumber = `+${mobileCountryCode}${String(mobileNumber)}`;
        // console.log(formattedNumber)

        //Sending the verification Code to Customer Registered Email
        if (savedCustomer) {
            // try {
            //     await sendMobileVerificationCode(formattedNumber, verificationCode);
            // } catch (error) {
            //     next(error);
            // }

            return res.status(200).json({
                success: true,
                message: 'Customer saved successfully',
                reponse: newCustomer
            });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Failed to save customer',
            });
        }
    } catch (error) {
        next(error);
    }
};

export const verificationCodeApi = async (req, res, next) => {
    try {
        let { email, mobileCountryCode, mobileNumber } = req.body;

        email = email.toLowerCase();

        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }

        if (!mobileCountryCode) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobilecountry code"
            });
        }

        if (!mobileNumber) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number"
            });
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        const formattedNumber = `+${mobileCountryCode}${String(mobileNumber)}`;
        console.log(formattedNumber)

        if (verificationCode) {
            try {
                await sendMobileVerificationCode(formattedNumber, verificationCode);
            } catch (error) {
                next(error);
            }

            return res.status(200).json({
                success: true,
                message: 'Verification code genereated successfully',
                response: verificationCode
            });
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'Failed to generate verification code.',
            });
        }

    } catch (error) {
        next(error);
    }

}

//DESC:MATCH VERIFICATION CODE FOR NEW CUSTOMER =============
export const matchVerificationCode = async (req, res, next) => {
    try {
        let { email, verificationCode, webFcmToken, androidFcmToken, iosFcmToken } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        // FIND THE CUSTOMER 
        const customer = await findCustomerByEmail(email)

        if (customer && customer.verificationCode === verificationCode) {
            customer.mobileVerified = true;

            // If verification code matches, clear it from the database
            customer.verificationCode = '';
            await customer.save();

            //    // Save FCM Tokens based on the switch-case logic
            // let tokenType, tokenValue;
            // switch (true) {
            //   case !!webFcmToken:
            //     tokenType = 'webFcmToken';
            //     tokenValue = webFcmToken;
            //     break;
            //   case !!androidFcmToken:
            //     tokenType = 'androidFcmToken';
            //     tokenValue = androidFcmToken;
            //     break;
            //   case !!iosFcmToken:
            //     tokenType = 'iosFcmToken';
            //     tokenValue = iosFcmToken;
            //     break;
            //   default:
            //     res.status(201).json({
            //       success: false,
            //       message: "No valid FCM tokens present"
            //     })
            //     break;
            // }

            // if (tokenType && tokenValue) {
            //   await UserTokenTable.findOneAndUpdate(
            //     { email: email },
            //     { [tokenType]: tokenValue, type: "customer" },
            //     { upsert: true, new: true }
            //   );
            // }


            return res.status(200).json({
                success: true,
                response: customer,
            });
        }

        // If verification code doesn't match or customer not found
        return res.status(400).json({
            success: false,
            message: "Verification code didn't match. Please enter a valid verification code",
        });
    } catch (error) {
        next(error);
    }
};

//DESC:SIGN IN CUSTOMER =============
export const signIn = async (req, res, next) => {
    try {
        let { email, password, webFcmToken, androidFcmToken, iosFcmToken } = req.body

        // Convert email to lowercase
        email = email.toLowerCase();

        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        // Validate password length
        if (!password || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters long"
            });
        }

        const foundUser = await findCustomerByEmail(email)

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Unauthorized User'
            })
        }

        const match = await bcrypt.compare(password, foundUser.password)

        if (!match) return res.status(400).json({
            success: false,
            message: 'Unauthorized. User password didnot match.'
        })

        //    // Save FCM Tokens based on the switch-case logic
        // let tokenType, tokenValue;
        // switch (true) {
        //   case !!webFcmToken:
        //     tokenType = 'webFcmToken';
        //     tokenValue = webFcmToken;
        //     break;
        //   case !!androidFcmToken:
        //     tokenType = 'androidFcmToken';
        //     tokenValue = androidFcmToken;
        //     break;
        //   case !!iosFcmToken:
        //     tokenType = 'iosFcmToken';
        //     tokenValue = iosFcmToken;
        //     break;
        //   default:
        //     res.status(201).json({
        //       success: false,
        //       message: "No valid FCM tokens present"
        //     })
        //     break;
        // }

        // if (tokenType && tokenValue) {
        //   await UserTokenTable.findOneAndUpdate(
        //     { email: email },
        //     { [tokenType]: tokenValue, type: "customer" },
        //     { upsert: true, new: true }
        //   );
        // }

        // const accessToken = jwt.sign(
        //     {
        //         "email": foundUser.email,
        //     },
        //     process.env.JWT_CUSTOMER_ACCESS_SECRET,
        //     { expiresIn: '1d' }
        // )

        // const refreshToken = jwt.sign(
        //     { "email": foundUser.email, "role": foundUser.role },
        //     REFRESH_TOKEN_SECRET,
        //     { expiresIn: '1d' }
        // )

        // // Create secure cookie with refresh token 
        // res.cookie('CustomerToken', accessToken, {
        //     httpOnly: true, //accessible only by web server 
        //     secure: true, //https
        //     sameSite: 'None', //cross-site cookie 
        //     maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        // })

        let salonData = null;

        if (foundUser.salonId != 0) {
            salonData = await getSalonBySalonId(foundUser.salonId);
        }

        // Send accessToken containing username and roles 
        return res.status(200).json({
            success: true,
            message: "Customer logged in Successfully",
            // accessToken,
            response: {
                ...foundUser._doc, // or foundUser.toObject() depending on Mongoose
                ...(salonData && {
                    salonName: salonData.salonName,         // or any field you want to add
                    salonlogo: salonData.salonLogo,  // change this to actual field name
                    currency: salonData.currency,
                    isoCurrencyCode: salonData.isoCurrencyCode

                })
            }
        })
    }
    catch (error) {
        next(error);
    }
};

//GOOGLE SIGNIN ===================================
export const googleCustomerSignup = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        console.log(token)

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "UnAuthorized Customer or Token not present"
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
        const existingUser = await findCustomerByEmail(payload.email);

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Customer Email already exists' })
        }

        // Create a new user
        const newUser = await createGoogleCustomer(payload.email)

        return res.status(200).json({ success: true, message: 'Customer registered successfully', response: newUser })

    }
    catch (error) {
        next(error);
    }
}


export const googleCustomerLogin = async (req, res, next) => {
    try {
        const CLIENT_ID = process.env.CLIENT_ID;

        const token = req.query.token;

        if (!token) {
            return res.status(400).json({ success: false, message: "UnAuthorized Customer or Token not present" })
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

        // const foundUser = await Customer.findOne({ email: payload.email}).exec()

        const foundUser = await googleLoginCustomer(payload.email)
        if (!foundUser) {
            return res.status(400).json({ success: false, message: 'Unauthorized Customer' })
        }

        // const accessToken = jwt.sign(
        //     {
        //         "email": foundUser.email,
        //     },
        //     JWT_ACCESS_SECRET,
        //     { expiresIn: '1d' }
        // )


        // // Create secure cookie with refresh token 
        // res.cookie('AdminToken', accessToken, {
        //     httpOnly: true, //accessible only by web server 
        //     secure: true, //https
        //     sameSite: 'None', //cross-site cookie 
        //     maxAge: 1 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
        // })
        res.status(200).json({
            success: true,
            message: "Customer Logged In Successfully",
            accessToken,
            response: foundUser
        })
    } catch (error) {
        next(error);
    }
}

//DESC:LOGOUT A USER ========================
// export const handleLogout = async (req, res, next) => {
//     try {
//         //cookie parse na use korle ata kaj korbe na
//         const cookies = req.cookies

//         // Ai line ta lagia ami logout error check korbo
//         // if(cookies) { return res.status(401).json({ message:"Unauthorize Admin" }) }

//         if (!cookies?.CustomerToken) return res.status(201).json({
//             success: false,
//             message: "Unauthorize User"
//         }) //No content
//         res.clearCookie('CustomerToken', {
//             httpOnly: true,
//             sameSite: 'None',
//             secure: true
//         })
//         res.status(200).json({
//             success: true,
//             message: 'Customer Cookie cleared'
//         })
//     } catch (error) {
//         //console.log(error);
//         next(error);
//     }
// }

//DESC:FORGET PASSWORD CUSTOMER =============

export const forgetPassword = async (req, res, next) => {
    try {
        let { email } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        const user = await findCustomerByEmail(email)
        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User with this email does not exist. Please register first",
            });
        }

        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

        user.verificationCode = verificationCode;
        await user.save();

        try {
            await sendForgetPasswordMail(email, user.name, verificationCode);
        } catch (error) {
            next(error);
        }
        return res.status(200).json({
            success: true,
            message: `Please check your email (${email}) for resetting the password`,
            // verificationCode: verificationCode
        });
    } catch (error) {
        next(error);
    }
};

//DESC:VERIFY PASSWORD RESET CODE CUSTOMER =============
export const verifyPasswordResetCode = async (req, res, next) => {
    try {
        let { email, verificationCode, } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        const user = await findCustomerByEmail(email);

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.verificationCode === verificationCode) {
            user.verificationCode = '';
            // customer.VerificationCode = ''; // Clear the verification code
            await user.save();

            res.status(200).json({
                success: true,
                message: "Verification Code successfully matched",
                response: email,
            });
        } else {
            // Verification code doesn't match
            return res.status(400).json({
                success: false,
                message: "Invalid verification code",
            });
        }
    } catch (error) {
        next(error);
    }
};

//DESC:RESET PASSWORD CUSTOMER =============
export const resetPassword = async (req, res, next) => {
    try {
        let { email, newPassword } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        // Find the user by email (assuming Customer is your Mongoose model for users)
        const user = await findCustomerByEmail(email)

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "User with this email does not exist",
            });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Set the user's password to the new hashed password
        user.password = hashedPassword;

        // Save the updated user in the database
        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Password reset successfully',
        });

    } catch (error) {
        next(error);
    }
};

//DESC: CUSTOMER CONNECT SALON AFTER LOGIN =================
export const customerConnectSalon = async (req, res, next) => {
    try {
        let { email, salonId } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        // Find the Customer by emailId
        const customer = await findCustomerByEmail(email)

        // If customer is not found
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Check if the salonId is already present in the connectedSalon array
        const salonExists = customer.connectedSalon.includes(salonId);

        if (!salonExists) {
            // If salonId is not present, push it into the connectedSalon array
            customer.connectedSalon.push(salonId);
        }

        // Update the salonId for this connection time
        customer.salonId = salonId;

        // Save the changes
        await customer.save();

        let salonData = null;

        if (salonId != 0) {
            salonData = await getSalonBySalonId(salonId);
        }

        // // Send accessToken containing username and roles 
        // return res.status(200).json({
        //     success: true,
        //     message: "Customer logged in Successfully",
        //     // accessToken,
        //     response: {
        //         ...foundUser._doc, // or foundUser.toObject() depending on Mongoose
        //         ...(salonData && {
        //             salonName: salonData.salonName,         // or any field you want to add
        //             salonlogo: salonData.salonLogo  // change this to actual field name
        //         })
        //     }
        // })

        return res.status(200).json({
            success: true,
            message: "Customer is added to the salon successfully.",
            response: {
                ...customer._doc, // or foundUser.toObject() depending on Mongoose
                ...(salonData && {
                    salonName: salonData.salonName,         // or any field you want to add
                    salonlogo: salonData.salonLogo,  // change this to actual field name
                    currency: salonData.currency,
                    isoCurrencyCode: salonData.isoCurrencyCode
                })
            }
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC: CUSTOMER DISCONNECT SALON AFTER LOGIN =================
export const customerDisconnectSalon = async (req, res, next) => {
    try {
        let { email } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();

        // Find the Customer by emailId
        const customer = await findCustomerByEmail(email)

        // If customer is not found
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Check if the salonId is already present in the connectedSalon array
        customer.salonId = 0;

        // Save the changes
        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer disconnected from the salon successfully.",
            response: customer,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC: GET ALL CUSTOMER CONNECTED SALONS =================
export const getAllSalonsByCustomer = async (req, res, next) => {
    try {
        let { customerEmail } = req.body; // Assuming customer's email is provided in the request body

        // Convert email to lowercase
        customerEmail = customerEmail.toLowerCase();

        // const email = customerEmail

        // Find the admin based on the email
        const customer = await findCustomerByEmail(customerEmail);

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Fetch all salons associated with the admin from registeredSalons array
        const salons = await getCustomerConnectedSalons(customer.connectedSalon)

        res.status(200).json({
            success: true,
            message: 'Salons retrieved successfully',
            response: salons,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: CHANGE DEFAULT SALON ID OF CUSTOMER =================
export const changeDefaultSalonIdOfCustomer = async (req, res, next) => {
    try {
        let { customerEmail, salonId } = req.body; // Assuming admin's email and new salonId are provided in the request body

        // Convert email to lowercase
        customerEmail = customerEmail.toLowerCase();

        // Find the admin based on the provided email
        const customer = await findCustomerByEmail(customerEmail);

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Update the default salonId of the admin
        customer.salonId = salonId;
        await customer.save();

        res.status(200).json({
            success: true,
            message: 'Default salon ID of admin updated successfully',
            response: customer,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC: GET ALL CUSTOMER OF A SALON=================
export const getAllCustomers = async (req, res, next) => {
    try {

        let { salonId, name, email, page = 1, limit = 3, sortField, sortOrder } = req.query


        // Convert email to lowercase
        email = email.toLowerCase();

        let query = {}

        const searchRegExpName = new RegExp('.*' + name + ".*", 'i')
        const searchRegExpEmail = new RegExp('.*' + email + ".*", 'i')

        if (salonId) {
            query.salonId = salonId
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

        const skip = Number(page - 1) * Number(limit)

        const getAllCustomers = await fetchedCustomers(query, sortOptions, skip, limit);

        const totalCustomers = await totalCustomerCount(query)

        return res.status(200).json({
            success: true,
            message: "All Customers fetched successfully",
            response: {
                allCustomers: getAllCustomers,
                totalPages: Math.ceil(totalCustomers / Number(limit)),
                currentPage: Number(page),
                totalCustomers,
            }

        })

    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: UPDATE CUSTOMER PROFILE ================
export const updateCustomer = async (req, res, next) => {
    try {
        let {
            email,
            name,
            gender,
            dateOfBirth,
            mobileCountryCode,
            countryFlag,
            countryCca2,
            password,
            mobileNumber,
        } = req.body;



        if (!email || !validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }
        // Convert email to lowercase
        email = email.toLowerCase();

        // // Validate password length
        // if (!password || password.length < 8) {
        //     return res.status(201).json({
        //         success: false,
        //         message: "Password must be at least 8 characters long"
        //     });
        // }

        //Hashing the Password
        // const hashedPassword = await bcrypt.hash(password, 10);

        const customerData = {
            email,
            name,
            gender,
            dateOfBirth,
            mobileCountryCode,
            countryFlag,
            countryCca2,
            // hashedPassword,
            mobileNumber,
        }

        const customer = await updateCustomerDetails(customerData)

        if (mobileNumber) {
            customer.mobileVerified = false;
            await customer.save()
        }

        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            response: customer
        })
    }
    catch (error) {
        next(error);
    }
}
//DESC: DELETE CUSTOMER PROFILE ================
export const deleteSingleCustomer = async (req, res, next) => {
    let { email } = req.body;
    try {
        // Convert email to lowercase
        email = email.toLowerCase();
        const customer = await findCustomerByEmail(email)
        // Check if customer exists
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Use Mongoose's deleteOne() method to delete the customer
        const deletedCustomer = await deleteCustomer(email);

        return res.status(200).json({
            success: true,
            message: "Customer deleted successfully",
            response: deletedCustomer
        });
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: UPLOAD CUSTOMER PROFILE PICTURE ================
export const uploadCustomerprofilePic = async (req, res, next) => {
    try {
        let profiles = req.files.profile;
        let email = req.body.email;

        console.log(profiles)

        // Convert email to lowercase
        email = email.toLowerCase();

        // Ensure that profiles is an array, even for single uploads
        if (!Array.isArray(profiles)) {
            profiles = [profiles];
        }

        // console.log(profiles)

        const uploadPromises = [];

        for (const profile of profiles) {
            uploadPromises.push(
                new Promise((resolve, reject) => {
                    const public_id = `${profile.name.split(".")[0]}`;

                    cloudinary.uploader.upload(profile.tempFilePath, {
                        public_id: public_id,
                        folder: "customers",
                    })
                        .then((image) => {
                            resolve({
                                public_id: image.public_id,
                                url: image.secure_url, // Store the URL
                            });
                        })
                        .catch((err) => {
                            reject(err);
                        })
                        .finally(() => {
                            // Delete the temporary file after uploading
                            fs.unlink(profile.tempFilePath, (unlinkError) => {
                                if (unlinkError) {
                                    console.error('Failed to delete temporary file:', unlinkError);
                                }
                            });
                        });
                })
            );
        }

        Promise.all(uploadPromises)
            .then(async (profileimg) => {
                // console.log(profileimg);
                const customerImage = await uploadCustomerProPic(email, profileimg)

                res.status(200).json({
                    success: true,
                    message: "Files Uploaded successfully",
                    response: customerImage
                });
            })
            .catch((err) => {
                console.error(err);
                res.status(400).json({
                    success: false,
                    message: "Image upload failed",
                });
            });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: UPDATE CUSTOMER PROFILE PICTURE ================
export const updateCustomerProfilePic = async (req, res, next) => {
    try {
        const id = req.body.id;

        const customerProfile = await findCustomerProfileById(id);

        const public_imgid = req.body.public_imgid;
        const profile = req.files.profile;

        // Validate Image
        const fileSize = profile.size / 1000;
        const fileExt = profile.name.split(".")[1];

        if (fileSize > 1000) {
            return res.status(400).json({
                success: false,
                message: "File size must be lower than 1000kb"
            });
        }

        if (!["jpg", "png", "jfif", "svg", "jpeg"].includes(fileExt)) {
            return res.status(400).json({
                success: false,
                message: "File extension must be jpg, png, jfif, svg or jpeg"
            });
        }

        // Generate a unique public_id based on the original file name
        const public_id = `${profile.name.split(".")[0]}`;

        cloudinary.uploader.upload(profile.tempFilePath, {
            public_id: public_id,
            folder: "customers",
        })
            .then(async (image) => {

                const result = await cloudinary.uploader.destroy(public_imgid);

                if (result.result === 'ok') {
                    console.log("cloud img deleted")

                } else {
                    res.status(400).json({
                        success: false,
                        message: 'Failed to delete image.'
                    });
                }

                // Delete the temporary file after uploading to Cloudinary
                fs.unlink(profile.tempFilePath, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });

                const updatedCustomer = await updateCustomerProPic(id, image)

                res.status(200).json({
                    success: true,
                    message: "Files Updated successfully",
                    response: updatedCustomer
                });

            })

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: DELETE CUSTOMER PROFILE PICTURE ================
export const deleteCustomerProfilePicture = async (req, res, next) => {
    try {
        const public_id = req.body.public_id
        const img_id = req.body.img_id

        const result = await cloudinary.uploader.destroy(public_id);

        if (result.result === 'ok') {
            console.log("cloud img deleted")

        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to delete image.'
            });
        }

        const updatedAdmin = await deleteCustomerProPic(img_id)

        if (updatedAdmin) {
            res.status(200).json({
                success: true,
                message: "Image successfully deleted"
            })
        } else {
            res.status(400).json({
                success: false,
                message: 'Image not found in the customer profile'
            });
        }
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: SEND MAIL TO CUSTOMER  ================
export const sendMailToCustomer = async (req, res, next) => {
    let { email, subject, text } = req.body;
    try {

        // Convert email to lowercase
        email = email.toLowerCase();

        const customer = await findCustomerByEmail(email);
        if (!customer) {
            res.status(400).json({
                success: false,
                message: 'Customer not found',
            });
        }
        if (customer) {
            await sendCustomerMail(email, subject, text)
            res.status(200).json({
                success: true,
                message: 'Emails have been sent successfully to customers',
            });
        }
    }
    catch (error) {
        //console.log(error);
        next(error);
    }

}

//DESC: GET CUSTOMER DETAILS ================
export const getCustomerDetails = async (req, res, next) => {
    try {
        let { email } = req.body;

        // Convert email to lowercase
        email = email.toLowerCase();
        const customer = await findCustomerByEmail(email);

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        const salon = await findSalonBySalonId(customer.salonId);
        const salonSettings = await getSalonSettings(customer.salonId)


        const customerDetails = {
            ...customer.toObject(),
            salonInfo: salon,
            salonSettings: salonSettings
        }

        return res.status(200).json({
            success: true,
            message: "Customer details found successfully",
            response: customerDetails,
        });
    }
    catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: SEND BULK MAIL TO CUSTOMERS  ================
export const sendBulkEmailToCustomers = async (req, res, next) => {
    try {
        const { subject, message, recipientEmails } = req.body;

        // Check if subject, message, and recipientEmails are present in the request body
        if (!subject || !message || !recipientEmails || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide subject, message, and a valid array of recipientEmails in the request body.',
            });
        }

        // Call your bulk email function here passing subject, message, and recipientEmails
        await bulkEmail(subject, message, recipientEmails);
        res.status(200).json({
            success: true,
            message: 'Emails have been sent successfully to customers',
        });

    } catch (error) {
        //console.log(error);
        next(error);
    }
};


//DESC: GET ALL APPOINTMENTS BY CUSTOMER ================
export const getAllAppointmentsByCustomer = async (req, res, next) => {
    try {
        const { customerEmail, salonId } = req.body;

        // Check if customerEmail and salonId are provided
        if (!salonId) {
            return res.status(400).json({
                success: false,
                message: 'SalonId is required.'
            });
        }

        // Check if customerEmail and salonId are provided
        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Customer email is required.'
            });
        }
        // Find appointments based on customerEmail and salonId
        const appointments = await getCustomerAppointments(salonId, customerEmail)

        if (!appointments || appointments.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No appointments found for this customer.'
            });
        }

        // Return the found appointments
        res.status(200).json({
            success: true,
            message: "Appointments Found for the Customer",
            response: appointments
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC: CUSTOMER DASHBOARD API ================
export const customerDashboard = async (req, res, next) => {
    const { salonId } = req.body;
    try {
        // Find salon information by salonId
        const salonInfo = await findSalonBySalonId(salonId);

        if (!salonInfo) {
            res.status(400).json({
                success: false,
                message: 'No salons found for the particular salonId.',
            });
        }

        // Find associated barbers using salonId
        const barbers = await findBarbersBySalonIdforCustomerDashboard(salonId);
        const barberCount = barbers.length;

        let barberWithLeastQueues = null;
        let minQueueCount = Infinity; // Initialize to Infinity
        let minQueueCountAsInteger;

        barbers.forEach(barber => {
            if (barber.queueCount < minQueueCount) {
                minQueueCount = barber.queueCount;
                barberWithLeastQueues = barber._id;
            }
        });


        // Check if minQueueCount is still Infinity (meaning no barber found)
        if (minQueueCount === Infinity) {
            minQueueCountAsInteger = 0; // or any default value you want
        } else {
            minQueueCountAsInteger = Math.floor(minQueueCount);
        }

        // Find queues associated with the salonId
        const salonQueues = await getSalonQlist(salonId);

        let totalQueueCount = 0;

        // Calculate total queue count for the salon
        salonQueues.forEach(queue => {
            totalQueueCount += queue.queueList.length;
        });

        res.status(200).json({
            success: true,
            message: 'Salon and barbers found successfully.',
            response: {
                salonInfo: salonInfo,
                barbers: barbers,
                barberOnDuty: barberCount,
                totalQueueCount: totalQueueCount,
                leastQueueCount: minQueueCountAsInteger
            },
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: ADD CUSTOMER FAVORITE SALON ================
export const customerFavoriteSalon = async (req, res, next) => {
    try {
        const { email, salonId } = req.body;

        // Find the Customer by emailId
        const customer = await findCustomerByEmail(email);

        // If customer is not found
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Check if the salonId is already present in the connectedSalon array
        const salonExists = customer.favoriteSalons.includes(salonId);

        if (!salonExists) {
            // If salonId is not present, push it into the connectedSalon array
            customer.favoriteSalons.push(salonId);

            // Save the changes
            await customer.save();
            res.status(200).json({
                success: true,
                message: "Your favourite salon is added successfully",
                response: customer,
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: "Your favourite salon is already added",
            });
        }

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: GET CUSTOMER FAVORITE SALONS ================
export const getAllCustomerFavoriteSalons = async (req, res, next) => {
    try {
        const { customerEmail } = req.body; // Assuming customer's email is provided in the request body

        // Find the admin based on the email
        const customer = await findCustomerByEmail(customerEmail);

        if (!customer) {
            return res.status(400).json({
                success: false,
                message: 'Customer not found',
            });
        }

        // Fetch all salons associated with the admin from registeredSalons array
        const salons = await getCustomerFavouriteSalon(customer.favoriteSalons)

        res.status(200).json({
            success: true,
            message: 'Salons retrieved successfully',
            response: salons,
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC: DELETE CUSTOMER FAVORITE SALONS ================
export const deleteCustomerFavoriteSalon = async (req, res, next) => {
    try {
        const { email, salonId } = req.body;

        // Find the Customer by emailId
        const customer = await findCustomerByEmail(email);

        // If customer is not found
        if (!customer) {
            return res.status(400).json({
                success: false,
                message: "Customer not found",
            });
        }

        // Check if the salonId is already present in the favoriteSalons array
        const salonExists = customer.favoriteSalons.includes(salonId);

        if (!salonExists) {
            // If salonId is not present, respond accordingly
            res.status(400).json({
                success: false,
                message: "The salon is not in your favorites.",
            });
        } else {
            // If salonId is present, remove it from the favoriteSalons array
            customer.favoriteSalons.pull(salonId);

            // Save the changes
            await customer.save();

            res.status(200).json({
                success: true,
                message: "The salon has been removed from your favorites successfully.",
                response: customer,
            });
        }
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

// Desc: Send Verification Code
export const sendVerificationCodeForCustomerMobile = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const user = await findCustomerByEmail(email);

        if (!user) {
            return ErrorHandler(CUSTOMER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
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
export const changeCustomerMobileVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;


        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        if (!validateEmail(email)) {
            return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const customer = await findCustomerByEmail(email);

        if (customer && customer.verificationCode === verificationCode) {
            customer.verificationCode = '';
            customer.mobileVerified = true;
            await customer.save();

            return SuccessHandler(MOBILE_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: customer })
        }
        else {
            return ErrorHandler(MOBILE_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)
        }

    } catch (error) {
        next(error);
    }
}


// Desc: Customer Send Verification Code
export const sendVerificationCodeForCustomerEmail = async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        const user = await findCustomerByEmail(email);

        if (!user) {
            return ErrorHandler(CUSTOMER_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
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

// Desc: Change Customer Email Verifiied Status
export const changeCustomerEmailVerifiedStatus = async (req, res, next) => {
    try {
        let { email, verificationCode } = req.body;

        if (!email) {
            return ErrorHandler(EMAIL_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
        }

        email = email.toLowerCase();

        const customer = await findCustomerByEmail(email);

        if (customer && customer.verificationCode === verificationCode) {
            customer.verificationCode = '';
            customer.emailVerified = true;
            await customer.save();

            return SuccessHandler(EMAIL_VERIFIED_SUCCESS, SUCCESS_STATUS_CODE, res, { response: customer });
        }

        return ErrorHandler(EMAIL_VERIFY_CODE_ERROR, ERROR_STATUS_CODE, res)

    } catch (error) {
        next(error);
    }
}


