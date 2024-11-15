import express from "express";
import { getAllSalonServices, getAllSalons, getSalonInfo, getSalonsByLocation, getSalonsByNameAndCity } from "../../controllers/mobile/salonController.js";

import { createAppointment, deleteAppointment, editAppointment, getAllAppointmentsByBarberId, getAllAppointmentsByBarberIdAndDate, getAllAppointmentsBySalonId, getAllAppointmentsBySalonIdAndDate, getEngageBarberTimeSlots } from "../../controllers/mobile/appointmentController.js";
// import { verifyRefreshCustomerToken } from "../middlewares/VerifyRefreshCustomerToken.js";
import { getAllBarberbySalonId } from "../../controllers/mobile/barberController.js";
import { getAvailableBarbersForQ, getBarberByServices, getBarberServicesByBarberId, getQlistbyBarberId, getQueueListBySalonId, groupJoinQueue, singleJoinQueue } from "../../controllers/mobile/joinQueueController.js";
import { getAllAdvertisements } from "../../controllers/mobile/advertisementController.js";
// import { getAllAdvertisements } from "../../controllers/dashboard/dashboardController.js";

const router = express.Router();

//DESC:SALON ROUTES ==============================
router.route("/getAllSalonsMob").get(getAllSalons)

router.route("/getAllSalonServices").get(getAllSalonServices)

router.route("/searchByNameAndCity").post(getSalonsByNameAndCity)

router.route("/getSalonsByLocation").get(getSalonsByLocation)

//DESC:SALON ROUTES ==============================
router.route("/getAllBarberBySalonId").post(getAllBarberbySalonId)

//GET SALON INFO BY SALON ID
router.route("/getSalonInfoBySalonId").get(getSalonInfo)


//DESC:APPOINTMENT ROUTES ==============================
router.route("/createAppointment").post(createAppointment);

router.route("/editAppointments").put(editAppointment)

router.route("/deleteAppointments").delete(deleteAppointment)

router.route("/getEngageBarberTimeSlots").post(getEngageBarberTimeSlots)

router.route("/getAllAppointmentsBySalonId").post(getAllAppointmentsBySalonId)

router.route("/getAllAppointmentsBySalonIdAndDate").post(getAllAppointmentsBySalonIdAndDate)

router.route("/getAllAppointmentsByBarberId").post(getAllAppointmentsByBarberId)

router.route("/getAllAppointmentsByBarberIdAndDate").post(getAllAppointmentsByBarberIdAndDate)


// //DESC:QUEUE ROUTES ==============================

//Single Join
router.route("/singleJoinQueue").post(singleJoinQueue)

//Group Join
router.route("/groupJoinQueue").post(groupJoinQueue)

//Get Available Barbers for Queue
router.route("/getAvailableBarbersForQ").post(getAvailableBarbersForQ)

//Get Barber By Multiple ServiceId
router.route("/getBarberByMultipleServiceId").post(getBarberByServices)

//Get Services by BarberId
router.route("/getServicesByBarber").post(getBarberServicesByBarberId)

//Get Q list by BarberId
router.route("/getQlistByBarberId").post(getQlistbyBarberId)

//Get Q list by Salon Id
router.route("/getQlistBySalonId").get(getQueueListBySalonId)


// //DESC:ADVERTISEMENT ROUTES ==============================

//Get Advertisements
router.route("/getAllAdvertisements").post(getAllAdvertisements)



export default router;
