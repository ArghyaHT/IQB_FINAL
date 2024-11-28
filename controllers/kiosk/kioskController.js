import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"


import { connectAdminKiosk, findAdminByEmailandRole, findAdminByEmailandSalonId } from "../../services/kiosk/admin/adminServices.js";
import { availableBarberAutoJoin, barberClockInStatus, barberOnlineStatus, changeBarberStatusAtSalonOffline, decreaseBarberEWT, decreaseBarberEWTWhenQCancel, fetchedBarbers, findBaberByBarberId, findBarberByBarberEmailAndSalonId, findBarberByEmailAndRole, findBarberByEmailAndSalonId, getAllSalonBarbers, getBarberByBarberId, getBarbersForQ, getBarbersWithMulServices, updateBarberEWT } from "../../services/kiosk/barber/barberService.js";
import { allSalonsByAdmin, allSalonServices, checkSalonExists, getDefaultSalonDetailsEmail, getSalonBySalonId, getSalonOnlineStatus, getSalonTimeZone, mobileBookingAvailabilityStatus, salonOnlineStatus } from "../../services/kiosk/salon/salonServices.js";
import { findCustomersToMail, findSalonQueueList, getSalonQlist, qListByBarberId } from "../../services/kiosk/queue/queueService.js";
import { addCustomerToQueue } from "../../utils/queue/queueUtils.js";
import { sendQueuePositionEmail } from "../../utils/emailSender/emailSender.js";
import { addQueueHistory, addQueueHistoryWhenCanceled, findSalonQueueListHistory, statusCancelQ, updateServed } from "../../services/kiosk/queue/queueHistoryService.js";
import { getAdvertisements } from "../../services/kiosk/advertisements/advertisementService.js";
import { getBarberAttendence } from "../../services/kiosk/barberAttendence/barberAttencenceService.js";
import { barberLogInTime, barberLogOutTime } from "../../utils/attendence/barberAttendence.js";
import { validateEmail } from "../../middlewares/validator.js";

import moment from "moment";
import { ADMIN_NOT_EXIST_ERROR, EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR, EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, INVALID_EMAIL_ERROR, PASSWORD_LENGTH_ERROR, PASSWORD_NOT_PRESENT_ERROR, SIGNIN_SUCCESS } from "../../constants/web/adminConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../constants/kiosk/StatusCodeConstants.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { BARBER_SIGNIN_SUCCESS, LOGOUT_SUCCESS } from "../../constants/kiosk/KioskConstants.js";
import { SALONS_RETRIEVED_SUCESS } from "../../constants/web/SalonConstants.js";


//DESC:LOGIN AN ADMIN =========================
export const loginKiosk = async (req, res, next) => {
    try {
        let { email, password, role } = req.body

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
        if( role === "Admin"){

            const foundUser = await findAdminByEmailandRole(email)

            if (!foundUser) {
                return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
            }
    
            const match = await bcrypt.compare(password, foundUser.password)
    
            if (!match) {
                return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
            }
    
            const adminKioskToken = jwt.sign(
                {
                    "email": foundUser.email,
                    "role": foundUser.role
                },
                process.env.JWT_ADMIN_ACCESS_SECRET,
                { expiresIn: '1d' }
            )
        // Send accessToken containing username and roles 
        return SuccessHandler(SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            token:adminKioskToken,
            foundUser
        })
        }
        else{
            const foundUser = await findBarberByEmailAndRole(email)

            if (!foundUser) {
                return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)
            }
    
            const match = await bcrypt.compare(password, foundUser.password)
    
            if (!match) {
                return ErrorHandler(EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, ERROR_STATUS_CODE, res)

            }
    
            const barberKioskToken = jwt.sign(
                {
                    "email": foundUser.email,
                    "role": foundUser.role
                },
                process.env.JWT_BARBER_ACCESS_SECRET,
                { expiresIn: '1d' }
            )
    
        // Send accessToken containing username and roles 
        return SuccessHandler(BARBER_SIGNIN_SUCCESS, SUCCESS_STATUS_CODE, res, {
            token: barberKioskToken,
            foundUser
        })
        }   
      
    }
    catch (error) {
        // //console.log(error);
        next(error);
    }
};

//DESC:LOGOUT An Admin ========================
export const logoutKiosk = async (req, res, next) => {
    try {
        // Check if adminToken is present in request body
        const token = req.body.token;

        // Clear adminToken from request body if present
        if (token) {
            delete req.body.token; // Remove adminToken from request body
            // Perform any additional action if needed (e.g., logging out from another system)
        }

          // Send accessToken containing username and roles 
          return SuccessHandler(LOGOUT_SUCCESS, SUCCESS_STATUS_CODE, res)
    } catch (error) {
        // //console.log(error);
        next(error);
    }
};

//DESC:GET ALL SALONS BY ADMIN ============================
export const getAllSalonsByAdmin = async (req, res, next) => {
    try {
        const { adminEmail } = req.body; // Assuming admin's email is provided in the request body

        const email = adminEmail
        // Find the admin based on the email
        const admin = await findAdminByEmailandRole(email)

        if (!admin) {
            return ErrorHandler(ADMIN_NOT_EXIST_ERROR, ERROR_STATUS_CODE, res)
        }

        // Fetch all salons associated with the admin from registeredSalons array
        const salons = await allSalonsByAdmin(admin.registeredSalons)

        return SuccessHandler(SALONS_RETRIEVED_SUCESS, SUCCESS_STATUS_CODE, res, {salons: salons})

    } catch (error) {
        // //console.log(error);
        next(error);
    }
}

