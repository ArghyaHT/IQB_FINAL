import express from "express";
import { barberDayOff } from "../../../controllers/web/barberDayOff/barberDayOffController.js";

const router = express.Router();

router.route("/barberDayOffRequest").post(barberDayOff)


export default router;


