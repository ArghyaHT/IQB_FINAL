import express from "express";
import { barberDayOff} from "../../../controllers/web/barberDayOff/barberDayOffController.js";

const router = express.Router();

router.route("/barberDayOffRequest").post(barberDayOff)

// router.route("/barberDayOffApproval").post(barberDayOffApprovalByAdmin)

// router.route("/getAllBarberDayOffRequests").post(getBarberDayOffRequests)




export default router;


