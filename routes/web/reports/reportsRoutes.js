import express from "express";
import { dashboardReports, newBarberdashboardReports, newdashboardReports, queueTrend, salonAppointmentReport, salonServedReport } from "../../../controllers/web/reports/reportsController.js";

const router = express.Router()


//Get Salon Served Report
router.route("/getSalonReports").post(salonServedReport)

router.route("/getdashboardReports").post(dashboardReports)


router.route("/getSalonAppointmentReports").post(salonAppointmentReport)


router.route("/queueTrend").post(queueTrend)

router.route("/getnewdashboardReports").post(newdashboardReports)

router.route("/getnewbarberdashboardReports").post(newBarberdashboardReports)





export default router;