//DESC:GET ALL SALONS BY ADMIN ============================
export const adminConnectKiosk = async (req, res, next) => {
    try {
        const { adminEmail, salonId } = req.body; // Assuming admin's email is provided in the request body

        if (salonId === null || undefined) {
            return res.status(404).json({
                success: false,
                message: 'Please select a valid salon.',
            });
        }


        const email = adminEmail
        // Find the admin based on the email
        const foundUser = await findAdminByEmailandRole(email)

        if (!foundUser) {
            return res.status(404).json({
                message: 'Admin not found.',
            });
        }

        // Fetch all salons associated with the admin from registeredSalons array
        const admin = await connectAdminKiosk(foundUser.email, salonId)

        const salon = await getSalonBySalonId(salonId)

        return res.status(200).json({
            message: 'Admin connected successfully',
            response: salon
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET DEFAULT SALON BY ADMIN ============================
export const getDefaultSalon = async (req, res, next) => {
    try {
        const { email, role} = req.body;

        if(role === "Admin"){
            const admin = await findAdminByEmailandRole(email)
            if (!admin) {
                res.status(404).json({
                    success: false,
                    message: 'Admin not found',
                });
            }
            else {
                const defaultSalon = await getDefaultSalonDetailsEmail(admin.salonId)
                res.status(200).json({
                    success: true,
                    message: "Salon found successfully",
                    response: defaultSalon
                })
            }
        }
        else{
            const barber = await findBarberByEmailAndRole(email)
            if (!barber) {
                res.status(404).json({
                    success: false,
                    message: 'Barber not found',
                });
            }
            else {
                const defaultSalon = await getDefaultSalonDetailsEmail(barber.salonId)
                res.status(200).json({
                    success: true,
                    message: "Salon found successfully",
                    response: defaultSalon
                })
            }
        }
       
    }
    catch (error) {
        // //console.log(error);
        next(error);
    }
}

//DESC:CHANGE SALON ONLINE STATUS=================
export const changeSalonOnlineStatus = async (req, res, next) => {
    try {
        const { salonId, isOnline } = req.body;
        // Now, you can perform your operations after verifying the token
        const updatedSalon = await salonOnlineStatus(salonId, isOnline);

        if (!updatedSalon) {
            return res.status(404).json({
                success: false,
                message: "Salon not found"
            });
        }
        if (isOnline === true) {
            return res.status(200).json({ success: true, message: "Salon is currently online.", response: updatedSalon });
        }
        else {

            updatedSalon.mobileBookingAvailability = false;
            await updatedSalon.save();

            await changeBarberStatusAtSalonOffline(salonId);

            return res.status(200).json({ success: true, message: "Salon is currently offline.", response: updatedSalon });
        }

    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:GET ALL BARBERS BY SALONID =================
export const getAllBarberbySalonIdKiosk = async (req, res, next) => {
    try {
        const { salonId, email } = req.query;
        let query = {}; // Filter for isDeleted set to false

        const searchRegExpEmail = new RegExp('.*' + email + ".*", 'i');

        if (salonId) {
            query.salonId = salonId;
        }

        if (email) {
            query.$or = [
                { email: { $regex: searchRegExpEmail } },
            ];
        }

        const getAllBarbers = await fetchedBarbers(query);

        if (getAllBarbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Barbers not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Barbers retrieved successfully",
            response: getAllBarbers
        });
    } catch (error) {
        //console.log(error);
        next(error);
    }
};

//DESC:LOGIN A BARBER =========================
export const barberLoginKiosk = async (req, res, next) => {
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
                message: "Invalid Email"
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


        const foundUser = await findBarberByEmailAndRole(email)

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Email or password donot match'
            })
        }


        if (foundUser.isApproved === false) {
            return res.status(400).json({
                success: false,
                message: 'Barber is not approved'
            })
        }

        const match = await bcrypt.compare(password, foundUser.password)

        if (!match) return res.status(400).json({
            success: false,
            message: 'Email or password donot match'
        })

        const barberToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '1d' }
        )



        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: "Barber Logged-In Successfully",
            barberToken,
            foundUser,

        })
    }
    catch (error) {
        // //console.log(error);
        next(error);
    }
};

//GOOGLE ADMIN SIGNIN ===================================
export const googleAdminLoginKiosk = async (req, res, next) => {
    try {
        const CLIENT_ID = '508224318018-quta6u0n38vml0up7snscdrtl64555l1.apps.googleusercontent.com'

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

        const foundUser = await findAdminByEmailandRole(payload.email)

        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'Unauthorized access. Please sign up as a admin first.' })
        }

        const adminKiyoskToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_ADMIN_ACCESS_SECRET,
            { expiresIn: '1d' }
        )
        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: "Admin Logged In Successfully",
            adminToken: adminKiyoskToken,
            foundUser,
        })

        // const accessToken = jwt.sign(
        //     {

        //         "email": foundUser.email,
        //         "role": foundUser.role,
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
        // res.status(201).json({
        //     success: true,
        //     message: "Admin Logged In Successfully",
        //     accessToken,
        //     foundUser
        // })
    } catch (error) {
        console.log(error)
        next(error);
    }
}

//GOOGLE BARBER SIGNIN ===================================
export const googleBarberLoginKiosk = async (req, res, next) => {
    try {
        const CLIENT_ID = '508224318018-quta6u0n38vml0up7snscdrtl64555l1.apps.googleusercontent.com'

        const token = req.query.token;

        if (!token) {
            return res.status(404).json({ success: false, message: "UnAuthorized Barber or Token not present" })
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

        const foundUser = await findBarberByEmailAndRole(payload.email)

        if (!foundUser) {
            return res.status(401).json({ success: false, message: 'Unauthorized access. Please sign up as a barber first.' })
        }

        const salonOnlineStatus = await getSalonOnlineStatus(foundUser.salonId)

        const barberToken = jwt.sign(
            {
                "email": foundUser.email,
                "role": foundUser.role
            },
            process.env.JWT_BARBER_ACCESS_SECRET,
            { expiresIn: '1d' }
        )

        // Send accessToken containing username and roles 
        res.status(201).json({
            success: true,
            message: "Barber Logged In Successfully",
            barberToken,
            foundUser,
            isSalonOnline: salonOnlineStatus,
        })
    } catch (error) {
        //console.log(error);
        next(error);
    }
}

//DESC:CHANGE BARBER ONLINE STATUS ===========================
export const changeBarberOnlineStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isOnline, barberToken } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline.' });
        }

        // Extract token from the body
        if (!barberToken) {
            return res.status(400).json({ success: false, message: 'BarberToken missing' });
        }

        // Verify the token
        jwt.verify(
            barberToken,
            process.env.JWT_BARBER_ACCESS_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(403).json({ success: false, message: 'Access forbidden for barber.' });
                }
                req.email = decoded.email;
                req.role = decoded.role;

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
                    message: "Barber online/offline status changed successfully.",
                    response: updatedBarber
                });
            }
        );
    } catch (error) {
        // //console.log(error);
        next(error);
    }
};

