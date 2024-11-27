import express from "express";

// import {  handleBarberProtectedRoute, handleProtectedRoute } from "../../middlewares/middlewares.js";
import { barberchangepassword, changeBarberClockInStatus, changeBarberEmailVerifiedStatus, changeBarberMobileVerifiedStatus, changeBarberOnlineStatus, changeBarberWorkingStatus, connectBarberToSalon, createBarberByAdmin, deleteBarber, getAllBarberbySalonId, getAllBarbersByServiceId, getBarberDetailsByEmail, getBarberServicesByBarberId, googleBarberLogin, googleBarberSignup, handleForgetPassword, handleLogout, handleResetPassword, loginController, registerController, sendVerificationCodeForBarberEmail, sendVerificationCodeForBarberMobile, updateBarberAccountDetails, updateBarberByAdmin, updateBarberInfo, uploadBarberprofilePic } from "../../../controllers/web/barber/barberController.js";
import { BarberLoggedIn } from "../../../middlewares/web/middlewares.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { getAllSalonServices, getAllSalons, getSalonInfoBySalonId, getSalonsByLocation } from "../../../controllers/web/admin/salonController.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";
import { barberServedQueue } from "../../../controllers/web/queue/joinQueueController.js";

const router = express.Router();

//AUTH ROUTES
router.route("/register").post(registerController)
router.route("/login").post(loginController)
router.route('/logout').post(handleLogout)
router.route("/barberloggedin").get(BarberLoggedIn)
router.route("/updateBarberInfo").put(updateBarberInfo)

router.route("/googleBarberSignUp").post(googleBarberSignup)
router.route("/googleBarberLogin").post(googleBarberLogin)


router.route('/forget-password').post(handleForgetPassword)
router.route('/reset-password/:token').post(handleResetPassword)

//CREATE BARBER BY ADMIN
router.route("/createBarberByAdmin").post(verifyRefreshTokenAdmin, createBarberByAdmin)

//UPDATE BARBER BY ADMIN
router.route("/updateBarberByAdmin").put(verifyRefreshTokenAdmin, updateBarberByAdmin)

router.route("/getAllBarberBySalonId").post(verifyRefreshTokenAdmin, getAllBarberbySalonId)

router.route("/getBarberServicesByBarberId").get(verifyRefreshTokenAdmin, getBarberServicesByBarberId)

//---------==========================================================================------------//

//GET ALL SALON SERVICES
router.route("/barberAllSalonServices").get(verifyRefreshTokenBarber, getAllSalonServices)
//CONNECT BARBER TO SALON
router.route("/connectBarberToSalon").post(verifyRefreshTokenBarber, connectBarberToSalon)

//==============================================//

//Update Barber Account Details
router.route("/updateBarberAccountDetails").put(verifyRefreshTokenBarber, updateBarberAccountDetails)

//UPDATE ADMIN PASSWORD
router.route("/updateBarberPassword").post(verifyRefreshTokenBarber, barberchangepassword)

//Upload Barber Profile Picture
router.route("/uploadBarberProfilePicture").post(verifyRefreshTokenBarber, uploadBarberprofilePic)


//DELETE BARBER
router.route("/deleteBarberByEmail").post(verifyRefreshTokenBarber, deleteBarber)


router.route("/changeBarberWorkingStatus").post(verifyRefreshTokenBarber, changeBarberWorkingStatus) //api working

router.route("/getAllBarbersByServiceId").get(verifyRefreshTokenBarber, getAllBarbersByServiceId)

//Send Mail to Admin for Verification
router.route("/sendVerificationCodeForBarberEmail").post(verifyRefreshTokenBarber, sendVerificationCodeForBarberEmail)

//Send EmailVerifiedStatus
router.route("/changeBarberEmailVerifiedStatus").post(verifyRefreshTokenBarber, changeBarberEmailVerifiedStatus)

//Send Message to Barber for Verification
router.route("/sendVerificationCodeForBarberMobile").post(verifyRefreshTokenBarber, sendVerificationCodeForBarberMobile)

//Change MobileVerifiedStatus
router.route("/changeBarberMobileVerifiedStatus").post(verifyRefreshTokenBarber, changeBarberMobileVerifiedStatus)


//============================Common Routes for Admin And Barber=======================//
//GET ALL SALON SERVICES
router.route("/allSalonServices").get(verifyRefreshTokenBarber, getAllSalonServices) //need to do for barberAlso

//BarberServed Api
router.route("/barberServedQueue").post(verifyRefreshTokenBarber, barberServedQueue)

//GET BARBER DETAILS BY EMAIL
router.route("/getBarberDetailsByEmail").post(verifyRefreshTokenBarber, getBarberDetailsByEmail)

router.route("/changeBarberOnlineStatus").post(verifyRefreshTokenAdmin, changeBarberOnlineStatus)

router.route("/changeBarberClockedInStatus").post(verifyRefreshTokenAdmin, changeBarberClockInStatus)

//GetAll Salons
router.route("/getAllSalons").get(verifyRefreshTokenBarber, getAllSalons)

//Get Salon Info 
router.route("/getSalonInfoBySalonId").post(verifyRefreshTokenBarber, getSalonInfoBySalonId)

export default router;

//ALL PROTECTED ROUTES
// router.route("/profile").get(handleProtectedRoute,profileController)

