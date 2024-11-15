import express from "express";
import { changeDefaultSalonIdOfCustomer, checkEmail, customerConnectSalon, customerDashboard, customerDisconnectSalon, customerFavoriteSalon, deleteCustomerFavoriteSalon, deleteCustomerProfilePicture, deleteSingleCustomer, forgetPassword, getAllAppointmentsByCustomer, getAllCustomerFavoriteSalons, getAllCustomers, getAllSalonsByCustomer, getCustomerDetails, matchVerificationCode, resetPassword, sendBulkEmailToCustomers, sendMailToCustomer, signIn, signUp, updateCustomer, updateCustomerProfilePic, uploadCustomerprofilePic, verifyPasswordResetCode } from "../../controllers/mobile/customerController.js";
// import { CustomerLoggedIn } from "../middlewares/loggedInMiddlewares.js";
// import { verifyRefreshCustomerToken } from "../middlewares/VerifyRefreshCustomerToken.js";

const router = express.Router();

//DESC:SIGNUP CUSTOMER=================

//CheckEmail
router.route("/checkEmail").post(checkEmail)

//SignUp
router.route("/signUp").post(signUp)

//Match Verification Code
router.route("/matchVerificationCode").post(matchVerificationCode)

//Forget Password
router.route("/forgetPassword").post(forgetPassword)

//Match Vaerification Code
router.route("/verifyPasswordResetCode").post(verifyPasswordResetCode)

//ResetPassword
router.route("/resetPassword").post(resetPassword)


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
router.route("/getAllAppointmentsByCustomerId").post(getAllAppointmentsByCustomer)


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
router.route("/deleteCustomerFavouriteSalon").delete(deleteCustomerFavoriteSalon)




export default router;