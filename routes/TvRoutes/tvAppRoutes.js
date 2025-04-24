import express from "express";
import { adminConnectKiosk, barberLoginKiosk, barberServedQueueTvApp, cancelQueueTvApp, changeBarberClockInStatus, changeBarberOnlineStatus, changeMobileBookingAvailabilityOfSalon, changeSalonOnlineStatus, getAllAdvertisementsKiosk, getAllBarberbySalonId, getAllBarberbySalonIdKiosk, getAllSalonsByAdmin, getAllSalonServices, getAttendenceByBarberIdKiosk, getAvailableBarbersForQKiosk, getBarberByServicesKiosk, getBarberServicesByBarberIdKiosk, getDefaultSalon, getQueueListBySalonId, googleLoginTV, joinQueueKiosk, loginKiosk, salonAccountLogin } from "../../controllers/kiosk/kioskController.js";
import { getDefaultSalonDetailsEmail } from "../../services/kiosk/salon/salonServices.js";
import { getSalonInfoBySalonId } from "../../controllers/web/admin/salonController.js";
import { getDefaultSalonDetailsByAdmin } from "../../services/web/admin/salonService.js";

const router = express.Router();

router.route("/login").post(loginKiosk)

router.route("/googleLoginTV").post(googleLoginTV)


//getQListBySalonId
router.route("/getQListBySalonId").get(getQueueListBySalonId)

router.route("/getAllSalonsByAdmin").post(getAllSalonsByAdmin)

router.route("/adminConnectSalon").post(adminConnectKiosk)

//=================ADVERTISEMENTS ROUTES KIOSK=================//
router.route("/getAllAdvertisements").post(getAllAdvertisementsKiosk)

router.route("/getAllBarbersBySalonId").get(getAllBarberbySalonId)

router.route("/barberServedQueue").post(barberServedQueueTvApp)

router.route("/barberlogin").post(barberLoginKiosk)

router.route("/getAllBarberEmails").get(getAllBarberbySalonIdKiosk)

router.route("/changeBarberClockIn").post(changeBarberClockInStatus)

router.route("/changeBarberOnline").post(changeBarberOnlineStatus)

router.route("/getBarberAttendance").post(getAttendenceByBarberIdKiosk)

router.route("/getAvailableBarbersForQ").get(getAvailableBarbersForQKiosk)

router.route("/getServicesByBarber").post(getBarberServicesByBarberIdKiosk)

router.route("/joinQueue").post(joinQueueKiosk)



router.route("/getAllSalonServices").get(getAllSalonServices)

router.route("/salonLogIn").post(salonAccountLogin)


router.route("/changeSalonOnlineStatus").post(changeSalonOnlineStatus)

router.route("/mobileBookingAvailabilityStatus").post(changeMobileBookingAvailabilityOfSalon)

router.route("/cancelQueue").post(cancelQueueTvApp)


router.route("/getAllServices").get(getAllSalonServices)

router.route("/getBarberByServices").post(getBarberByServicesKiosk)


router.route("/getDefaultSalonDetailBySalonIdTv").post(getDefaultSalon)



export default router;