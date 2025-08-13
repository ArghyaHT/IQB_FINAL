import express from "express";
import { getAdminDetailsByAdminEmailTest, getAllCategorySalonServices, getAllSalonServices, getAllSalons, getSalonCities, getSalonFeatures, getSalonInfo, getSalonsByLocation, getSalonsByNameAndCity, getallSalonsTest } from "../../controllers/mobile/salonController.js";

import { bookAppointmentBarbers, createAppointment, deleteAppointment, editAppointment, getAllAppointmentsByBarberId, getAllAppointmentsByBarberIdAndDate, getallAppointmentsByCustomerEmail, getAllAppointmentsBySalonId, getAllAppointmentsBySalonIdAndDate, getEngageBarberTimeSlots } from "../../controllers/mobile/appointmentController.js";
// import { verifyRefreshCustomerToken } from "../middlewares/VerifyRefreshCustomerToken.js";
import { getAllBarberbySalonId } from "../../controllers/mobile/barberController.js";
import { cancelQueueByCustomer, getAvailableBarbersForQ, getBarberByServices, getBarberServicesByBarberId, getQlistbyBarberId, getQueueListBySalonId, groupJoinQueue, singleJoinQueue } from "../../controllers/mobile/joinQueueController.js";
import { getAllAdvertisements } from "../../controllers/mobile/advertisementController.js";
import { getAppointmentHistorybyCustomerEmail } from "../../controllers/web/appointments/appointmentHistoryController.js";
import { pushDeviceTokens, pushFcmDeviceTokens } from "../../controllers/mobile/pushDevicesController.js";
import { checkPushNotifications } from "../../utils/pushNotifications/pushNotifications.js";
import { changeNotificationSeenStatus, deleteNotifications, getAllNotificationsByCustomerEmail } from "../../controllers/mobile/notificationController.js";
import { getBarberMissingAppointmentDates, getFullyBookedDatesBySalonIdBarberId } from "../../controllers/web/barberAppointmentDays/barberAppointmentController.js";
import { getMaxAppointmentDays, getSalonBusinessDays } from "../../controllers/mobile/salonSettingsController.js";
import { getAllCategories, getAllSalonCategories } from "../../controllers/web/admin/salonController.js";
// import { getAllAdvertisements } from "../../controllers/dashboard/dashboardController.js";

const router = express.Router();

//DESC:SALON ROUTES ==============================
router.route("/getAllSalonsMob").get(getAllSalons)

router.route("/getAllSalonServices").get(getAllSalonServices)

router.route("/searchByNameAndCity").get(getSalonsByNameAndCity)

router.route("/getSalonsByLocation").get(getSalonsByLocation)

router.route("/getSalonServicesByCategory").get(getAllCategorySalonServices)

//DESC:SALON ROUTES ==============================
router.route("/getAllBarberBySalonId").get(getAllBarberbySalonId)

//GET SALON INFO BY SALON ID
router.route("/getSalonInfoBySalonId").get(getSalonInfo)

router.route("/getAllServiceCategories").get(getAllCategories)



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
router.route("/getAvailableBarbersForQ").get(getAvailableBarbersForQ)

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


router.route("/getAllCustomerAppointments").post(getallAppointmentsByCustomerEmail)

router.route("/deleteNotifications").post(deleteNotifications)


router.route("/getAllCategories").get(getAllCategories)

router.route("/getAllSalonCategories").post(getAllSalonCategories)

router.route("/getSalonFeatures").post(getSalonFeatures)

router.route("/getMaxAppointmentDays").post(getMaxAppointmentDays)


export default router;
