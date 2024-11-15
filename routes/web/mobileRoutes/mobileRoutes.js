import express from "express";
import { getAllSalonServices, getAllSalons } from "../../../controllers/web/admin/salonController.js";
import { getAllBarberbySalonId } from "../../../controllers/web/barber/barberController.js";
import { createAppointment, deleteAppointment, editAppointment, getAllAppointmentsByBarberId, getAllAppointmentsByBarberIdAndDate, getAllAppointmentsBySalonId, getAllAppointmentsBySalonIdAndDate, getEngageBarberTimeSlots } from "../../../controllers/web/appointments/appointmentsController.js";
import { getAvailableBarbersForQ, getBarberByMultipleServiceId, getQlistbyBarberId, getQueueListBySalonId, groupJoinQueue, singleJoinQueue } from "../../../controllers/web/queue/joinQueueController.js";
import { getAllAdvertisements } from "../../../controllers/web/dashboard/dashboardController.js";

const router = express.Router();

//DESC:SALON ROUTES ==============================
router.route("/getAllSalonsMob").get(getAllSalons)

router.route("/getAllSalonServices").get(getAllSalonServices)


//DESC:SALON ROUTES ==============================
router.route("/getAllBarberBySalonId").post(getAllBarberbySalonId)


//DESC:APPOINTMENT ROUTES ==============================
router.route("/createAppointment").post(createAppointment);

router.route("/editAppointments").put(editAppointment)

router.route("/deleteAppointments").delete(deleteAppointment)

router.route("/getEngageBarberTimeSlots").post(getEngageBarberTimeSlots)

router.route("/getAllAppointmentsBySalonId").post(getAllAppointmentsBySalonId)

router.route("/getAllAppointmentsBySalonIdAndDate").post(getAllAppointmentsBySalonIdAndDate)

router.route("/getAllAppointmentsByBarberId").post(getAllAppointmentsByBarberId)

router.route("/getAllAppointmentsByBarberIdAndDate").post(getAllAppointmentsByBarberIdAndDate)


//DESC:QUEUE ROUTES ==============================

//Single Join
router.route("/singleJoinQueue").post(singleJoinQueue)

//Group Join
router.route("/groupJoinQueue").post(groupJoinQueue)

// //Auto Join
// router.route("/autoJoin").post(autoJoin),

//Get Available Barbers for Queue
router.route("/getAvailableBarbersForQ").post(getAvailableBarbersForQ)

//Get Barber By Multiple ServiceId
router.route("/getBarberByMultipleServiceId").post(getBarberByMultipleServiceId)

//Get Q list by BarberId
router.route("/getQlistByBarberId").post(getQlistbyBarberId)

//Get Q list by Salon Id
router.route("/getQlistBySalonId").get(getQueueListBySalonId)


//DESC:ADVERTISEMENT ROUTES ==============================

//Get Advertisements
router.route("/getAllAdvertisements").post(getAllAdvertisements)



export default router;
