import express from "express";
import { salonCancelledReport, salonServedReport } from "../../../controllers/web/reports/reportsController.js";

const router = express.Router()


//Get Salon Served Report
router.route("/getSalonServedReports").post(salonServedReport)

//Get Salon Cancelled Report
router.route("/getSalonCancelledReports").post(salonCancelledReport)


export default router;