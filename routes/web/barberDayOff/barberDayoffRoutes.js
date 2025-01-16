import express from "express";
import { addBarberDayOff, getBarberDayOffNumbers, getBarberOffDays} from "../../../controllers/web/barberDayOff/barberDayOffController.js";

const router = express.Router();

router.route("/addBarberDayOffs").post(addBarberDayOff)

router.route("/getBarberDayOffs").post(getBarberOffDays)

router.route("/getBarberDayOffsNumbers").post(getBarberDayOffNumbers)


export default router;


