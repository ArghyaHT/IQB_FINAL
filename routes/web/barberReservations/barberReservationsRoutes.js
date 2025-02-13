import express from "express"
import { updateBarberReservations } from "../../../controllers/web/barberReservations/barberReservationsController.js"

const router = express.Router()

router.route("/addBarberReservations").post(updateBarberReservations)

export default router;