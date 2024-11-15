import express from "express";
import { addAdvertisements, deleteAdvertisements, getAllAdvertisements, getDashboardAppointmentList, setDragAdvertisement, updateAdvertisements } from "../../../controllers/web/dashboard/dashboardController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";


const router = express.Router();

//Add Advertisements
router.route("/addAdvertisements").post(verifyRefreshTokenAdmin, addAdvertisements)

//Get Advertisements
router.route("/getAdvertisements").post(verifyRefreshTokenAdmin,getAllAdvertisements)

//Update Advertisements
router.route("/updateAdvertisements").put(verifyRefreshTokenAdmin, updateAdvertisements)

//Delete Advertisements
router.route("/deleteAdvertisements").delete(verifyRefreshTokenAdmin, deleteAdvertisements)

//Get DashboardQlist
router.route("/getDashboardAppointmentList").post(verifyRefreshTokenAdmin,getDashboardAppointmentList)

//Set Drag Advertisements
router.route("/setDragAdvertisements").post(setDragAdvertisement)




export default router;