import { VERIFICATION_SMS_ERROR } from "../../constants/barberApp/barberAppConstants.js";
import { EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, EMAIL_NOT_PRESENT_ERROR, EMAIL_OR_PASSWORD_DONOT_MATCH_ERROR, INVALID_EMAIL_ERROR, PASSWORD_LENGTH_ERROR, PASSWORD_NOT_PRESENT_ERROR, VERIFICATION_EMAIL_ERROR } from "../../constants/web/adminConstants.js"
import { BARBER_EXISTS_ERROR, SIGNIN_SUCCESS, } from "../../constants/web/BarberConstants.js";
import { ERROR_STATUS_CODE, SUCCESS_STATUS_CODE } from "../../constants/web/Common/StatusCodeConstant.js"
import { ErrorHandler } from "../../middlewares/ErrorHandler.js";
import { SuccessHandler } from "../../middlewares/SuccessHandler.js";
import { validateEmail } from "../../middlewares/validator.js";
import { createBarberByApp, findBarberByEmailIsVerifiedAndRole, findBarberByMobileIsVerifiedAndRole, getBarberUpcomingAppointments } from "../../services/barberApp/barberAppService.js";
import { getBarberByBarberId } from "../../services/mobile/barberService.js";
import { getSalonBySalonId } from "../../services/mobile/salonServices.js";
import { getBarberAppointmentCountForLastWeek, getBarberServedAppointmentCountLast7Days } from "../../services/web/appointments/appointmentHistoryService.js";
import { createBarber, createBarberId, findBarberByEmailAndRole } from "../../services/web/barber/barberService.js";
import { totalbarberQueueCountsForLast7Days, totalbarberServeQueueCountsForLast7Days } from "../../services/web/queue/joinQueueHistoryService.js";
import { sendVerificationCode } from "../../utils/emailSender/emailSender.js";
import { sendMobileVerificationCode } from "../../utils/mobileMessageSender/mobileMessageSender.js";
import bcrypt from "bcrypt"

import jwt from "jsonwebtoken"

// export const barberRegister = async (req, res, next) => {
//     try {
//         let { email, mobileCountryCode, mobileNumber, password } = req.body

//         // if (!email && !password) {
//         //     return ErrorHandler(EMAIL_AND_PASSWORD_NOT_FOUND_ERROR, ERROR_STATUS_CODE, res)
//         // }

//         // if (!email) {
//         //     return ErrorHandler(EMAIL_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
//         // }

//         // if (!validateEmail(email)) {
//         //     return ErrorHandler(INVALID_EMAIL_ERROR, ERROR_STATUS_CODE, res)
//         // }

//         if (!password) {
//             return ErrorHandler(PASSWORD_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res)
//         }

//         if (password.length < 8) {
//             return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res)
//         }

//         email = email.toLowerCase();

//         const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
//         const hashedPassword = await bcrypt.hash(password, 10)

//         if (email) {
//             const existingUser = await findBarberByEmailIsVerifiedAndRole(email)
//             if (existingUser) {
//                 if (existingUser.emailVerified) {
//                     return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res);
//                 }
//             }

//             // Update verificationCode and password
//             existingUser.password = hashedPassword;
//             existingUser.verificationCode = verificationCode;
//             await existingUser.save();

//               try {
//           await sendVerificationCode(email, verificationCode);
//         } catch (error) {
//           return ErrorHandler(VERIFICATION_EMAIL_ERROR, ERROR_STATUS_CODE, res);
//         }

//         return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { existingUser });
//       }
//          // New user
//       const barberId = await createBarberId();
//       await sendVerificationCode(email, verificationCode);

//       const newUser = await createBarberByApp(email, hashedPassword, barberId, verificationCode);
//       return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser });
//     }

//     // CASE 2: Mobile Signup
//     if (mobileNumber) {
//             const existingUser = await findBarberByMobileIsVerifiedAndRole(email)

//       if (existingUser) {
//         if (existingUser.mobileVerified) {
//           return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res);
//         }

//         // Update verificationCode and password
//         existingUser.password = hashedPassword;
//         existingUser.verificationCode = verificationCode;
//         await existingUser.save();

