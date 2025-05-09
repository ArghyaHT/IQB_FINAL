import express from "express";
import { getAppointmentHistoryByBarberIdSalonId, getSalonAppointmentHistoryBySalonId } from "../../../controllers/web/appointments/appointmentHistoryController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";

const router = express.Router()

router.route("/getAppointmentHistoryBySalonId").post(verifyRefreshTokenAdmin ,getSalonAppointmentHistoryBySalonId);

router.route("/getAppointmentHistoryByBarberIdSalonId").post(verifyRefreshTokenBarber,getAppointmentHistoryByBarberIdSalonId);


export default router;