import express from "express";
import { adminchangepassword, approveBarber, changeDefaultSalonIdOfAdmin, changeEmailVerifiedStatus, changeMobileVerifiedStatus, deleteAdminProfilePicture, deleteSingleAdmin, getAllSalonsByAdmin, getDefaultSalonByAdmin, googleAdminLogin, googleAdminSignup, handleForgetPasswordAdmin, handleLogoutAdmin, handleResetPasswordAdmin, loginAdmin, registerAdmin, sendVerificationCodeForAdminEmail, sendVerificationCodeForAdminMobile, updateAdminAccountDetails, updateAdminInfo, updateAdminProfilePic, uploadAdminprofilePic } from "../../../controllers/web/admin/adminController.js";
import { AdminLoggedIn } from "../../../middlewares/web/middlewares.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { getAllSalonServices } from "../../../controllers/web/admin/salonController.js";
import { barberServedQueue } from "../../../controllers/web/queue/joinQueueController.js";
import { changeBarberOnlineStatus, deleteBarber, getBarberDetailsByEmail } from "../../../controllers/web/barber/barberController.js";

const router = express.Router();

//AUTH ROUTES
router.route("/register").post(registerAdmin)
router.route("/login").post(loginAdmin)
router.route('/logout').post(handleLogoutAdmin)
router.route("/adminloggedin").get(AdminLoggedIn)
router.route("/updateadminInfo").put(updateAdminInfo)

// router.route("/demo").get(verifyRefreshTokenAdmin, demoController)


router.route('/forget-password').post(handleForgetPasswordAdmin)
router.route('/reset-password/:token').post(handleResetPasswordAdmin)

router.route("/googleAdminSignUp").post(googleAdminSignup)
router.route("/googleAdminLogin").post(googleAdminLogin)


// //GOOGLE_LOGIN
// router.route("/google-login").post(googleLoginController)

// //FOR REFRESHING NEW ACCESS TOKEN
// router.route("/refresh-token").post(refreshTokenController)

// //ISLOGOUT MIDDLEWARE
// router.route("/loggedoutmiddleware").get(verifyRefreshTokenAdmin,isLoggedOutMiddleware)

// //ISLOGIN MIDDLEWARE
// router.route("/loggedinmiddleware").get(verifyRefreshTokenAdmin, isLogginMiddleware)

//ALL PROTECTED ROUTES
// router.route("/profile").get(handleProtectedRoute,profileController)
// router.route("/getAllAdmins").get(allAdmins)

router.route("/deleteAdmin").post(verifyRefreshTokenAdmin,deleteSingleAdmin)

//Upload Admin Profile Picture
router.route("/uploadAdminProfilePicture").post(verifyRefreshTokenAdmin, uploadAdminprofilePic)

//UPDATE BARBER PROFILE PICTURE
router.route("/updateAdminProfilePicture").put(verifyRefreshTokenAdmin, updateAdminProfilePic)

//DELETE BARBER PROFILE PICTURE
router.route("/deleteAdminProfilePicture").delete(verifyRefreshTokenAdmin, deleteAdminProfilePicture)

//UPDATE ADMIN ACCOUNT DETAILS
router.route("/updateAdminAcoountDetails").put(verifyRefreshTokenAdmin, updateAdminAccountDetails)

//UPDATE ADMIN PASSWORD
router.route("/updateAdminPassword").post(verifyRefreshTokenAdmin, adminchangepassword)

//Approve Barber By Admin
router.route("/approvedBarber").post(verifyRefreshTokenAdmin,approveBarber)

//Get All Salons By Admin
router.route("/getAllSalonsByAdmin").post(verifyRefreshTokenAdmin,getAllSalonsByAdmin)

//Change Default SalonId Of Admin
router.route("/changeDefaultSalonIdofAdmin").post(verifyRefreshTokenAdmin, changeDefaultSalonIdOfAdmin)

//Send Mail to Admin for Verification
router.route("/sendVerificationCodeForAdminEmail").post(verifyRefreshTokenAdmin, sendVerificationCodeForAdminEmail)

//Change EmailVerifiedStatus
router.route("/changeEmailVerifiedStatus").post(verifyRefreshTokenAdmin, changeEmailVerifiedStatus)

//Send Message to Admin for Verification
router.route("/sendVerificationCodeForAdminMobile").post(verifyRefreshTokenAdmin, sendVerificationCodeForAdminMobile)

//Change MobileVerifiedStatus
router.route("/changeMobileVerifiedStatus").post(verifyRefreshTokenAdmin, changeMobileVerifiedStatus)

//Get Default Salon Of Admin
router.route("/getDefaultSalonByAdmin").post(verifyRefreshTokenAdmin, getDefaultSalonByAdmin)


//============================Common Routes for Admin And Barber=======================//
//GET ALL SALON SERVICES
router.route("/allSalonServices").get(verifyRefreshTokenAdmin, getAllSalonServices) //need to do for barberAlso

//BarberServed Api
router.route("/barberServedQueue").post(verifyRefreshTokenAdmin,barberServedQueue)

//GET BARBER DETAILS BY EMAIL
router.route("/getBarberDetailsByEmail").post(verifyRefreshTokenAdmin ,getBarberDetailsByEmail)

router.route("/changeBarberOnlineStatus").post(verifyRefreshTokenAdmin, changeBarberOnlineStatus)

router.route("/deleteBarberByEmail").post(verifyRefreshTokenAdmin, deleteBarber)



export default router;