import express from "express"
import { handleStripeWebhook, saveaccountid } from "../../../controllers/web/webhooks/webhookController";

const router = express.Router()

router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

router.post('/saveaccountid', express.raw({ type: 'application/json' }), saveaccountid);


export default router
