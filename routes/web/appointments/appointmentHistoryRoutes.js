import express from "express";
import { getSalonAppointmentHistoryBySalonId } from "../../../controllers/web/appointments/appointmentHistoryController.js";

const router = express.Router()

router.route("/getAppointmentHistoryBySalonId").post(getSalonAppointmentHistoryBySalonId);


export default router;