import moment from "moment";
import Stripe from "stripe"
import { validateEmail } from "../../../middlewares/validator.js";
import Admin from "../../../models/adminRegisterModel.js";

const stripe = Stripe("sk_test_51QiEoiBFW0Etpz0PlD0VAk8LaCcjOtaTDJ5vOpRYT5UqwNzuMmacWYRAl9Gzvf4HGXH9Lbva9BOWEaH9WHvz1qNb00nkfkXPna")

export const createCheckOutSession = async(req, res, next) => {
    try {
        const { productInfo } = req.body;
    
        console.log(productInfo)
    
        const expiryDate = moment().add(productInfo.paymentExpiryDate, 'days').toDate();
    
        if (productInfo) {
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: productInfo.products.map((product) => ({
              price_data: {
                currency: product.currency,
                //  currency: "inr",
                product_data: {
                  name: product.name,
                },
                unit_amount: product.price * 100, // Price in cents
              },
              quantity: product.quantity,
            })),
            success_url: "https://iqb-final.netlify.app/admin-subscription",
            // success_url: "http://localhost:5173/admin-subscription",
            cancel_url: "https://iqb-final.netlify.app/admin-salon",
            metadata: {
              salonId: productInfo.salonId,
              adminEmail: productInfo.adminEmail,
              purchaseDate: new Date(),
              paymentType: productInfo.paymentType,
              paymentExpiryDate: productInfo.paymentExpiryDate,
              isQueuing: productInfo.isQueuing,
              isAppointments: productInfo.isAppointments
            },
            // customer_email: productInfo.adminEmail ** this code will prefill the email in stripe payment in frontend default and cannot be modify
          });
    
          res.status(200).json({
            success: true,
            session,
          });
        }
    
      } catch (error) {
        console.error("Payment Check-Out Failed ", error);
        res.status(500).send("Internal Server Error");
      }
}

export const onboardVendorAccount = async(req, res, next) => {
    try {
        const { email } = req.body;
    
        // Basic validations
        if (!email) {
          return res.status(400).json({
            success: false,
            response: "Please enter email"
          });
        }
    
        if (!validateEmail(email)) {
          return res.status(400).json({
            success: false,
            response: "Invalid Email Format"
          });
        }
    
        const existingVendor = await Admin.findOne({ email });
    
        if (existingVendor) {
    
          if (
            existingVendor.vendorAccountDetails &&
            existingVendor.vendorAccountDetails.vendorAccountId
          ) {
            const vendorAccountId = existingVendor.vendorAccountDetails.vendorAccountId;
    
            // Create an account link for onboarding
            const accountLink = await stripe.accountLinks.create({
              account: vendorAccountId,
              refresh_url: 'https://iqb-final.netlify.app/admin-dashboard/editprofile',
              return_url: 'https://iqb-final.netlify.app/admin-dashboard/editprofile',
              type: 'account_onboarding',
            });
    
            return res.status(200).json({
              success: true,
              response: accountLink,
            });
          }
        }
    
        const stripeAccount = await stripe.accounts.create({
          type: 'express',
          country: 'US',
          email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: 'individual',
        });
    
        await Admin.findOneAndUpdate(
          { email },
          {
            $set: {
              "vendorAccountDetails.vendorAccountId": stripeAccount.id,
            }
          },
          { new: true, upsert: true }
        );
    
        // Generate an account link for onboarding
        const accountLink = await stripe.accountLinks.create({
          account: stripeAccount.id,
     refresh_url: 'https://iqb-final.netlify.app/admin-dashboard/editprofile',
              return_url: 'https://iqb-final.netlify.app/admin-dashboard/editprofile',
          type: 'account_onboarding',
        });
    
        return res.status(200).json({
          success: true,
          response: accountLink,
        });
    
      } catch (error) {
        console.error("Error onboarding vendor account:", error);
    
        // Return a generic error response
        return res.status(500).json({
          success: false,
          response: "An error occurred while onboarding the vendor. Please try again."
        });
      }
}

