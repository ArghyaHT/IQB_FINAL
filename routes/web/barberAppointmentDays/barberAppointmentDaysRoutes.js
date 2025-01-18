import express from "express";
import { addBarberAppointmentDays, getBarberAppointmentDayNumbers, getBarberAppointmentDays, getBarberMissingAppointmentDates } from "../../../controllers/web/barberAppointmentDays/barberAppointmentController.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";

const router = express.Router();

router.route("/addBarberAppointmentDays").post(verifyRefreshTokenBarber,addBarberAppointmentDays)

router.route("/getBarberAppointmentDays").post(verifyRefreshTokenBarber,getBarberAppointmentDays)

router.route("/getBarberAppointmentDayNumbers").post(getBarberAppointmentDayNumbers)

router.route("/getBarberDisabledAppointmentDates").post(getBarberMissingAppointmentDates)



export default router;
