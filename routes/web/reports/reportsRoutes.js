import express from "express";
import { dashboardReports, salonAppointmentReport, salonServedReport } from "../../../controllers/web/reports/reportsController.js";

const router = express.Router()


//Get Salon Served Report
router.route("/getSalonReports").post(salonServedReport)

router.route("/getdashboardReports").post(dashboardReports)


router.route("/getSalonAppointmentReports").post(salonAppointmentReport)



export default router;