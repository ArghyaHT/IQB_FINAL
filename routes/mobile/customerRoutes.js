import express from "express";
import { changeCustomerEmailVerifiedStatus, changeCustomerMobileVerifiedStatus, changeDefaultSalonIdOfCustomer, checkEmail, customerConnectSalon, customerDashboard, customerDisconnectSalon, customerFavoriteSalon, deleteCustomerFavoriteSalon, deleteCustomerProfilePicture, deleteSingleCustomer, forgetPassword, getAllAppointmentsByCustomer, getAllCustomerFavoriteSalons, getAllCustomers, getAllSalonsByCustomer, getCustomerDetails, googleCustomerLogin, googleCustomerSignup, matchVerificationCode, resetPassword, sendBulkEmailToCustomers, sendCustomerSupportEmail, sendMailToCustomer, sendVerificationCodeForCustomerEmail, sendVerificationCodeForCustomerMobile, showHideJoinQueueButton, signIn, signUp, updateCustomer, updateCustomerProfilePic, uploadCustomerprofilePic, verificationCodeApi, verifyPasswordResetCode } from "../../controllers/mobile/customerController.js";
// import { CustomerLoggedIn } from "../middlewares/loggedInMiddlewares.js";
// import { verifyRefreshCustomerToken } from "../middlewares/VerifyRefreshCustomerToken.js";

const router = express.Router();

//DESC:SIGNUP CUSTOMER=================

//CheckEmail
router.route("/checkEmail").post(checkEmail)

//SignUp
router.route("/signUp").post(signUp)

router.route("/sendCustomerVerificationCode").post(verificationCodeApi)

//Match Verification Code
router.route("/matchVerificationCode").post(matchVerificationCode)

//Forget Password
router.route("/forgetPassword").post(forgetPassword)

//Match Vaerification Code
router.route("/verifyPasswordResetCode").post(verifyPasswordResetCode)

//ResetPassword
router.route("/resetPassword").post(resetPassword)

//Google Signup
router.route("/googleCustomerSignup").post(googleCustomerSignup)

//Google SignIn
router.route("/googleCustomerSignIn").post(googleCustomerLogin)

//Send Mail to Admin for Verification
router.route("/sendVerificationCodeForCustomerEmail").post(sendVerificationCodeForCustomerEmail)

//Change EmailVerifiedStatus
router.route("/changeCustomerEmailVerifiedStatus").post(changeCustomerEmailVerifiedStatus)

//Send Message to Admin for Verification
router.route("/sendVerificationCodeForCustomerMobile").post(sendVerificationCodeForCustomerMobile)

//Change MobileVerifiedStatus
router.route("/changeCustomerMobileVerifiedStatus").post(changeCustomerMobileVerifiedStatus)



// // //Save Password
// // router.route("/savePassword").post(savePassword)

//DESC:SIGNIN CUSTOMER=================

//SignIn
router.route("/signIn").post(signIn)

// router.route('/logout').post(handleLogout)

// router.route("/customerloggedin").get(CustomerLoggedIn)

// GetAllCustomers by Salon ID
router.route("/getAllCustomers").get(getAllCustomers)

//UpdateCustomers
router.route("/updateCustomer").put( updateCustomer)

//DeleteCustomers
router.route("/deleteCustomer").delete(deleteSingleCustomer)

// //SendMailToCustomer
// router.route("/sendMailToCustomer").post(sendMailToCustomer)

//Connect Customer to the Salon
router.route("/customerConnectSalon").post(customerConnectSalon)

//Disconnect Customer to the Salon
router.route("/customerDisconnectSalon").post(customerDisconnectSalon)

//Get Customer Details By CustomerEmail
router.route("/getCustomerDetails").post(getCustomerDetails)

//Get all appointments by Customer
router.route("/getAllAppointmentsByCustomerEmail").post(getAllAppointmentsByCustomer)


// //Send Bulk Email to Customers
// router.route("/sendBulkEmailToCustomers").post(sendBulkEmailToCustomers)

//Upload Customer Profile Pic
router.route("/uploadCustomerProfilePic").post(uploadCustomerprofilePic)

//Update Customer Profile Pic
router.route("/updateCustomerProfilePic").put(updateCustomerProfilePic)

//Delete Customer Profile Pic
router.route("/deleteCustomerProfilePic").delete(deleteCustomerProfilePicture)


//Get All Connected Salons by Customer
router.route("/getAllConnectedSalons").post(getAllSalonsByCustomer)


//Change Salon Id of Customer
router.route("/changeDefaultSalonOfCustomer").post(changeDefaultSalonIdOfCustomer)

//Customer Dashboard 
router.route("/customerDashboard").post(customerDashboard)

//Customer Favourite Salon 
router.route("/customerFavouriteSalon").post(customerFavoriteSalon)

//Get Customer Favourite Salon 
router.route("/getCustomerFavouriteSalon").post(getAllCustomerFavoriteSalons)

//Delete Customer Favourite Salon 
router.route("/deleteCustomerFavouriteSalon").post(deleteCustomerFavoriteSalon)

router.route("/sendSupportMailCustomer").post(sendCustomerSupportEmail)

router.route("/showHideJoinQueueButton").post(showHideJoinQueueButton)


export default router;