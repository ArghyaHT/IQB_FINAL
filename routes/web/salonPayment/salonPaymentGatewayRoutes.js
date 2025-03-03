import express from 'express';
import { getSalonPayments } from '../../../controllers/web/salonPaymentGateway/salonPaymentGatewayController.js';
import { paymentHistories } from '../../../controllers/web/salonPaymentGateway/salonpaymentHistoryController.js';

const router = express.Router();

// // Webhook endpoint for Stripe
// router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// router.post('/create-checkout-session', createCheckoutSession);

router.route("/getSalonPaymentsBySalonId").post(getSalonPayments)

router.route("/getSalonPaymentHistoryBySalonId").post(paymentHistories)



export default router;