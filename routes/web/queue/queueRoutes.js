import express from "express";
import { barberServedQueue, cancelQueue, getQhistoryByCustomerEmail, getQlistbyBarberId, getQueueListBySalonId } from "../../../controllers/web/queue/joinQueueController.js";
import { verifyRefreshTokenAdmin } from "../../../middlewares/web/VerifyRefreshTokenAdmin.js";
import { verifyRefreshTokenBarber } from "../../../middlewares/web/VerifyRefreshTokenBarber.js";


const router = express.Router();


//getQListBySalonId
router.route("/getQListBySalonId").get(verifyRefreshTokenAdmin,getQueueListBySalonId)


router.route("/getQListBySalonIdTest").get(getQueueListBySalonId)


// //Auto Join
// router.route("/autoJoin").post(verifyRefreshTokenAdmin,autoJoin),

//==============================================//

//Get Q list by BarberId
router.route("/getQlistByBarberId").post(verifyRefreshTokenBarber, getQlistbyBarberId)

//Cancel Q List
router.route("/barberServedQueue").post(barberServedQueue)

//Cancel Q List
router.route("/cancelQ").post(cancelQueue)

//Get Q History
router.route("/getQhistory").post(getQhistoryByCustomerEmail)


export default router;