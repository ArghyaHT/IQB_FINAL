import express from "express";
import { sendBulkEmails, sendBulkTextMessages } from "../../../controllers/web/bulkMessageAndEmail/bulkMessageAndEmailsController.js";


const router = express.Router();

router.route("/sendBulkTextMessages").post(sendBulkTextMessages)

router.route("/sendBulkEmails").post(sendBulkEmails)


export default router;