//DESC:SINGLE JOIN QUEUE ================
export const joinQueueKiosk = async (req, res, next) => {
    try {
        let { salonId, name, customerEmail, joinedQType, mobileNumber, mobileCountryCode, methodUsed, barberName, barberId, services } = req.body;

        const salon = await getSalonTimeZone(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: "Cant join queue as salon offline" });
        }

        if (name.length < 1 || name.length > 20) {
            return res.status(400).json({ success: false, message: "Please enter name between 1 to 20 characters" });
        }

        if (customerEmail && !validateEmail(customerEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        if (mobileNumber) {
            // Using Number() function
            mobileNumber = Number(mobileNumber);
        }

        const isVipServiceRequested = services.some(service => service.vipService);

        let totalServiceEWT = 0;
        for (const service of services) {
            totalServiceEWT += service.barberServiceEWT || service.serviceEWT;
        }

        let existingQueue;

        if (barberName === "anybarber" && barberId === 0) {

            // Handle auto-join logic for any barber
            const availableBarber = await availableBarberAutoJoin(salonId, services.map(service => service.serviceId), totalServiceEWT);

            if (!availableBarber) {
                return res.status(400).json({
                    success: false,
                    message: 'No barbers available',
                });
            }

            if (availableBarber.isOnline === false || availableBarber.isClockedIn === false || availableBarber.isActive === false) {
                return res.status(400).json({ success: false, message: "The Barber is unable to take queue" });
            }

            existingQueue = await findSalonQueueList(salonId);

            const time = moment().local().format('HH:mm:ss');

            const salon = await getSalonTimeZone(salonId);

            const timeZoneData = salon.timeZone;

            const timeZoneParts = timeZoneData.split('+');

            // Extracting the data after '+'
            const offset = timeZoneParts[1];

            // Parse offset into hours and minutes
            const [offsetHours, offsetMinutes] = offset.split(':').map(Number);

            // Add offset to the time
            const adjustedTime = moment(time, 'HH:mm:ss').add(offsetHours, 'hours').add(offsetMinutes, 'minutes').format('HH:mm:ss');

            const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

            const newQueue = {
                customerName: name,
                customerEmail,
                joinedQ: true,
                joinedQType,
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime,
                methodUsed,
                mobileCountryCode,
                mobileNumber: mobileNumber,
                barberName: availableBarber.name,
                barberId: availableBarber.barberId,
                services: services.map(service => ({
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.servicePrice,
                    vipService: service.vipService
                })),
                serviceEWT: totalServiceEWT,
                serviceType: isVipServiceRequested ? "VIP" : "Regular",
                customerEWT: isVipServiceRequested ? 0 : (availableBarber.barberEWT - totalServiceEWT),
            };

            existingQueue = await addCustomerToQueue(salonId, newQueue, availableBarber.barberId);

            // Extract customer's waiting time and queue position from the result
            const { queue, customerEWT, qPosition } = existingQueue;

            const formattedDate = moment(newQueue.dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

            const emailSubject = `${salon.salonName}: ${formattedDate} - Your Queue Information`;
            const emailBody = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Salon Queue Details</title>
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
                        <h1 style="text-align: center;">Salon Queue Details</h1>
                        <p>Dear ${name},</p>
                        <p>Thank you for joining the queue at ${salon.salonName} salon. Here are your queue details:</p>
                        <ul>
                            <li>Customer Name: ${name}</li>
                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                            <li>Service Type: ${newQueue.serviceType}</li>
                            <li>Barber Name: ${barberName}</li>
                            <li>Service Time: ${newQueue.serviceEWT} mins(approx.)</li>
                            </li>Service Price: $${totalServicePrice}</li>
                            <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                            <li>Queue Position: ${qPosition}</li>
                        </ul>
                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                        <p>Best regards,</p>
                        <p style="margin: 0; padding: 10px 0 5px;">
                        ${salon.salonName}<br>
                        Contact No.: ${salon.contactTel}<br>
                        EmailId: ${salon.salonEmail}
                    </div>
                </div>
            </body>
            </html>
        `;

            try {
                await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }

        } else {

            const getBarber = await findBaberByBarberId(barberId);

            if (getBarber.isClockedIn === false) {
                return res.status(400).json({ success: false, message: "Barber unable to take queue" });
            }

            // Handle when a specific barber is provided
            const updatedBarber = await updateBarberEWT(salonId, barberId, totalServiceEWT);

            if (!updatedBarber) {
                return res.status(400).json({
                    success: false,
                    message: "Barber offline",
                });
            }

            existingQueue = await findSalonQueueList(salonId);

            const time = moment().local().format('HH:mm:ss');

            const salon = await getSalonTimeZone(salonId);


            const timeZoneData = salon.timeZone;
  
            let offsetHours = 0;
            let offsetMinutes = 0;
        
            // Handle special case of UTC±00, UTC+00, or UTC-00
            if (timeZoneData === 'UTC±00' || timeZoneData === 'UTC+00' || timeZoneData === 'UTC-00') {
                offsetHours = 0;
                offsetMinutes = 0;
            } else {
                const sign = timeZoneData.includes('+') ? '+' : '-';
                const timeZoneParts = timeZoneData.split(sign);
                const offset = timeZoneParts[1];
                [offsetHours, offsetMinutes] = offset.split(':').map(Number);
        
                if (sign === '-') {
                    offsetHours = -offsetHours;
                    offsetMinutes = -offsetMinutes;
                }
            }

            // Add offset to the time
            const adjustedTime = moment(time, 'HH:mm:ss').add(offsetHours, 'hours').add(offsetMinutes, 'minutes').format('HH:mm:ss');

            const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

            const newQueue = {
                customerName: name,
                customerEmail,
                joinedQ: true,
                joinedQType,
                dateJoinedQ: new Date(),
                timeJoinedQ: adjustedTime,
                methodUsed,
                mobileCountryCode,
                barberName,
                mobileNumber: mobileNumber,
                barberId,
                services: services.map(service => ({
                    serviceId: service.serviceId,
                    serviceName: service.serviceName,
                    servicePrice: service.servicePrice,
                    vipService: service.vipService
                })),
                serviceEWT: totalServiceEWT,
                serviceType: isVipServiceRequested ? "VIP" : "Regular",
                customerEWT: isVipServiceRequested ? 0 : (updatedBarber.barberEWT - totalServiceEWT),
            };

            existingQueue = await addCustomerToQueue(salonId, newQueue, barberId);

            // Extract customer's waiting time and queue position from the result
            const { queue, customerEWT, qPosition } = existingQueue;

            const formattedDate = moment(newQueue.dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

            const emailSubject = `${salon.salonName}: ${formattedDate} - Your Queue Information`;
            const emailBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Salon Queue Details</title>
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
                <h1 style="text-align: center;">Salon Queue Details</h1>
                <p>Dear ${name},</p>
                <p>Thank you for joining the queue at ${salon.salonName} salon. Here are your queue details:</p>
                <ul>
                    <li>Customer Name: ${name}</li>
                    <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                    <li>Service Type: ${newQueue.serviceType}</li>
                    <li>Barber Name: ${barberName}</li>
                    <li>Service Time: ${newQueue.serviceEWT} mins(approx.)</li>
                    <li>Service Price: $${totalServicePrice} </li>
                    <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                    <li>Queue Position: ${qPosition}</li>
                </ul>
                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                <p>Best regards,</p>
                <p style="margin: 0; padding: 10px 0 5px;">
                ${salon.salonName}<br>
                Contact No.: ${salon.contactTel}<br>
                EmailId: ${salon.salonEmail}
            </p>
            </p>
            </div>
        </div>
    </body>
    </html>
`;

            try {
                await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
            } catch (error) {
                console.error('Error sending email:', error);
                // Handle error if email sending fails
            }
        }

        res.status(200).json({
            success: true,
            message: "Join Queue successfully",
            response: existingQueue,
        });
    } catch (error) {
        next(error);
    }
};

//DESC:GET ALL SALON SERVICES ======================
export const getAllSalonServices = async (req, res, next) => {
    const { salonId } = req.query;
    try {
        const salonServices = await allSalonServices(salonId)

        res.status(200).json({
            success: true,
            message: "Salon services retrieved successfully",
            response: salonServices
        })
    }
    catch (error) {
        next(error);
    }
}

//DESC:GET SALON QUEUELIST ================
export const getQueueListBySalonId = async (req, res, next) => {
    try {
        const salonId = parseInt(req.query.salonId, 10);

        //To find the queueList according to salonId and sort it according to qposition
        const getSalon = await getSalonQlist(salonId)

        if (getSalon.length > 0) {
            // Access the sorted queueList array from the result
            const sortedQueueList = getSalon[0].queueList;

            res.status(200).json({
                success: true,
                message: "Queue-list retrieved successfully",
                response: sortedQueueList,
            });
        } else {
            res.status(404).json({
                success: false,
                message: "Salon not found",
                response: []
            });
        }

    }
    catch (error) {
        next(error);
    }
}

//DESC:GET AVAILABLE BARBERS FOR QUEUE ================
export const getAvailableBarbersForQKiosk = async (req, res, next) => {
    try {
        const { salonId } = req.query;

        const anybarberServices = await allSalonServices(salonId);

        //To find the available barbers for the queue
        const availableBarbers = await getBarbersForQ(salonId);

        if (availableBarbers.length === 0) {
            res.status(404).json({
                success: false,
                message: 'No barbers available'
            });
        }
        else {

            // Find the barber with the minimum barberEwt
            let minEwtBarber = availableBarbers[0];
            for (let i = 1; i < availableBarbers.length; i++) {
                if (availableBarbers[i].barberEWT < minEwtBarber.barberEWT) {
                    minEwtBarber = availableBarbers[i];
                }
            }

            let anybarber = {
                name: "anybarber",
                email: "anybarber@gmail.com",
                barberId: 0,
                queueCount: minEwtBarber.queueCount,
                role: minEwtBarber.role,
                barberEWT: minEwtBarber.barberEWT,
                isClockedIn: minEwtBarber.isClockedIn,
                isOnline: minEwtBarber.isClockedIn,
                isDeleted: minEwtBarber.isDeleted,
                isApproved: minEwtBarber.isApproved,
                isActive: minEwtBarber.isActive,
                barberServices: anybarberServices.map(service => ({
                    ...service.toObject(),
                    barberServiceEWT: service.serviceEWT // renaming serviceEWT to barberServiceEWT
                })),
            }

            // Insert anybarber at the beginning of availableBarbers array
            availableBarbers.unshift(anybarber);

            res.status(200).json({
                success: true,
                message: 'Barbers retrieved successfully',
                response: availableBarbers
            });
        }
    }
    catch (error) {
        next(error);
    }
}


//DESC:GET AVAILABLE BARBERS By MULTIPLE SERVICE IDS ================
export const getBarberByServicesKiosk = async (req, res, next) => {
    try {
        const { salonId, serviceIds } = req.body; // Assuming serviceIds are passed as query parameters, e.g., /barbers?serviceIds=1,2,3

        if (!serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please select at least one service.' });
        }

        const barbers = await getBarbersWithMulServices(salonId, serviceIds);

        if (!barbers || barbers.length === 0) {
            return res.status(404).json({
                success: false,
                response: 'No barbers found'
            });
        }

        return res.status(200).json({
            success: true,
            message: "Barbers retrieved sucessFully",
            response: barbers
        });

    } catch (error) {
        next(error);
    }
};

//DESC:GET ALL BARBER SERVICES BY BARBERID ===================
export const getBarberServicesByBarberIdKiosk = async (req, res, next) => {
    try {
        const { barberId, salonId } = req.body;

        let barberServices = []

        if (barberId === 0) {

            let anyBarberServices = []

            anyBarberServices = await allSalonServices(salonId);

            barberServices = anyBarberServices.map(service => {
                const { serviceEWT, ...rest } = service.toObject(); // Destructure serviceEWT from service
                return {
                    ...rest, // Spread the remaining properties
                    barberServiceEWT: serviceEWT // renaming serviceEWT to barberServiceEWT
                };
            });
        }
        else {
            const barbers = await getBarberByBarberId(barberId)

            barberServices = barbers.barberServices;

            if (!barbers) {
                return res.status(404).json({
                    success: false,
                    message: "barber not found"
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "Barber services retrieved successfully",
            response: barberServices
        });
    }
    catch (error) {
        // //console.log(error);
        next(error);
    }

}

//DESC:BARBER SERVED API ================
export const barberServedQueueKiosk = async (req, res, next) => {
    try {
        let { salonId, barberId, barberEmail, password, services, _id } = req.body;

        if (!barberEmail && !password ) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        if (!barberEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(barberEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }
            // Convert email to lowercase
            barberEmail = barberEmail.toLowerCase();

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


        const foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);

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

        const updatedByBarberEmail = foundUser.email;

        const updatedByBarberName = foundUser.name;

        const queue = await findSalonQueueList(salonId);
        let currentServiceEWT = 0;
        let updatedQueueList = [];

        if (queue && queue.queueList && queue.queueList.length > 0) {
            for (const element of queue.queueList) {

                // Check if all requested services match the services in the queue element
                const allServicesMatch = services.every(requestedService => {
                    return element.services.some(queueService => queueService.serviceId === requestedService.serviceId);
                });

                console.log(element._id)

                if (
                    element.qPosition === 1 &&
                    allServicesMatch &&
                    element.barberId === barberId &&
                    element._id.toString() === _id
                ) {
                    currentServiceEWT = element.serviceEWT;
                    const salon = await findSalonQueueListHistory(salonId);

                    if (!salon) {
                        await addQueueHistory(salonId, element, updatedByBarberEmail, updatedByBarberName)
                    } else {
                        salon.queueList.push({
                            ...element.toObject(), // Convert Mongoose document to plain object
                            updatedByBarberEmail: updatedByBarberEmail,
                            updatedByBarberName: updatedByBarberName
                        });
                        await salon.save();
                    }
                    // Update the status to "served" for the served queue in JoinedQueueHistory
                    await updateServed(salonId, element._id);

                    const salonDetails = await getSalonTimeZone(salonId);
                    // Construct email subject and body for the customer being served
                    const servedEmailSubject = '🎉 Served Successfully! 🎉';
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
                                font-size: 20px; /* Adjust the font size as needed */
                            }
                            .logo {
                                text-align: center;
                                margin-bottom: 20px;
                            }
                            .logo img {
                                max-width: 200px;
                            }
                        </style>
                    </head>
                    <body>
                    
                        <div class="container">
                            <div class="logo">
                                <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                            </div>
                            <h1 class="header">🎉 You have been served successfully! 🎉</h1>
                            <div class="details">
                                <p>Dear ${element.customerName},</p>
                                <p>We are excited to inform you that you have been served successfully. Here are the details:</p>
                                <ul>
                                    <li>Salon Name: ${salonDetails.salonName}</li>
                                    <li>Barber Name: ${element.barberName}</li>
                                    <li>Service Time: ${element.serviceEWT} mins(approx.)</li>
                                </ul>
                            </div>
                            <div class="visit">
                                <p>DO VISIT AGAIN</p>
                            </div>
                            <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                            <p>Best regards,<br>
                            ${salonDetails.salonName}<br>
                            Contact No.: ${salonDetails.contactTel}<br>
                            EmailId: ${salonDetails.salonEmail}</p>
                        </div>
                    </body>
                    </html>
`;

                    // Send email to the customer who is getting served
                    try {
                        await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
                        console.log('Email sent to the served customer successfully.');
                    } catch (error) {
                        console.error('Error sending email to the served customer:', error);
                        // Handle error if email sending fails
                    }


                } else if (element.barberId === barberId && element._id.toString() !== _id) {
                    updatedQueueList.push({
                        ...element.toObject(),
                        qPosition: element.qPosition > 1 ? element.qPosition - 1 : element.qPosition,
                        customerEWT: element.qPosition > 1 ? element.customerEWT - currentServiceEWT : element.customerEWT,
                    });
                } else {
                    updatedQueueList.push(element);
                }
            }

            if (currentServiceEWT > 0) {
                queue.queueList = updatedQueueList;
                await queue.save();

                const updatedBarber = await decreaseBarberEWT(salonId, barberId, currentServiceEWT)



                const customers = await findCustomersToMail(salonId, barberId)

                if (customers && customers.length > 0) {
                    for (const customer of customers) {
                        if (customer.queueList && Array.isArray(customer.queueList)) {
                            for (const queueItem of customer.queueList) {
                                console.log('Queue Item:', queueItem);
                                const salon = await getSalonTimeZone(salonId);
                                const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);
                                
                                const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                    <p>Dear ${customerName},</p>
                                    <p>Your queue position has changed. Here are the updated details:</p>
                                    <ul>
                                        <li>Customer Name: ${customerName}</li>
                                        <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                        <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                        <li>Barber Name: ${barberName}</li>
                                        <li>Service Price: $${totalServicePrice}</li>
                                        <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                        <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                        <li>New Queue Position: ${qPosition}</li>
                                    </ul>
                                    <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                    <p>Best regards,</p>
                                    <p style="margin: 0; padding: 10px 0 5px;">
                                        ${salon.salonName}<br>
                                        Contact No.: ${salon.contactTel}<br>
                                        EmailId: ${salon.salonEmail}
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                    `;

                                try {
                                    await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                    console.log('Email sent successfully.');
                                } catch (error) {
                                    console.error('Error sending email:', error);
                                }
                            }
                        }
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: 'Customer serve successfully.',
                });
            }
        }

        return res.status(404).json({
            success: false,
            message: 'Queue position is not 1.',
        });
    } catch (error) {
        next(error);
    }
}

