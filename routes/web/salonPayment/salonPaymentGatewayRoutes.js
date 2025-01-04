import express from 'express';
import { createCheckoutSession, handleStripeWebhook } from '../../../controllers/web/salonPaymentGateway/salonPaymentGatewayController.js';

const router = express.Router();

// // Webhook endpoint for Stripe
// router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// router.post('/create-checkout-session', createCheckoutSession);


export default router;