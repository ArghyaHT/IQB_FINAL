import express from "express"
import { addOrupdateBarberServices, barberDashboardApi, barberdashboardReports, barberLoginController, barberRegister, getQueuelistbyBarberId, matchVerificationCode, updateBarberProfileDetails } from "../../controllers/barberApp/barberAppController.js";
import { connectBarberToSalon, getAllSalonServicesForBarber, loginController, updateBarberInfo, uploadBarberprofilePic } from "../../controllers/web/barber/barberController.js";
import { getSalonsByLocation, getSalonsByNameAndCity } from "../../controllers/mobile/salonController.js";
import { newBarberdashboardReports } from "../../controllers/web/reports/reportsController.js";
import { barberCancelAppointment, barberServedAppointment, getAllAppointmentsByBarberIdAndDate } from "../../controllers/web/appointments/appointmentsController.js";
import { getBarberQueueHitory } from "../../controllers/web/queue/joinQueueHistoryController.js";
import { barberServedQueue, cancelQueue } from "../../controllers/web/queue/joinQueueController.js";
import { getAttendenceByBarberIdKiosk } from "../../controllers/kiosk/kioskController.js";
import { addBarberDayOff, getBarberOffDays } from "../../controllers/web/barberDayOff/barberDayOffController.js";
import { addBarberAppointmentDays, getBarberAppointmentDays } from "../../controllers/web/barberAppointmentDays/barberAppointmentController.js";
import { getAppointmentHistoryByBarberIdSalonId } from "../../controllers/web/appointments/appointmentHistoryController.js";
const router = express.Router();

router.route("/check-email-phonenumber").post(barberRegister)

router.route("/barberLogin").post(barberLoginController)

router.route("/matchVerificationCode").post(matchVerificationCode)

router.route("/updateBarberInfo").put(updateBarberInfo)

router.route("/searchByNameAndCity").get(getSalonsByNameAndCity)

router.route("/getSalonsByLocation").get(getSalonsByLocation)

router.route("/getSalonsByLocation").get(getSalonsByLocation)

router.route("/getAllSalonServicesForBarber").get(getAllSalonServicesForBarber)

router.route("/connectBarberToSalon").post(connectBarberToSalon)

router.route("/barberDashboardApi").post(barberDashboardApi)

router.route("/getbarberdashboardReports").post(barberdashboardReports)

router.route("/getbarberdashboardReports").post(barberdashboardReports)

router.route("/barberServedAppointment").post(barberServedAppointment)

router.route("/barberCancelAppointment").post(barberCancelAppointment)

router.route("/getQlistByBarberId").post(getQueuelistbyBarberId)

router.route("/getQueueHistoryBySalonIdBarberId").post(getBarberQueueHitory)

router.route("/barberServedQueue").post(barberServedQueue)

router.route("/getAttendenceByBarberId").post(getAttendenceByBarberIdKiosk)

router.route("/addBarberDayOff").post(addBarberDayOff)

router.route("/getBarberDayOffs").post(getBarberOffDays)

router.route("/addBarberAppointmentDays").post(addBarberAppointmentDays)

router.route("/getAllAppointmentsByBarberId").post(getAllAppointmentsByBarberIdAndDate)

router.route("/getAppointmentHistoryByBarberIdSalonId").post(getAppointmentHistoryByBarberIdSalonId)

router.route("/addOrupdateBarberServices").post(addOrupdateBarberServices)

router.route("/updateBarberProfileDetails").post(updateBarberProfileDetails)

router.route("/uploadBarberProfilePicture").post(uploadBarberprofilePic)

export default router;