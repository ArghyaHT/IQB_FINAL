import express from "express";
import { barberCancelAppointment, barberServedAppointment, createAppointment, customerCancelledAppointment, deleteAppointment, editAppointment, getAllAppointmentsByBarberId, getAllAppointmentsByBarberIdAndDate, getAllAppointmentsByBarberIdForToday, getAllAppointmentsByMultipleBarberIds, getAllAppointmentsByMultipleBarberIdsAndDate, getAllAppointmentsBySalonId, getAllAppointmentsBySalonIdAndDate, getEngageBarberTimeSlots } from "../../../controllers/web/appointments/appointmentsController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";
// import {  handleBarberProtectedRoute, handleProtectedRoute } from "../../middlewares/middlewares.js";

const router = express.Router()


//============ADMIN PROTECTED ROUTES==================//

router.route("/createAppointment").post(createAppointment);

router.route("/editAppointments").put(verifyRefreshTokenAdmin, editAppointment)

router.route("/deleteAppointments").delete(verifyRefreshTokenAdmin, deleteAppointment)

router.route("/getEngageBarberTimeSlots").post(verifyRefreshTokenAdmin ,getEngageBarberTimeSlots)

router.route("/getAllAppointmentsBySalonId").post(verifyRefreshTokenAdmin ,getAllAppointmentsBySalonId)

router.route("/getAllAppointmentsBySalonIdTest").post(getAllAppointmentsBySalonId)


router.route("/getAllAppointmentsBySalonIdAndDate").post(verifyRefreshTokenAdmin,getAllAppointmentsBySalonIdAndDate)

router.route("/getAllAppointmentsByBarberId").post(verifyRefreshTokenBarber ,getAllAppointmentsByBarberId)

router.route("/getAllAppointmentsByBarberIdAndDate").post(verifyRefreshTokenBarber ,getAllAppointmentsByBarberIdAndDate)

router.route("/getAllAppointmentsByBarberIdAndDateTest").post(getAllAppointmentsByBarberIdAndDate)


router.route("/barberServedAppointment").post(barberServedAppointment)

router.route("/customerCancelAppointment").post(customerCancelledAppointment)

router.route("/barberCancelAppointment").post(barberCancelAppointment)


router.route("/getAllAppointmentsByMultipleBarberIds").post(getAllAppointmentsByMultipleBarberIds)

router.route("/getAllAppointmentsByMultipleBarberIdsAndDate").post(getAllAppointmentsByMultipleBarberIdsAndDate)

router.route("/getAllAppointmentsByBarberForToday").post(getAllAppointmentsByBarberIdForToday)



export default router;