//DESC:CANCEL QUEUE ================
export const cancelQueueKiosk = async (req, res, next) => {
    try {
        let { salonId, barberEmail, password, barberId, _id } = req.body;

        if (!barberEmail && !password ) {
            return res.status(400).json({
                success: false,
                message: "Please enter email and password."
            });
        }

        if (!barberEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(barberEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email"
            });
        }


        // Convert email to lowercase
        barberEmail = barberEmail.toLowerCase();

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
        const foundUser = await findBarberByBarberEmailAndSalonId(barberEmail, salonId);

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Email or password donot match.'
            });
        }

        const match = await bcrypt.compare(password, foundUser.password);

        if (!match) {
            return res.status(400).json({
                success: false,
                message: 'Email or password donot match.'
            });
        }

        const updatedByBarberEmail = foundUser.email;
        const updatedByBarberName = foundUser.name;

        const updatedQueue = await findSalonQueueList(salonId);

        if (!updatedQueue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found.',
            });
        }

        const canceledQueueIndex = updatedQueue.queueList.findIndex(queue => queue._id.toString() === _id);

        if (canceledQueueIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found.',
            });
        }

        const canceledServiceEWT = updatedQueue.queueList[canceledQueueIndex].serviceEWT;

        // Remove the canceled queue from the queue list
        const canceledQueue = updatedQueue.queueList.splice(canceledQueueIndex, 1)[0];

        // Decrement qPosition for subsequent queues and adjust customerEWT
        updatedQueue.queueList.forEach(queue => {
            if (queue.barberId === barberId && queue.qPosition > canceledQueue.qPosition) {
                queue.qPosition -= 1;
                queue.customerEWT -= canceledServiceEWT;
            }
        });

        await updatedQueue.save();

        // Updating the barber
        await decreaseBarberEWTWhenQCancel(salonId, barberId, canceledServiceEWT);

        // Adding the cancelled queue to the joinqueuehistory with status cancelled
        let salon = await findSalonQueueListHistory(salonId);

        if (!salon) {
            salon = await addQueueHistoryWhenCanceled(salonId, canceledQueue, updatedByBarberEmail, updatedByBarberName);
        } else {
            salon.queueList.push({
                ...canceledQueue.toObject(), // Convert Mongoose document to plain object
                updatedByBarberEmail: updatedByBarberEmail,
                updatedByBarberName: updatedByBarberName,
                isAdmin: false
            });
            await salon.save();
        }

        // Update the status to "cancelled" for the canceled queue in JoinedQueueHistory
        await statusCancelQ(salonId, _id);

        const salonDetails = await getSalonTimeZone(salonId);

        // Construct email subject and body for the customer being served
        const servedEmailSubject = 'Sorry Your Queue Has Been Canceled 🚫';
        const servedEmailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Queue Canceled</title>
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
                    font-size: 20px; /* Adjust the font size as needed */
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 200px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                </div>
                <h1 class="header">Your Queue Has Been Canceled</h1>
                <div class="details">
                    <p>Dear ${canceledQueue.customerName},</p>
                    <p>We regret to inform you that your queue has been canceled. Here are the details:</p>
                    <ul>
                        <li>Salon Name: ${salonDetails.salonName}</li>
                        <li>Barber Name: ${canceledQueue.barberName}</li>
                        <li>Service Estimated Waiting time: ${canceledQueue.serviceEWT} mins</li>
                    </ul>
                </div>
                <div class="visit">
                    <p>We apologize for any inconvenience caused. Please visit us again!</p>
                </div>
                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                <p>Best regards,<br>
                ${salonDetails.salonName}<br>
                Contact No.: ${salonDetails.contactTel}<br>
                EmailId: ${salonDetails.salonEmail}</p>
            </div>
        </body>
        </html>
        `;

        // Send email to the customer who is getting cancelled
        try {
            await sendQueuePositionEmail(canceledQueue.customerEmail, servedEmailSubject, servedEmailBody);
        } catch (error) {
            console.error('Error sending email to the served customer:', error);
        }

        const customers = await findCustomersToMail(salonId, barberId);

        if (customers && customers.length > 0) {
            for (const customer of customers) {
                if (customer.queueList && Array.isArray(customer.queueList)) {
                    for (const queueItem of customer.queueList) {
                        console.log('Queue Item:', queueItem);

                        const salon = await getSalonTimeZone(salonId);

                        const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                        const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                        const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                        const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                    <p>Dear ${customerName},</p>
                                    <p>Your queue position has changed. Here are the updated details:</p>
                                    <ul>
                                        <li>Customer Name: ${customerName}</li>
                                        <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                        <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                        <li>Barber Name: ${barberName}</li>
                                        <li>Service Price: $${totalServicePrice}</li>
                                        <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                        <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                        <li>New Queue Position: ${qPosition}</li>
                                    </ul>
                                    <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                    <p>Best regards,</p>
                                    <p style="margin: 0; padding: 10px 0 5px;">
                                        ${salon.salonName}<br>
                                        Contact No.: ${salon.contactTel}<br>
                                        EmailId: ${salon.salonEmail}
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `;

                        try {
                            await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                            console.log('Email sent successfully.');
                        } catch (error) {
                            console.error('Error sending email:', error);
                        }
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Customer cancel successfully',
            updatedQueueList: updatedQueue.queueList,
        });

    } catch (error) {
        // //console.log(error);
        next(error);
    }
};


