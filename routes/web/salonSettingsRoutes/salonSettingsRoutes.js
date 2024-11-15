import express from "express";
import { getSalonSettingsBySalonId, updateSalonSettings } from "../../../controllers/web/salonSettings/salonSettingsController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";

const router = express.Router();

// //Create Salon Settings
// router.route("/createSalonSettings").post(verifyRefreshTokenAdmin,createSalonSettings)

//Get Salon Settings
router.route("/getSalonSettings").post(verifyRefreshTokenAdmin, getSalonSettingsBySalonId)

//Update Salon Settings
router.route("/updateSalonSettings").put(verifyRefreshTokenAdmin, updateSalonSettings)

// router.route("/deleteSalonSettings").delete(deleteSalonSettings)


export default router;