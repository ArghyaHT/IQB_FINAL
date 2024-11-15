import express from "express"
import { getAllCitiesByCountryCode, getAllCountries, getAllTimeZonesByCountry } from "../../../controllers/web/countries/countriesController.js";

const router = express.Router();

router.route("/getAllCountries").post(getAllCountries)

router.route("/getAllCities").post( getAllCitiesByCountryCode)

router.route("/getAllTimeZones").post( getAllTimeZonesByCountry)

export default router;