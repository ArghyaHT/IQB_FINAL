import express from "express";
import { addBarberAppointmentDays } from "../../../controllers/web/barberAppointmentDays/barberAppointmentController.js";

const router = express.Router();

router.route("/addBarberAppointmentDays").post(addBarberAppointmentDays)

export default router;