//         try {
//           const formattedNumber = `+${mobileCountryCode}${String(mobileNumber)}`;
//           await sendMobileVerificationCode(formattedNumber, verificationCode);
//         } catch (error) {
//           next(error);
//         }

//         return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { existingUser });
//       }

//       // New user
//       const barberId = await createBarberId();
//       const formattedNumber = `+${mobileCountryCode}${String(mobileNumber)}`;
//       await sendMobileVerificationCode(formattedNumber, verificationCode);

//       const newUser = await createBarberByApp(email, hashedPassword, barberId, verificationCode);
//       return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { newUser });
//     }
//     } catch (error) {
//         next(error);
//     }
// }


export const barberRegister = async (req, res, next) => {
    try {
        let { email, countryCode, mobileNumber, password } = req.body;

        if (!password) {
            return ErrorHandler(PASSWORD_NOT_PRESENT_ERROR, ERROR_STATUS_CODE, res);
        }

        if (password.length < 8) {
            return ErrorHandler(PASSWORD_LENGTH_ERROR, ERROR_STATUS_CODE, res);
        }

        email = email?.toLowerCase();
        const verificationCode = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
        const hashedPassword = await bcrypt.hash(password, 10);

        // --- EMAIL SIGNUP ---
        if (email) {
            const existingUser = await findBarberByEmailIsVerifiedAndRole(email);

            if (existingUser) {
                if (existingUser.emailVerified) {
                    return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res);
                }

                // Update unverified existing user
                existingUser.password = hashedPassword;
                existingUser.verificationCode = verificationCode;
                await existingUser.save();

                try {
                    await sendVerificationCode(email, verificationCode);
                } catch (error) {
                    return ErrorHandler(VERIFICATION_EMAIL_ERROR, ERROR_STATUS_CODE, res);
                }

                return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { user: existingUser });
            }

            // New user
            const barberId = await createBarberId();
            await sendVerificationCode(email, verificationCode);

            const newUser = await createBarberByApp(email, hashedPassword, barberId, verificationCode);
            return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { user: newUser });
        }

        // --- MOBILE SIGNUP ---
        if (mobileNumber) {
            const existingUser = await findBarberByMobileIsVerifiedAndRole(countryCode, mobileNumber);

            if (existingUser) {
                if (existingUser.mobileVerified) {
                    return ErrorHandler(BARBER_EXISTS_ERROR, ERROR_STATUS_CODE, res);
                }

                // Update unverified existing user
                existingUser.password = hashedPassword;
                existingUser.verificationCode = verificationCode;
                await existingUser.save();

                try {
                    const formattedNumber = `+${countryCode}${String(mobileNumber)}`;
                    await sendMobileVerificationCode(formattedNumber, verificationCode);
                } catch (error) {
                    return ErrorHandler(VERIFICATION_SMS_ERROR, ERROR_STATUS_CODE, res);
                }

                return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { user: existingUser });
            }

            // New user
            const barberId = await createBarberId();
            const formattedNumber = `+${countryCode}${String(mobileNumber)}`;
            await sendMobileVerificationCode(formattedNumber, verificationCode);

            const newUser = await createBarberByApp(email, hashedPassword, barberId, verificationCode);
            return SuccessHandler(SIGNUP_SUCCESS, SUCCESS_STATUS_CODE, res, { user: newUser });
        }

        return ErrorHandler("Email or mobile number must be provided.", ERROR_STATUS_CODE, res);
    } catch (error) {
        next(error);
    }
};