export const vendorloginLink = async(req, res, next) => {
    try {

        const { email } = req.body;
    
        // Basic validations
        if (!email) {
          return res.status(400).json({
            success: false,
            response: "Please enter email"
          });
        }
    
        if (!validateEmail(email)) {
          return res.status(400).json({
            success: false,
            response: "Invalid Email Format"
          });
        }
    
        const existingVendor = await Admin.findOne({ email });
    
        if (existingVendor) {
          const loginLink = await stripe.accounts.createLoginLink(existingVendor.vendorAccountDetails.vendorAccountId);
    
          // Send this link to the vendor
          res.status(200).json({
            success: true,
            url: loginLink.url,
          });
        }
    
      } catch (error) {
        console.log(error)
        next(error)
      }
}


export const vendorCreateCheckOutSession = async(req, res, next) => {
    try {

        //appointmnet can only be possible if the salon has bought appointment feature
    
        const { productInfo } = req.body;
    
        const salonappointment = await getSalonBySalonId(productInfo.salonId);
        
        if(!salonappointment.isAppointments){
          return res.status(400).json({
            success: false,
            message: "The salon has no appointment feature"
          })
        }
    
        if (!productInfo.customerName) {
          return res.status(400).json({ success: false, response: "Customer Name not present" });
        }
        if (!productInfo.customerEmail) {
          return res.status(400).json({ success: false, response: "Customer Email not present" });
        }
        if (!productInfo.salonId) {
          return res.status(400).json({ success: false, response: "Salon ID not present" });
        }
        if (!productInfo.vendorAccountId) {
          return res.status(400).json({ success: false, response: "Vendor Account ID not present" });
        }
        if (!productInfo.adminEmail) {
          return res.status(400).json({ success: false, response: "Admin Email is not present" });
        }
        if (!productInfo.products || productInfo.products.length === 0) {
          return res.status(400).json({ success: false, response: "Please select a product" });
        }
    
        const existingVendor = await Admin.findOne({ email: productInfo.adminEmail });
        if (!existingVendor?.vendorAccountDetails?.vendorAccountId) {
          return res.status(400).json({ success: false, response: "Vendor has no account created" });
        }
    
            // Create or fetch a Stripe Customer
            const customer = await stripe.customers.create({
              email: productInfo.customerEmail,
            });
    
        const totalAmount = productInfo.products.reduce(
          (total, item) => total + item.price * item.unit * 100,
          0
        );
        const platformFee = Math.ceil(totalAmount * 0.1);
    
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer: customer.id,
          line_items: productInfo.products.map((item) => ({
            price_data: {
              currency: item.currency,
              product_data: { name: item.name },
              unit_amount: item.price * 100,
            },
            quantity: item.unit,
          })),
          success_url: "https://iqb-final.netlify.app/mobilesuccess",
          cancel_url: "https://iqb-final.netlify.app",
          payment_intent_data: {
            application_fee_amount: platformFee,
            transfer_data: { destination: productInfo.vendorAccountId },
            on_behalf_of: productInfo.vendorAccountId,
          },
          metadata: {
            salonId: productInfo.salonId,
            adminEmail: productInfo.adminEmail,
            customerName: productInfo.customerName,
            customerEmail: productInfo.customerEmail,
            vendorAccountId: productInfo.vendorAccountId,
            currency: productInfo.currency,
            isoCurrencyCode: productInfo.isoCurrencyCode,
            salonName: productInfo.salonName,
            purchaseDate: new Date().toISOString(),
          },
        });
    
        res.status(200).json({ success: true, session });
      } catch (error) {
        console.error("Payment Check-Out Failed ", error.message);
        res.status(500).json({
          success: false,
          response: "An error occurred while creating the checkout session.",
          error: error.message,
        });
      }
}