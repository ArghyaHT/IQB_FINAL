import express from "express"
import { handleStripeWebhook } from "../../../controllers/web/webhooks/webhookController";

const router = express.Router()

router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router