export const matchVerificationCode = async (req, res, next) => {
    try {
        let { email, verificationCode, countryCode, mobileNumber } = req.body;

        let barber = null;

        if (email) {
            email = email.toLowerCase();
            barber = await findBarberByEmailIsVerifiedAndRole(email);
            if (!barber) {
                return res.status(400).json({
                    success: false,
                    message: "No barber found with this email.",
                });
            }

            if (barber.verificationCode === verificationCode) {
                barber.emailVerified = true;
                barber.verificationCode = '';
                await barber.save();

                return res.status(200).json({
                    success: true,
                    message: "User verified successfully",
                    response: barber,
                });
            }
        }

        if (mobileNumber && countryCode) {
            barber = await findBarberByMobileIsVerifiedAndRole(countryCode, mobileNumber);
            if (!barber) {
                return res.status(400).json({
                    success: false,
                    message: "No barber found with this mobile number.",
                });
            }

            if (barber.verificationCode === verificationCode) {
                barber.mobileVerified = true;
                barber.verificationCode = '';
                await barber.save();

                return res.status(200).json({
                    success: true,
                    message: "User verified successfully",
                    response: barber,
                });
            }
        }

        // If neither condition is met or verification fails
        return res.status(400).json({
            success: false,
            message: "Verification code didn't match. Please enter a valid verification code",
        });
    } catch (error) {
        next(error);
    }
};

export const barberLoginController = async (req, res, next) => {
    try {
        let email = req.body.email;
        const password = req.body.password;

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

        // // // Save FCM Tokens based on the switch-case logic
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
            response: foundUser
        })
    } catch (error) {
        next(error);
    }
};

export const barberDashboardApi = async (req, res, next) => {
    try {
        const { barberId } = req.body;

        if (!barberId) {
            return res.status(400).json({
                success: false,
                message: 'Barber ID is required.',
            });
        }

        const barberDetails = await getBarberByBarberId(barberId);
        if (!barberDetails) {
            return res.status(404).json({
                success: false,
                message: 'Barber not found.',
            });
        }

        const barberUpcomingAppointments = await getBarberUpcomingAppointments(
            barberDetails.salonId,
            barberId
        );

        const getSalonByBarber = await getSalonBySalonId(barberDetails.salonId)

        return res.status(200).json({
            success: true,
            message: 'Barber dashboard data fetched successfully.',
            response: {
                barber: barberDetails,
                salon: getSalonByBarber,
                upcomingAppointments: barberUpcomingAppointments || [],
            },
        });
    } catch (error) {
        next(error);
    }
};