//DESC:BARBER SERVED API ================
export const getAllAdvertisementsKiosk = async (req, res, next) => {
    try {
        const { salonId } = req.body;

        // Find SalonSettings by salonId and retrieve only the advertisements field
        const salonSettings = await getAdvertisements(salonId)

        // Sort advertisements array in descending order
        const sortedAdvertisements = salonSettings.advertisements;

        if (!salonSettings) {
            return res.status(404).json({ success: false, message: "Salon not found" });
        }

        res.status(200).json({
            success: true,
            message: 'Advertisements retrieved successfully',
            advertisements: sortedAdvertisements
        });
    } catch (error) {
        next(error);
    }
}


//DESC:BARBER ATTENDENCE API ================
export const getAttendenceByBarberIdKiosk = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        if (salonId === 0) {
            return res.status(404).json({ success: false, message: "Barber not connected to salon" })
        }

        const attendance = await getBarberAttendence(salonId, barberId);

        if (!attendance) {
            return res.status(400).json({ success: false, message: "Attendence list not found" });
        }
        // Sort attendance records in descending order by date
        attendance.attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.status(200).json({
            success: true,
            message: 'Attendence list retrieved successfully',
            response: attendance
        });

    } catch (error) {
        // //console.log(error);
        next(error);
    }
}


