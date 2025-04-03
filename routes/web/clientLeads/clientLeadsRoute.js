import express from "express"
import { clientLeads } from "../../../controllers/web/clientLeads/clientLeadsController.js";

const router = express.Router()

router.route("/saveClientleads").post(clientLeads)

export default router;