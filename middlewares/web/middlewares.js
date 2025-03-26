import jwt from "jsonwebtoken"
import { findAdminByEmailandRole } from "../../services/web/admin/adminService.js";
import { findBarberByEmailAndRole, getAllBarbersForAdmin } from "../../services/web/barber/barberService.js";
import { findSalonBySalonIdAndAdmin, getSalonBySalonId } from "../../services/web/admin/salonService.js";
import { getAllCustomersForAdmin } from "../../services/web/customer/customerService.js";
import { formatCount } from "../../utils/calculateCount.js";

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

//MIDDLEWARE FOR ALL ADMIN PROTECTED ROUTES ==================
export const AdminLoggedIn = async (req, res, next) => {
  try {
    const email = req.email

    const loggedinAdmin = await findAdminByEmailandRole(email)

    const salon = await findSalonBySalonIdAndAdmin(loggedinAdmin.salonId, email)

    const adminSalons = loggedinAdmin.registeredSalons;

    const salonCount = adminSalons.length;


    const allBarbers = await getAllBarbersForAdmin(adminSalons);

    const barbersCount = allBarbers.length;

    const allCustomers = await getAllCustomersForAdmin(adminSalons);


    const customersCount = allCustomers.length;
    const formattedCustomersCount = await formatCount(customersCount);


    // const salon = await getSalonSettings(loggedinAdmin.salonId)

    // Convert Mongoose document to plain object
    const adminData = loggedinAdmin.toObject();

    // Add counts to the adminData object
    adminData.salonCount = salonCount;
    adminData.barbersCount = barbersCount;
    adminData.customersCount = formattedCustomersCount;

    const defaultLogo = [{
      "url": "https://res.cloudinary.com/dpynxkjfq/image/upload/v1742907445/iqbLogo_brktfk.jpg"
    }]

    if (loggedinAdmin.salonId === 0) {

      adminData.isQueueing = false; // Default to false if undefined
      adminData.isAppointments = false;
    }
    else {
      // Add `isQueueing` and `isAppointments` fields from `salon` to `loggedinAdmin`
      adminData.isQueueing = salon.isQueuing  // Default to false if undefined
      adminData.isAppointments = salon.isAppointments // Default to false if undefined
    }

    // Respond with admin and payment details
    res.status(201).json({
      success: true,
      message: "Yes, I am admin logged in",
      user: [adminData],
    })

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
  }
  catch (error) {
    next(error);
  }

}

export const BarberLoggedIn = async (req, res, next) => {
  try {

    const email = req.email

    const loggedinBarber = await findBarberByEmailAndRole(email)

    const defaultLogo = [{
      "url": "https://res.cloudinary.com/dpynxkjfq/image/upload/v1742907445/iqbLogo_brktfk.jpg"
    }]

    let salon = null;
    if (loggedinBarber.salonId !== 0) {
      salon = await getSalonBySalonId(loggedinBarber.salonId);
    }
    const barberObject = {
      ...loggedinBarber.toObject(), // Spread the barber data properly
      currency: salon?.currency || "£",    
      salonName: salon?.salonName || "",
      salonlogo: salon?.salonLogo || defaultLogo
    };

    res.status(201).json({
      success: true,
      message: "Yes i am barber Logged in",
      user: [barberObject],
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