//DESC:CHANGE BARBER CLOCKIN STATUS ===========================
export const changeBarberClockInStatus = async (req, res, next) => {
    try {
        const { barberId, salonId, isClockedIn, barberToken } = req.body;

        const salon = await getSalonBySalonId(salonId);

        if (salon.isOnline === false) {
            return res.status(400).json({ success: false, message: 'Salon is offline.' });
        }

        // Extract token from the body
        if (!barberToken) {
            return res.status(400).json({ success: false, message: 'Barber token is missing' });
        }

        // Verify the token
        jwt.verify(
            barberToken,
            process.env.JWT_BARBER_ACCESS_SECRET,
            async (err, decoded) => {
                if (err) {
                    return res.status(403).json({ success: false, message: 'Forbidden Barber' });
                }
                req.email = decoded.email;
                req.role = decoded.role;

                if (isClockedIn === true) {
                    // Now, you can proceed with the logic after verifying the token
                    const updatedBarber = await barberClockInStatus(barberId, salonId, isClockedIn);

                    if (!updatedBarber) {
                        return res.status(404).json({ success: false, message: "Barber not found" });
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
                            return res.status(404).json({ success: false, message: "Barber not found" });
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
                            message: "Cant clock out as customers in the queue",
                        });
                    }

                }

            }
        );
    } catch (error) {
        // //console.log(error);
        next(error);
    }
};

//DESC:CHANGE BARBER CLOCKIN STATUS ===========================
export const changeMobileBookingAvailabilityOfSalon = async (req, res, next) => {
    try {
        const { salonId, mobileBookingAvailability } = req.body;

        if (!salonId) {
            return res.status(404).json({ success: false, message: "Salon Not found" });
        }

        const salon = await getSalonBySalonId(salonId)

        if (salon.isOnline === false) {
            return res.status(404).json({ success: false, message: "Salon offline so mobile booking status cant be changed" });
        }

        // Now, you can proceed with the logic after verifying the token
        const updatedSalon = await mobileBookingAvailabilityStatus(salonId, mobileBookingAvailability);

        if (!updatedSalon) {
            return res.status(404).json({ success: false, message: "Mobile booking status cant be changed" });
        }

        if (mobileBookingAvailability === true) {
            return res.status(200).json({
                success: true,
                message: "Mobile booking status online",
                response: updatedSalon
            });
        }
        else {
            return res.status(200).json({
                success: true,
                message: "Mobile booking status offline",
                response: updatedSalon
            });
        }


    } catch (error) {
        next(error);
    }
};


export const salonAccountLogin = async (req, res, next) => {
    try {
        let { email, password, role, salonId } = req.body

    
        if (!email && !password ) {
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

        if (role === "Admin") {

            const foundUser = await findAdminByEmailandSalonId(email, salonId)

            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email or password donot match'
                })
            }

            const match = await bcrypt.compare(password, foundUser.password)

            if (!match) return res.status(400).json({
                message: false,
                message: 'Email or password donot match'
            })

            res.status(201).json({
                success: true,
                message: "Admin Logged In Successfully",
                foundUser,
            })
        }
        else {
            const foundUser = await findBarberByEmailAndSalonId(email, salonId)

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

            res.status(201).json({
                success: true,
                message: "Barber Logged-In Successfully",
                foundUser,
            })
        }

    }
    catch (error) {
        next(error);
    }
}

