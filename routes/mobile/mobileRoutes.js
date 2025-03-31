import express from "express";
import { getAdminDetailsByAdminEmailTest, getAllSalonServices, getAllSalons, getSalonCities, getSalonInfo, getSalonsByLocation, getSalonsByNameAndCity, getallSalonsTest } from "../../controllers/mobile/salonController.js";

import { bookAppointmentBarbers, createAppointment, deleteAppointment, editAppointment, getAllAppointmentsByBarberId, getAllAppointmentsByBarberIdAndDate, getAllAppointmentsBySalonId, getAllAppointmentsBySalonIdAndDate, getEngageBarberTimeSlots } from "../../controllers/mobile/appointmentController.js";
// import { verifyRefreshCustomerToken } from "../middlewares/VerifyRefreshCustomerToken.js";
import { getAllBarberbySalonId } from "../../controllers/mobile/barberController.js";
import { cancelQueueByCustomer, getAvailableBarbersForQ, getBarberByServices, getBarberServicesByBarberId, getQlistbyBarberId, getQueueListBySalonId, groupJoinQueue, singleJoinQueue } from "../../controllers/mobile/joinQueueController.js";
import { getAllAdvertisements } from "../../controllers/mobile/advertisementController.js";
import { getAppointmentHistorybyCustomerEmail } from "../../controllers/web/appointments/appointmentHistoryController.js";
import { pushDeviceTokens, pushFcmDeviceTokens } from "../../controllers/mobile/pushDevicesController.js";
import { checkPushNotifications } from "../../utils/pushNotifications/pushNotifications.js";
import { changeNotificationSeenStatus, getAllNotificationsByCustomerEmail } from "../../controllers/mobile/notificationController.js";
import { getBarberMissingAppointmentDates, getFullyBookedDatesBySalonIdBarberId } from "../../controllers/web/barberAppointmentDays/barberAppointmentController.js";
import { getSalonBusinessDays } from "../../controllers/mobile/salonSettingsController.js";
// import { getAllAdvertisements } from "../../controllers/dashboard/dashboardController.js";

const router = express.Router();

//DESC:SALON ROUTES ==============================
router.route("/getAllSalonsMob").get(getAllSalons)

router.route("/getAllSalonServices").get(getAllSalonServices)

router.route("/searchByNameAndCity").post(getSalonsByNameAndCity)

router.route("/getSalonsByLocation").get(getSalonsByLocation)

//DESC:SALON ROUTES ==============================
router.route("/getAllBarberBySalonId").post(getAllBarberbySalonId)

//GET SALON INFO BY SALON ID
router.route("/getSalonInfoBySalonId").get(getSalonInfo)


//DESC:APPOINTMENT ROUTES ==============================
router.route("/createAppointment").post(createAppointment);

router.route("/editAppointments").put(editAppointment)

router.route("/deleteAppointments").delete(deleteAppointment)

router.route("/bookAppointmentBarbers").post(bookAppointmentBarbers)

router.route("/getEngageBarberTimeSlots").post(getEngageBarberTimeSlots)

router.route("/getAllAppointmentsBySalonId").post(getAllAppointmentsBySalonId)

router.route("/getAllAppointmentsBySalonIdAndDate").post(getAllAppointmentsBySalonIdAndDate)

router.route("/getAllAppointmentsByBarberId").post(getAllAppointmentsByBarberId)

router.route("/getAllAppointmentsByBarberIdAndDate").post(getAllAppointmentsByBarberIdAndDate)

router.route("/getAppointmentHistory").post(getAppointmentHistorybyCustomerEmail)


// //DESC:QUEUE ROUTES ==============================

//Single Join
router.route("/singleJoinQueue").post(singleJoinQueue)

//Group Join
router.route("/groupJoinQueue").post(groupJoinQueue)

//Cancel Queue
router.route("/cancelQueueByCustomer").post(cancelQueueByCustomer)

//Get Available Barbers for Queue
router.route("/getAvailableBarbersForQ").post(getAvailableBarbersForQ)

//Get Barber By Multiple ServiceId
router.route("/getBarberByMultipleServiceId").post(getBarberByServices)

//Get Services by BarberId
router.route("/getServicesByBarber").post(getBarberServicesByBarberId)

//Get Q list by BarberId
router.route("/getQlistByBarberId").post(getQlistbyBarberId)

//Get Q list by Salon Id
router.route("/getQlistBySalonId").get(getQueueListBySalonId)

//DESC:ADVERTISEMENT ROUTES ==============================

//Get Advertisements
router.route("/getAllAdvertisements").post(getAllAdvertisements)



//TEST
router.route("/getAllSalonsTest").get(getallSalonsTest)

router.route("/getAdminByEmailTest").post(getAdminDetailsByAdminEmailTest)



router.route("/pushDevices").post(pushDeviceTokens)

router.route("/pushDevicesFcm").post(pushFcmDeviceTokens)

router.route("/checkPushNotifications").post(checkPushNotifications)

router.route("/getAllNotificationsByCustomerEmail").post(getAllNotificationsByCustomerEmail)

router.route("/changeNotificationSeenStatus").post(changeNotificationSeenStatus)

router.route("/getSalonCities").post(getSalonCities)

router.route("/getBarberDisabledAppointmentDates").post(getBarberMissingAppointmentDates)

router.route("/getFullyBookedDatesBySalonIdBarberId").post(getFullyBookedDatesBySalonIdBarberId)


//Get Salon Business hours

router.route("/getSalonBusinessHours").post(getSalonBusinessDays)

export default router;
