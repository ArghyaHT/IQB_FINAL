import express from "express"
import { createCheckOutSession, onboardVendorAccount, vendorCreateCheckOutSession, vendorloginLink } from "../../../controllers/web/checkoutSessionController/checkoutSessionController.js";

const router = express.Router();

router.route("/create-checkout-session").post(createCheckOutSession)

router.route("/onboard-vendor-account").post(onboardVendorAccount)

router.route("/vendor-loginlink").post(vendorloginLink)

router.route("/vendor-create-checkout-session").post(vendorCreateCheckOutSession)

export default router