// DESC: GET ALL BARBERS BY SALONID =================
export const getAllBarberbySalonId = async (req, res, next) => {
    try {
        const { salonId } = req.query;

        if (Number(salonId) === 0) {
            return res.status(200).json({
                success: false,
                message: "No barbers available",
                getAllBarbers: []
            });
        }

        // Check if the salon exists in the database
        const salonExists = await checkSalonExists(salonId); // Assuming checkSalonExists is a function that checks if the salon exists
        if (salonExists === null) {
            return res.status(400).json({
                success: false,
                message: "Salon not found.",
            });
        }

        // Fetch all barbers for the salonId
        const getAllBarbers = await getAllSalonBarbers(salonId);

        if (getAllBarbers && getAllBarbers.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Barbers retrieved successfully",
                getAllBarbers: getAllBarbers,
            });
        } else {
            return res.status(200).json({
                success: false,
                message: "No barbers found.",
                getAllBarbers: [],
            });
        }

    } catch (error) {
        next(error);
    }
};



//DESC:BARBER SERVED API ================
export const barberServedQueueTvApp = async (req, res, next) => {
    try {
        let { salonId, barberId, adminEmail, services, _id } = req.body;

    
        if (!adminEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(adminEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        adminEmail = adminEmail.toLowerCase();

        if (adminEmail) {

            const foundUser = await findAdminByEmailandSalonId(adminEmail, salonId);

            if (!foundUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin not found'
                })
            }

            const updatedByBarberEmail = foundUser.email;

            const updatedByBarberName = foundUser.name;

            const queue = await findSalonQueueList(salonId);
            let currentServiceEWT = 0;
            let updatedQueueList = [];

            if (queue && queue.queueList && queue.queueList.length > 0) {
                for (const element of queue.queueList) {

                    // Check if all requested services match the services in the queue element
                    const allServicesMatch = services.every(requestedService => {
                        return element.services.some(queueService => queueService.serviceId === requestedService.serviceId);
                    });

                    if (
                        element.qPosition === 1 &&
                        allServicesMatch &&
                        element.barberId === barberId &&
                        element._id.toString() === _id
                    ) {
                        currentServiceEWT = element.serviceEWT;
                        const salon = await findSalonQueueListHistory(salonId);

                        if (!salon) {
                            await addQueueHistory(salonId, element, updatedByBarberEmail, updatedByBarberName)
                        } else {
                            salon.queueList.push({
                                ...element.toObject(), // Convert Mongoose document to plain object
                                updatedByBarberEmail: updatedByBarberEmail,
                                updatedByBarberName: updatedByBarberName,
                                isAdmin: true
                            });
                            await salon.save();
                        }
                        // Update the status to "served" for the served queue in JoinedQueueHistory
                        await updateServed(salonId, element._id);

                        const salonDetails = await getSalonBySalonId(salonId);
                        // Construct email subject and body for the customer being served
                        const servedEmailSubject = '🎉 Served Successfully! 🎉';
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
                                    font-size: 20px; /* Adjust the font size as needed */
                                }
                                .logo {
                                    text-align: center;
                                    margin-bottom: 20px;
                                }
                                .logo img {
                                    max-width: 200px;
                                }
                            </style>
                        </head>
                        <body>
                        
                            <div class="container">
                                <div class="logo">
                                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                                </div>
                                <h1 class="header">🎉 You have been served successfully! 🎉</h1>
                                <div class="details">
                                    <p>Dear ${element.customerName},</p>
                                    <p>We are excited to inform you that you have been served successfully. Here are the details:</p>
                                    <ul>
                                        <li>Salon Name: ${salonDetails.salonName}</li>
                                        <li>Barber Name: ${element.barberName}</li>
                                        <li>Service Time: ${element.serviceEWT} mins(approx.)</li>
                                    </ul>
                                </div>
                                <div class="visit">
                                    <p>DO VISIT AGAIN</p>
                                </div>
                                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                <p>Best regards,<br>
                                ${salonDetails.salonName}<br>
                                Contact No.: ${salonDetails.contactTel}<br>
                                EmailId: ${salonDetails.salonEmail}</p>
                            </div>
                        </body>
                        </html>
    `;

                        // Send email to the customer who is getting served
                        try {
                            await sendQueuePositionEmail(element.customerEmail, servedEmailSubject, servedEmailBody);
                            console.log('Email sent to the served customer successfully.');
                        } catch (error) {
                            console.error('Error sending email to the served customer:', error);
                            // Handle error if email sending fails
                        }


                    } else if (element.barberId === barberId && element._id.toString() !== _id) {
                        updatedQueueList.push({
                            ...element.toObject(),
                            qPosition: element.qPosition > 1 ? element.qPosition - 1 : element.qPosition,
                            customerEWT: element.qPosition > 1 ? element.customerEWT - currentServiceEWT : element.customerEWT,
                        });
                    } else {
                        updatedQueueList.push(element);
                    }
                }

                if (currentServiceEWT > 0) {
                    queue.queueList = updatedQueueList;
                    await queue.save();

                    const updatedBarber = await decreaseBarberEWT(salonId, barberId, currentServiceEWT)



                    const customers = await findCustomersToMail(salonId, barberId)

                    if (customers && customers.length > 0) {
                        for (const customer of customers) {
                            if (customer.queueList && Array.isArray(customer.queueList)) {
                                for (const queueItem of customer.queueList) {
                                    console.log('Queue Item:', queueItem);
                                    const salon = await getSalonBySalonId(salonId);
                                    const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                                    const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                                    const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                                    const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                        <p>Dear ${customerName},</p>
                                        <p>Your queue position has changed. Here are the updated details:</p>
                                        <ul>
                                            <li>Customer Name: ${customerName}</li>
                                            <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                            <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                            <li>Barber Name: ${barberName}</li>
                                            <li>Service Price: $${totalServicePrice}</li>
                                            <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                            <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                            <li>New Queue Position: ${qPosition}</li>
                                        </ul>
                                        <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                        <p>Best regards,</p>
                                        <p style="margin: 0; padding: 10px 0 5px;">
                                            ${salon.salonName}<br>
                                            Contact No.: ${salon.contactTel}<br>
                                            EmailId: ${salon.salonEmail}
                                        </p>
                                    </div>
                                </div>
                            </body>
                            </html>
                        `;

                                    try {
                                        await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                                        console.log('Email sent successfully.');
                                    } catch (error) {
                                        console.error('Error sending email:', error);
                                        // Handle error if email sending fails
                                    }
                                }
                            }
                        }
                    }

                    return res.status(200).json({
                        success: true,
                        message: 'Customer served from the queue successfully.',
                    });
                }
            }
            return res.status(404).json({
                success: false,
                message: 'Queue position is not 1.',
            });
        }
    } catch (error) {
        next(error);
    }
};


