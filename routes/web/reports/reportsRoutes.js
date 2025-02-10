import express from "express";
import { dashboardReports, salonCancelledReport, salonServedReport } from "../../../controllers/web/reports/reportsController.js";

const router = express.Router()


//Get Salon Served Report
router.route("/getSalonServedReports").post(salonServedReport)

//Get Salon Cancelled Report
router.route("/getSalonCancelledReports").post(salonCancelledReport)

router.route("/getdashboardReports").post(dashboardReports)



export default router;