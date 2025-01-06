import jwt from "jsonwebtoken"

import { findAdminByEmailandRole } from "../../services/kiosk/admin/adminServices.js"
import { findBarberByEmailAndRole } from "../../services/kiosk/barber/barberService.js"
import { getKioskAvailabilystatus, getSalonBySalonId, getSalonOnlineStatus, getbokingAvailabilystatus, kioskAvailabilityStatus } from "../../services/kiosk/salon/salonServices.js"
import { getAdvertisements } from "../../services/kiosk/advertisements/advertisementService.js"

export const loggedIn = async (req, res, next) => {
    try {
        const email = req.email
        const role = req.role

        if (role === "Admin") {
            const loggedinAdmin = await findAdminByEmailandRole(email)

            const salonOnlineStatus = await getSalonOnlineStatus(loggedinAdmin.salonId)

            const bookingAvailabilityStatus = await getbokingAvailabilystatus(loggedinAdmin.salonId)

            const kioskAvailabilityStatus = await getKioskAvailabilystatus(loggedinAdmin.salonId)


            res.status(201).json({
                message: "Yes i am admin Logged in",
                email,
                role,
                success: true,
                user: {
                    ...loggedinAdmin.toObject(), // Convert Mongoose document to plain object
                    isSalonOnline: salonOnlineStatus,
                    mobileBookingAvailability: bookingAvailabilityStatus,
                    kioskAvailability: kioskAvailabilityStatus
                }
            })
        }
        else {
            const loggedInBarber = await findBarberByEmailAndRole(email);

            const salon = await getSalonBySalonId(loggedInBarber.salonId);

            const salonImage = salon.salonLogo;
            const salonName = salon.salonName;

            const salonAdds = await getAdvertisements(loggedInBarber.salonId)

            const salonOnlineStatus = await getSalonOnlineStatus(loggedInBarber.salonId);

            const bookingAvailabilityStatus = await getbokingAvailabilystatus(loggedInBarber.salonId);

            res.status(201).json({
                message: "Yes i am barber Logged in",
                email,
                role,
                success: true,
                user: {
                    ...loggedInBarber.toObject(), // Convert Mongoose document to plain object
                    isSalonOnline: salonOnlineStatus,
                    mobileBookingAvailability: bookingAvailabilityStatus,
                    salonName: salonName,
                    salonLogo: salonImage,
                    salonAdvertisements: salonAdds
                }
            })
        }
    } catch (error) {
        //console.log(error);
        next(error);
    }
}


// export const BarberLoggedIn = async (req, res, next) => {
//     try {
//         const barberCookie = req.cookies

//         console.log(barberCookie)

//         if (!barberCookie?.BarberToken) {
//             return res.status(401).json({
//                 success: false,
//                 message: "UnAuthorized Barber"
//             })
//         }

//         jwt.verify(
//             barberCookie?.BarberToken,
//             process.env.JWT_BARBER_ACCESS_SECRET,
//             async (err, decoded) => {
//                 if (err) return res.status(403).json({ success: false, message: 'Forbidden Barber' })

//                 console.log(decoded)

//                 const loggedinUser = await findBarberByEmailAndRole(decoded.email)
//                 res.status(201).json({
//                     success: true,
//                     user: [loggedinUser]
//                 })

//             }
//         )
//     }
//     catch (error) {
//         //console.log(error);
//         next(error);
//     }

// }
