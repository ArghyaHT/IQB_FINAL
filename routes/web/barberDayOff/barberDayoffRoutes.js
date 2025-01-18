import express from "express";
import { addBarberDayOff, getBarberDayOffNumbers, getBarberOffDays} from "../../../controllers/web/barberDayOff/barberDayOffController.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";

const router = express.Router();

router.route("/addBarberDayOffs").post(verifyRefreshTokenBarber,addBarberDayOff)

router.route("/getBarberDayOffs").post(verifyRefreshTokenBarber,getBarberOffDays)

router.route("/getBarberDayOffsNumbers").post(getBarberDayOffNumbers)


export default router;


