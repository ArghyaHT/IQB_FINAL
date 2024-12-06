import express from "express";
import { getBarberQueueHitory, getSalonQueueHistoryBySalonId } from "../../../controllers/web/queue/joinQueueHistoryController.js";


const router = express.Router();

router.route("/getQueueHistoryBySalonId").post(getSalonQueueHistoryBySalonId)


router.route("/getQueueHistoryBySalonIdBarberId").post(getBarberQueueHitory)


export default router;