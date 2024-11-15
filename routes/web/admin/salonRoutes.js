import express from "express";

// import {  handleBarberProtectedRoute, handleProtectedRoute } from "../../middlewares/middlewares.js";
import { changeSalonOnlineStatus, createSalonByAdmin, deleteSalon, deleteSalonImages, deleteSalonLogo, getAllSalonServices, getAllSalons, getSalonImages, getSalonInfo, getSalonLogo, getSalonsByLocation, searchSalonsByNameAndCity, updateSalonBySalonIdAndAdminEmail, updateSalonImages, updateSalonInfo, updateSalonLogo, uploadMoreSalonGalleryImages, uploadSalonGalleryImages, uploadSalonLogo } from "../../../controllers/web/admin/salonController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { getAllSalonsByAdmin } from "../../../controllers/web/admin/adminController.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";

const router = express.Router();

//============ADMIN PROTECTED ROUTES==================//

router.route("/getAllSalonsByAdminEmail").get(verifyRefreshTokenAdmin,getAllSalonsByAdmin) //api integrated

//CREATE SALON BY ADMIN
router.route("/createSalonByAdmin").post(verifyRefreshTokenAdmin,createSalonByAdmin) //api integrated

//UPLOAD SALON IMAGE
router.route("/uploadSalonImage").post(verifyRefreshTokenAdmin,uploadSalonGalleryImages)

//UPLOAD MORE IMAGES TO THE EXISTING ARRAY OF IMAGES
router.route("/uploadMoreImages").post(verifyRefreshTokenAdmin, uploadMoreSalonGalleryImages)

//UPDATE SALON IMAGES
router.route("/updateSalonImages").put(verifyRefreshTokenAdmin,updateSalonImages)

//DELETE SALON IMAGES
router.route("/deleteSalonImages").delete(verifyRefreshTokenAdmin, deleteSalonImages)

//GET SALON IMAGES
router.route("/getSalonImages").post(getSalonImages)

//UPDATE SALON BY ADMIN EMAIL AND SALON ID
router.route("/updateSalonBySalonIdAndAdminEmail").put(verifyRefreshTokenAdmin,updateSalonBySalonIdAndAdminEmail)

// router.route("/addSalonServices").post(addServices)

router.route("/getAllSalonServices").get(getAllSalonServices)

router.route("/searchByNameAndCity").post(searchSalonsByNameAndCity)

router.route("/getSalonInfoBySalonId").get(getSalonInfo) // api working

// router.route("/updateSalonServiceByServiceId").put(verifyRefreshTokenAdmin,updateSalonServiceByServiceId) //api working perfectly

// router.route("/deleteServiceByServiceIdSalonId").post(deleteServiceByServiceIdSalonId)

//SOFT DELETE SALON
router.route("/deleteSalon").post(verifyRefreshTokenAdmin,deleteSalon)

//GetAll Salons
router.route("/getAllSalons").get(verifyRefreshTokenAdmin,getAllSalons)

//Change Salon online Status
router.route("/changeSalonOnlineStatus").post(verifyRefreshTokenAdmin,changeSalonOnlineStatus )

//Upload Salon Logo
router.route("/uploadSalonLogo").post(verifyRefreshTokenAdmin, uploadSalonLogo)

//Update Salon Logo
router.route("/updateSalonLogo").put(verifyRefreshTokenAdmin, updateSalonLogo)

//Get Salon Logo
router.route("/getSalonLogo").post(getSalonLogo)

//Delete Salon Logo
router.route("/deleteSalonLogo").delete(deleteSalonLogo)

//Update Salon Info
router.route("/updateSalonInfo").post(updateSalonInfo)





router.route("/getSalonsByLocation").get(verifyRefreshTokenBarber,getSalonsByLocation) //api working






export default router;