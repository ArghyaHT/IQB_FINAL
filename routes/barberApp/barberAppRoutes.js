import express from "express"
import { barberDashboardApi, barberdashboardReports, barberLoginController, barberRegister, matchVerificationCode } from "../../controllers/barberApp/barberAppController.js";
import { connectBarberToSalon, getAllSalonServicesForBarber, loginController, updateBarberInfo } from "../../controllers/web/barber/barberController.js";
import { getSalonsByLocation, getSalonsByNameAndCity } from "../../controllers/mobile/salonController.js";
import { newBarberdashboardReports } from "../../controllers/web/reports/reportsController.js";
import { barberCancelAppointment, barberServedAppointment } from "../../controllers/web/appointments/appointmentsController.js";
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


export default router;