//DESC:CANCEL QUEUE ================
export const cancelQueueTvApp= async (req, res, next) => {
    try {
        let { salonId, adminEmail, barberId, _id } = req.body;

         if (!adminEmail) {
            return res.status(400).json({
                success: false,
                message: "Please enter your email."
            });
        }

        if (!validateEmail(adminEmail)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email "
            });
        }

        adminEmail = adminEmail.toLowerCase();

        const foundUser = await findAdminByEmailandRole(adminEmail);

        if (!foundUser) {
            return res.status(400).json({
                success: false,
                message: 'Email or password donot match.'
            });
        }


        const updatedByAdminEmail = foundUser.email;
        const updatedByAdminName = foundUser.name;

        const updatedQueue = await findSalonQueueList(salonId);

        if (!updatedQueue) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found',
            });
        }

        const canceledQueueIndex = updatedQueue.queueList.findIndex(queue => queue._id.toString() === _id);

        if (canceledQueueIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Queue not found',
            });
        }

        const canceledServiceEWT = updatedQueue.queueList[canceledQueueIndex].serviceEWT;

        // Remove the canceled queue from the queue list
        const canceledQueue = updatedQueue.queueList.splice(canceledQueueIndex, 1)[0];

        // Decrement qPosition for subsequent queues and adjust customerEWT
        updatedQueue.queueList.forEach(queue => {
            if (queue.barberId === barberId && queue.qPosition > canceledQueue.qPosition) {
                queue.qPosition -= 1;
                queue.customerEWT -= canceledServiceEWT;
            }
        });

        await updatedQueue.save();

        // Updating the barber
        await decreaseBarberEWTWhenQCancel(salonId, barberId, canceledServiceEWT);

        // Adding the cancelled queue to the joinqueuehistory with status cancelled
        let salon = await findSalonQueueListHistory(salonId);

        if (!salon) {
            salon = await addQueueHistoryWhenCanceled(salonId, canceledQueue, updatedByAdminEmail, updatedByAdminName);
        } else {
            salon.queueList.push({
                ...canceledQueue.toObject(), // Convert Mongoose document to plain object
                updatedByBarberEmail: updatedByAdminEmail,
                updatedByBarberName: updatedByAdminName,
                isAdmin: true
            });
            await salon.save();
        }

        // Update the status to "cancelled" for the canceled queue in JoinedQueueHistory
        await statusCancelQ(salonId, _id);

        const salonDetails = await getSalonTimeZone(salonId);

        // Construct email subject and body for the customer being served
        const servedEmailSubject = 'Sorry Your Queue Has Been Canceled 🚫';
        const servedEmailBody = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Queue Canceled</title>
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
                    font-size: 20px; /* Adjust the font size as needed */
                }
                .logo {
                    text-align: center;
                    margin-bottom: 20px;
                }
                .logo img {
                    max-width: 200px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">
                    <img src="${salonDetails?.salonLogo[0]?.url}" alt="Salon Logo">
                </div>
                <h1 class="header">Your Queue Has Been Canceled</h1>
                <div class="details">
                    <p>Dear ${canceledQueue.customerName},</p>
                    <p>We regret to inform you that your queue has been canceled. Here are the details:</p>
                    <ul>
                        <li>Salon Name: ${salonDetails.salonName}</li>
                        <li>Barber Name: ${canceledQueue.barberName}</li>
                        <li>Service Estimated Waiting time: ${canceledQueue.serviceEWT} mins</li>
                    </ul>
                </div>
                <div class="visit">
                    <p>We apologize for any inconvenience caused. Please visit us again!</p>
                </div>
                <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                <p>Best regards,<br>
                ${salonDetails.salonName}<br>
                Contact No.: ${salonDetails.contactTel}<br>
                EmailId: ${salonDetails.salonEmail}</p>
            </div>
        </body>
        </html>
        `;

        // Send email to the customer who is getting cancelled
        try {
            await sendQueuePositionEmail(canceledQueue.customerEmail, servedEmailSubject, servedEmailBody);
            console.log('Email sent to the served customer successfully.');
        } catch (error) {
            console.error('Error sending email to the served customer:', error);
            // Handle error if email sending fails
        }

        const customers = await findCustomersToMail(salonId, barberId);

        if (customers && customers.length > 0) {
            for (const customer of customers) {
                if (customer.queueList && Array.isArray(customer.queueList)) {
                    for (const queueItem of customer.queueList) {
                        console.log('Queue Item:', queueItem);

                        const salon = await getSalonTimeZone(salonId);

                        const { customerEmail, qPosition, customerName, barberName, serviceEWT, customerEWT, services, dateJoinedQ } = queueItem;

                        const formattedDate = moment(dateJoinedQ, 'YYYY-MM-DD').format('DD-MM-YYYY');

                        const totalServicePrice = services.reduce((total, service) => total + service.servicePrice, 0);

                        const emailSubject = `${salon.salonName}: ${formattedDate} Queue Position Changed (${qPosition})`;
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
                                    <p>Dear ${customerName},</p>
                                    <p>Your queue position has changed. Here are the updated details:</p>
                                    <ul>
                                        <li>Customer Name: ${customerName}</li>
                                        <li>Service Name: ${services.map(service => service.serviceName).join(', ')}</li>
                                        <li>Service Type: ${services.some(service => service.vipService) ? 'VIP' : 'Regular'}</li>
                                        <li>Barber Name: ${barberName}</li>
                                        <li>Service Price: $${totalServicePrice}</li>
                                        <li>Service Estimated Waiting time: ${serviceEWT} mins</li>
                                        <li>Your Estimated Waiting time: ${customerEWT} mins</li>
                                        <li>New Queue Position: ${qPosition}</li>
                                    </ul>
                                    <p>Please feel free to contact us if you have any questions or need further assistance.</p>
                                    <p>Best regards,</p>
                                    <p style="margin: 0; padding: 10px 0 5px;">
                                        ${salon.salonName}<br>
                                        Contact No.: ${salon.contactTel}<br>
                                        EmailId: ${salon.salonEmail}
                                    </p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `;

                        try {
                            await sendQueuePositionEmail(customerEmail, emailSubject, emailBody);
                            console.log('Email sent successfully.');
                        } catch (error) {
                            console.error('Error sending email:', error);
                            // Handle error if email sending fails
                        }
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Queue canceled successfully',
            updatedQueueList: updatedQueue.queueList,
        });

    } catch (error) {
        next(error);
    }
};

