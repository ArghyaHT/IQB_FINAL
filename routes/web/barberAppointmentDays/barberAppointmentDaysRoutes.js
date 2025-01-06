import express from "express";
import { addBarberAppointmentDays, getBarberAppointmentDays } from "../../../controllers/web/barberAppointmentDays/barberAppointmentController.js";

const router = express.Router();

router.route("/addBarberAppointmentDays").post(addBarberAppointmentDays)

router.route("/getBarberAppointmentDays").post(getBarberAppointmentDays)

export default router;
