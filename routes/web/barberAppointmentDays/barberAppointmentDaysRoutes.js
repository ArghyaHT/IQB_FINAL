import express from "express";
import { addBarberAppointmentDays, getBarberAppointmentDayNumbers, getBarberAppointmentDays, getBarberMissingAppointmentDates } from "../../../controllers/web/barberAppointmentDays/barberAppointmentController.js";

const router = express.Router();

router.route("/addBarberAppointmentDays").post(addBarberAppointmentDays)

router.route("/getBarberAppointmentDays").post(getBarberAppointmentDays)

router.route("/getBarberAppointmentDayNumbers").post(getBarberAppointmentDayNumbers)

router.route("/getBarberDisabledAppointmentDates").post(getBarberMissingAppointmentDates)



export default router;
