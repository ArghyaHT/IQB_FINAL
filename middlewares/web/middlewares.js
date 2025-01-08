import jwt from "jsonwebtoken"
import { findAdminByEmailandRole } from "../../services/web/admin/adminService.js";
import { findBarberByEmailAndRole } from "../../services/web/barber/barberService.js";
import { findSalonBySalonIdAndAdmin, getSalonBySalonId } from "../../services/web/admin/salonService.js";

//COMMON MIDDLEWARES FOR ALL ==========================
export const handleProtectedRoute = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;

    // Verify old refresh token
    const decodeToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

    if (!decodeToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid Access Token. UnAuthorize User",
      });
    }

    req.user = decodeToken.user;
    next();
  } catch (error) {
    //console.log(error);
    next(error);
  }

};

// //MIDDLEWARE FOR ALL ADMIN PROTECTED ROUTES ==================
// export const AdminLoggedIn = async (req, res, next) => {
//   try {
//       const admincookie = req.cookies

//       if (!admincookie?.AdminToken) {
//           return res.status(401).json({
//               success: false,
//               message: "UnAuthorized Admin"
//           })
//       }

//       jwt.verify(
//           admincookie?.AdminToken,
//           process.env.JWT_ADMIN_ACCESS_SECRET,
//           async (err, decoded) => {
//               if (err) return res.status(403).json({ success: false, message: 'Forbidden Admin' })

//               console.log(decoded)
//               const adminEmail = decoded.email

//               const loggedinUser = await findAdminByEmailandRole(adminEmail)

//              return res.status(201).json({
//                   success: true,
//                   user: [loggedinUser]
//               })

//           }
//       )
//   }
//   catch (error) {
//       next(error);
//   }

// }

//MIDDLEWARE FOR ALL ADMIN PROTECTED ROUTES ==================
export const AdminLoggedIn = async (req, res, next) => {
  try {
    const email = req.email

    const loggedinAdmin = await findAdminByEmailandRole(email)

    const salon = await findSalonBySalonIdAndAdmin(loggedinAdmin.salonId, email)

    // Find matching payments
    // const matchingPayments = salon.productPayment.filter(payment =>
    //   payment.salonId === loggedinAdmin.salonId && payment.adminEmail === email
    // );
    // if (!admincookie?.AdminToken) {
    //     return res.status(401).json({
    //         success: false,
    //         message: "UnAuthorized Admin"
    //     })
    // }

    // jwt.verify(
    //     admincookie?.AdminToken,
    //     process.env.JWT_ADMIN_ACCESS_SECRET,
    //     async (err, decoded) => {
    //         if (err) return res.status(403).json({ success: false, message: 'Forbidden Admin' })

    //         console.log(decoded)
    //         const adminEmail = decoded.email

    //         const loggedinUser = await findAdminByEmailandRole(adminEmail)

    //        return res.status(201).json({
    //             success: true,
    //             user: [loggedinUser]
    //         })

    //     }
    // )

    // Respond with admin and payment details
    res.status(201).json({
      success: true,
      message: "Yes, I am admin logged in",
      user: [loggedinAdmin],
      // payments: matchingPayments,
    })
  }
  catch (error) {
    next(error);
  }

}

export const BarberLoggedIn = async (req, res, next) => {
  try {

    const email = req.email

    const loggedinBarber = await findBarberByEmailAndRole(email)

    const salon = await getSalonBySalonId(loggedinBarber.salonId)

    res.status(201).json({
      success: true,
      message: "Yes i am barber Logged in",
      user: [loggedinBarber],
      currency: salon.currency
    })


    // const barberCookie = req.cookies

    // console.log(barberCookie)

    // if (!barberCookie?.BarberToken) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "UnAuthorized Barber"
    //   })
    // }

    // jwt.verify(
    //   barberCookie?.BarberToken,
    //   process.env.JWT_BARBER_ACCESS_SECRET,
    //   async (err, decoded) => {
    //     if (err) return res.status(403).json({ success: false, message: 'Forbidden Barber' })

    //     console.log(decoded)
    //     const barberEmail = decoded.email

    //     const loggedinUser = await findBarberByEmailAndRole(barberEmail)

    //     const salon = await getSalonBySalonId(loggedinUser.salonId)

    //     return res.status(201).json({
    //       success: true,
    //       user: [loggedinUser],
    //       currency: salon.currency
    //     })

    //   }
    // )
  }
  catch (error) {
    //console.log(error);
    next(error);
  }

};