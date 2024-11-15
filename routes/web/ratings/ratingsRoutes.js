import express from "express";
import { barberRating, salonRating } from "../../../controllers/web/ratings/ratingsController.js";

const router = express.Router();

//Salon Ratings 
router.route("/salonRatings").post(salonRating)

//Barber Ratings
router.route("/barberRatings").post(barberRating)


export default router;