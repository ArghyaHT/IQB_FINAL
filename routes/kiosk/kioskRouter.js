import express from "express";
import { adminConnectKiosk, barberLoginKiosk, barberServedQueueKiosk, cancelQueueKiosk, changeBarberClockInStatus, changeBarberOnlineStatus, changeMobileBookingAvailabilityOfSalon, changeSalonKioskStatus, changeSalonOnlineStatus, getAllAdvertisementsKiosk, getAllBarberbySalonId, getAllBarberbySalonIdKiosk, getAllSalonServices, getAllSalonsByAdmin, getAttendenceByBarberIdKiosk, getAvailableBarbersForQKiosk, getBarberByServicesKiosk, getBarberServicesByBarberIdKiosk, getDefaultSalon, getQueueListBySalonId, googleBarberLoginKiosk, googleLoginKiosk, googleSalonAccountLogin, joinQueueKiosk, loginKiosk, logoutKiosk, salonAccountLogin } from "../../controllers/kiosk/kioskController.js";
import { VerifyAdminJwtToken } from "../../middlewares/kiosk/VerifyAdminJwtToken.js";
// import { verifyAuthToken } from "../../middlewares/VerifyAuthToken.js";
// import { verifyBarberRefreshToken } from "../../middlewares/VerifyBarberRefreshToken.js";
import { loggedIn } from "../../middlewares/kiosk/loggedInMiddlewares.js";
import { getAllCategories, getAllSalonCategories } from "../../controllers/web/admin/salonController.js";
import { getAllCategorySalonServices } from "../../controllers/mobile/salonController.js";

const router = express.Router();
//============ADMIN AND BARBER LOGIN FOR KIOSK================//
router.route("/loginKiosk").post(loginKiosk)

router.route('/logoutKiosk').post(logoutKiosk)

router.route('/googleLoginKiosk').post(googleLoginKiosk)

router.route("/barberLoginKiosk").post(barberLoginKiosk)

router.route("/googleBarberLoginKiosk").post(googleBarberLoginKiosk)


//=================ADMIN ROUTES KIOSK=================//
router.route("/adminConnectKiosk").post(adminConnectKiosk)

router.route("/loggedinKiosk").post(VerifyAdminJwtToken, loggedIn)

//Get All Salons By Admin
router.route("/getAllSalonsByAdmin").post(getAllSalonsByAdmin)

//Get Default Salon Of Admin
router.route("/getDefaultSalonKiosk").post(getDefaultSalon)

//=================ROUTES WHICH BOTH ADMIN AND BARBER CAN ACCESS=================//
router.route("/changeSalonOnlineStatusKiosk").post(changeSalonOnlineStatus)

router.route("/mobileBookingAvailabilityStatus").post(changeMobileBookingAvailabilityOfSalon)

router.route("/kioskAvailabilityStatus").post(changeSalonKioskStatus)

router.route("/getAllServiceCategories").get(getAllCategories)

router.route("/getSalonServicesByCategory").get(getAllCategorySalonServices)


//=================BARBER ROUTES KIOSK=================//
router.route("/getAllBarbersKiosk").get(getAllBarberbySalonIdKiosk)

router.route("/changeBarberOnlineStatusKiosk").post(changeBarberOnlineStatus)

router.route("/changeBarberClockedInStatusKiosk").post(changeBarberClockInStatus)

// router.route("/barberloggedinKiosk").get(BarberLoggedIn)

//=================QUEUE ROUTES KIOSK=================//
router.route("/joinQueueKiosk").post(joinQueueKiosk)

router.route("/getQlistBySalonIdKiosk").get(getQueueListBySalonId)

router.route("/getAllSalonServicesKiosk").get(getAllSalonServices)

router.route("/getAvailableBarbersForQKiosk").get(getAvailableBarbersForQKiosk)

router.route("/getBarberByServicesKiosk").post(getBarberByServicesKiosk)

router.route("/getServicesByBarberKiosk").post(getBarberServicesByBarberIdKiosk)

router.route("/barberServedQueueKiosk").post(barberServedQueueKiosk)

router.route("/canceledQKiosk").post(cancelQueueKiosk)


//=================ADVERTISEMENTS ROUTES KIOSK=================//
router.route("/getAllAdvertisementsKiosk").post(getAllAdvertisementsKiosk)

//=================BARBER ATTENDENCE ROUTES KIOSK=================//
router.route("/getAttendenceByBarberIdKiosk").post(getAttendenceByBarberIdKiosk)

//=================COMMON SIGN IN KIOSK=================//
router.route("/salonAccountLogin").post(salonAccountLogin)

router.route("/googleSalonAccountLogin").post(googleSalonAccountLogin)

router.route("/getAllBarbersBySalonId").get(getAllBarberbySalonId)

router.route("/getAllSalonCategories").post(getAllSalonCategories)


export default router;
