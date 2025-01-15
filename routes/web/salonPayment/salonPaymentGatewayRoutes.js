import express from 'express';
import { getSalonPayments } from '../../../controllers/web/salonPaymentGateway/salonPaymentGatewayController.js';

const router = express.Router();

// // Webhook endpoint for Stripe
// router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// router.post('/create-checkout-session', createCheckoutSession);

router.route("/getSalonPaymentsBySalonId").post(getSalonPayments)


export default router;