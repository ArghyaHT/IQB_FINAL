import express from "express"
import { updateBarberBreakTime } from "../../../controllers/web/barberBreakTimes/barberBreakTimeController.js";

const router = express.Router();

router.route("/addBarberBreakTimes").post(updateBarberBreakTime)

export default router