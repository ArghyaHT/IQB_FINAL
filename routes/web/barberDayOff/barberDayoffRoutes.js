import express from "express";
import { barberDayOff, barberDayOffApprovalByAdmin } from "../../../controllers/web/barberDayOff/barberDayOffController.js";

const router = express.Router();

router.route("/barberDayOffRequest").post(barberDayOff)

router.route("/barberDayOffApproval").post(barberDayOffApprovalByAdmin)



export default router;


