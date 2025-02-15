import express from "express";
import { dashboardReports, salonCancelledReport, salonServedReport } from "../../../controllers/web/reports/reportsController.js";

const router = express.Router()


//Get Salon Served Report
router.route("/getSalonReports").post(salonServedReport)

router.route("/getdashboardReports").post(dashboardReports)



export default router;