export const barberdashboardReports = async (req, res, next) => {
    try {
        const { salonId, barberId } = req.body;

        // // **Queue Dashboard Logic**
        // const totalqueue30Days = await totalBarberQueueCountsForLast30Days(salonId, barberId);
        // const totalqueue60Days = await totalBarberQueueCountsForLast60Days(salonId, barberId);

        // Extract counts
        //  const last30DaysCount = totalqueue30Days.totalCount;
        //  const prev30DaysCount = totalqueue60Days.totalCount - last30DaysCount; 

        // const servedQueueCountlast30Days = await getBarberServedQueueCountLast30Days(salonId, barberId);

        // const cancelledQueueCountLast30Days = last30DaysCount - servedQueueCountlast30Days;


        const totalQueueCountlast7days = await totalbarberQueueCountsForLast7Days(salonId, barberId)


        // const eachDayQueueCountlast7days = await getBarberLast7DaysQueueCount(salonId, barberId)


        const servedQueueCountLast7Days = await totalbarberServeQueueCountsForLast7Days(salonId, barberId)

        const cancelledQueueCountLast7Days = totalQueueCountlast7days.totalCount - servedQueueCountLast7Days.totalCount

        // // Calculate percentages
        // const servedPercentage = last30DaysCount > 0 ? ((servedQueueCountlast30Days / last30DaysCount) * 100).toFixed(2) : "0.00";
        // const cancelledPercentage = last30DaysCount > 0 ? ((cancelledQueueCountLast30Days / last30DaysCount) * 100).toFixed(2) : "0.00";



        // let percentageChange = 0;
        // let trend = "No Change";

        // if (prev30DaysCount > 0) {
        //     percentageChange = ((last30DaysCount - prev30DaysCount) / prev30DaysCount) * 100;
        //     trend = percentageChange > 0 ? "Rise" : percentageChange < 0 ? "Fall" : "No Change";
        // } else if (last30DaysCount > 0) {
        //     percentageChange = 100; // If there were no queues in the previous 30 days, but now there are
        //     trend = "Rise";
        // }

        // **Appointment Dashboard Logic**
        const servedAppointmentCount7Days = await getBarberServedAppointmentCountLast7Days(salonId, barberId);


        const getlastWeekAppointmentCount = await getBarberAppointmentCountForLastWeek(salonId, barberId);
        // const getlast2WeeksAppointmentCount = await getBarberAppointmentCountForLast2Week(salonId, barberId);

        console.log(getlastWeekAppointmentCount)


        const cancelledAppointmentCount7Days = getlastWeekAppointmentCount - servedAppointmentCount7Days;

        // const servedAppointmentPercentage = getlastWeekAppointmentCount > 0 ? ((servedAppointmentCount7Days / getlastWeekAppointmentCount) * 100).toFixed(2) : "0.00";
        // const cancelledAppointmentPercentage = getlastWeekAppointmentCount > 0 ? ((cancelledAppointmentCount7Days / getlastWeekAppointmentCount) * 100).toFixed(2) : "0.00";




        // Calculate Appointment Percentage Change
        // const previousWeekCount = getlast2WeeksAppointmentCount - getlastWeekAppointmentCount;
        // let appointmentPercentageChange = 0;
        // let appointmentTrend = "No Change";

        // if (previousWeekCount > 0) {
        //     appointmentPercentageChange = ((getlastWeekAppointmentCount - previousWeekCount) / previousWeekCount) * 100;
        // } else if (previousWeekCount === 0 && getlastWeekAppointmentCount > 0) {
        //     appointmentPercentageChange = 100; // 100% increase if no appointments in the previous week
        // }

        // appointmentTrend = appointmentPercentageChange > 0 ? "Rise" : appointmentPercentageChange < 0 ? "Fall" : "No Change";

        // const last7daysCount = await getLastWeekBarberAppointmentCountsEachDay(salonId, barberId);

        // const firstDate = formatDateWithSuffix(last7daysCount[0].date);
        // const lastDate = formatDateWithSuffix(last7daysCount[last7daysCount.length - 1].date);


        return res.status(200).json({
            success: true,
            response: {
                queue: {
                    // totalQueueHistoryCount: last30DaysCount,
                    // servedHistoryPercentage: Number(servedPercentage),
                    // cancelledHistoryPercentage: Number(cancelledPercentage),
                    // last30DaysCount,
                    // prev30DaysCount,
                    // percentageChangelast30Days: Number(Math.abs(percentageChange).toFixed(2)),
                    // queueTrend: trend,
                    last7daysTotalQueueCount: totalQueueCountlast7days.totalCount,
                    servedQueueCount7Days: servedQueueCountLast7Days.totalCount,
                    cancelledQueueCountLast7Days: cancelledQueueCountLast7Days,
                    // last7daysCount: eachDayQueueCountlast7days.map(item => ({
                    //     date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                    //     TotalQueue: item.count
                    // })
                    // )

                },
                appointment: {
                    // totalAppointmentHistoryCount: getlastWeekAppointmentCount,
                    // totalAppointmentHistoryPercentage: Number(servedAppointmentPercentage) + Number(cancelledAppointmentPercentage),
                    servedAppointmenthistoryCount: servedAppointmentCount7Days,
                    // servedAppointmentHistoryPercentage: Number(servedAppointmentPercentage),
                    cancelledAppointmentHistoryCount: cancelledAppointmentCount7Days,
                    // cancelledAppointmentHistoryPercentage: Number(cancelledAppointmentPercentage),
                    lastWeekCount: getlastWeekAppointmentCount,
                    // prevWeekCount: previousWeekCount,
                    // percentageChangeLastWeek: Number(Math.abs(appointmentPercentageChange).toFixed(2)),
                    // appointmentTrend,
                    // dateFormat: `${firstDate} - ${lastDate}`,
                    // last7daysCount: last7daysCount.map(item => ({
                    //     date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "2-digit" }), // Format to "Feb-08"
                    //     TotalAppoinment: item.count
                    // })
                    // )
                }
            }
        });
    } catch (error) {
        next(error);
    }
};
