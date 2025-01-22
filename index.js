import express from "express";
import connectDB from "./db/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { rateLimit } from "express-rate-limit";
import dotenv from "dotenv"
import admin from "firebase-admin";
import fileUpload from "express-fileupload";
import morgan from "morgan";
// import serviceAccount from './notification_push_service_key.json';
import jsonFile from "jsonfile"
import path from "path"
import { v2 as cloudinary } from "cloudinary";
import bodyParser from "body-parser";

import kioskRoutes from "./routes/kiosk/kioskRouter.js"
import customerRoutes from "./routes/mobile/customerRoutes.js"
import mobileRoutes from "./routes/mobile/mobileRoutes.js"
import tvappRoutes from "./routes/TvRoutes/tvAppRoutes.js"
import adminRoutes from "./routes/web/admin/adminRoutes.js"
import salonRoutes from "./routes/web/admin/salonRoutes.js"
import barberRoutes from "./routes/web/barber/barberRoutes.js"
import queueRoutes from "./routes/web/queue/queueRoutes.js"
import appointmentRoutes from "./routes/web/appointments/appointmentRoutes.js"
import advertisementRoutes from "./routes/web/dashboard/dashboardRoutes.js"
import salonSettingsRoutes from "./routes/web/salonSettingsRoutes/salonSettingsRoutes.js"
import notificationRoutes from "./routes/web/notifications/notificationsRoutes.js"
import ratingRoutes from "./routes/web/ratings/ratingsRoutes.js"
import iconRoutes from "./routes/web/icons/iconsRoutes.js"
import countryRoutes from "./routes/web/countries/countryRoutes.js"
import customerRoutesWeb from "./routes/web/customer/customerRoutes.js"
import bulkMessageAndEmailsRoutes from "./routes/web/bulkMessagesAndEmailRoutes/bulkMesagesAndEmailRoutes.js"
import reports from "./routes/web/reports/reportsRoutes.js"
import queuehistoryRoutes from "./routes/web/queue/queueHistoryRoutes.js"
import barberDayOffRoutes from "./routes/web/barberDayOff/barberDayoffRoutes.js"
import barberAppointmentDays from "./routes/web/barberAppointmentDays/barberAppointmentDaysRoutes.js"
import salonPaymentRoutes from "./routes/web/salonPayment/salonPaymentGatewayRoutes.js"

// import { setupCronJobs } from "./triggers/cronJobs.js";
// import { storeCountries } from "./utils/countries.js";


import loggerRoutes from "./routes/loggerRoutes.js"
import logger from "./utils/logger/logger.js";
import { GlobalErrorHandler } from "./middlewares/GlobalErrorHandler.js";
import { logMiddleware } from "./controllers/loggerController.js";
import { checkPaymentsExpiry, checkQueuingAndAppointmentExpire, salonShutdown, updateCustomers } from "./triggers/cronjobs.js";
import Stripe from "stripe";
import Salon from "./models/salonRegisterModel.js";
import moment from "moment";
import { sendPaymentSuccesEmail } from "./utils/emailSender/emailSender.js";
import { getSalonBySalonId } from "./services/mobile/salonServices.js";
import { generateInvoiceNumber } from "./utils/invoice/invoicepdf.js";
import { salonPayments } from "./services/web/salonPayments/salonPaymentService.js";
import { validateEmail } from "./middlewares/validator.js";
import Admin from "./models/adminRegisterModel.js";
import SalonSettings from "./models/salonSettingsModel.js";
import { vendorCustomerPayment } from "./services/web/vendorCustomerDetails/vendorCustomerService.js";

dotenv.config()

const rateLimiter = rateLimit({
  windowMs: 20 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many request from this IP.Please try again later',
  standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
})

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Perform necessary actions to handle the error gracefully
  // For example, log the error, perform cleanup, and gracefully exit the process if needed
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform necessary actions to handle the rejection gracefully
  // For example, log the rejection, perform cleanup, and handle the promise rejection if needed
});

connectDB()


// setupCronJobs(); 

// Writing the cors for for both dev and prod
const app = express()


const allowedOrigins = [
  "https://productstripe.netlify.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://iqb-kiosk.netlify.app",
  "https://iqb-final.onrender.com",
  "https://iqb-final.netlify.app"
];

// //Use Multiple Cors
app.use(cors({
  origin: function (origin, callback) {
    // Check if the origin is in the allowed origins list or if it's undefined (like in case of same-origin requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      callback(new Error("Not allowed by CORS")); // Deny the request
    }
  },
  // credentials: true
}));


//============================================Stripe=========================================//
const stripe = Stripe("sk_test_51QiEoiBFW0Etpz0PlD0VAk8LaCcjOtaTDJ5vOpRYT5UqwNzuMmacWYRAl9Gzvf4HGXH9Lbva9BOWEaH9WHvz1qNb00nkfkXPna")

const endpointSecret = "whsec_pKv2A3YHgbW0MkJOKVgISTXZjtLoBNYX"; // Replace with your actual webhook secret


app.post('/api/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // console.log(session)

    const paymentIntentId = session.payment_intent;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const vendorAccountId = session.metadata.vendorAccountId
    const paymentStatus = paymentIntent.status

    if (vendorAccountId && paymentStatus === "succeeded") {

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const products = lineItems.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        price: item.amount_total / 100, // Amount in dollars (converted from cents)
        currency: session.currency,
      }));

      const salonId = Number(session.metadata.salonId);

      // Access additional data from metadata
      const paymentData = {
        salonId: salonId,
        salonName: session.metadata.salonName,
        vendorEmail: session.metadata.adminEmail,
        vendorAccountId: session.metadata.vendorAccountId,
        purchaseDate: session.metadata.purchaseDate,
        customerEmail: session.metadata.customerEmail,
        customerName: session.metadata.customerName,
        amount: session.amount_total / 100, // Convert from cents
        isoCurrencyCode: session.metadata.isoCurrencyCode,
        currency: session.metadata.currency,
        paymentIntentId: session.payment_intent,
        status: session.payment_status,
        products: products,
      };

      console.log(paymentData)

      await vendorCustomerPayment(paymentData)



    }
    else {

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

      const products = lineItems.data.map((item) => ({
        name: item.description,
        quantity: item.quantity,
        price: item.amount_total / 100, // Amount in dollars (converted from cents)
        currency: session.currency,
      }));

      const invoice = await generateInvoiceNumber()

      // Access additional data from metadata
      const paymentData = {
        salonId: session.metadata.salonId,
        adminEmail: session.metadata.adminEmail,
        invoiceNumber: invoice,
        paymentType: session.metadata.paymentType,
        purchaseDate: session.metadata.purchaseDate,
        paymentExpiryDate: session.metadata.paymentExpiryDate,
        isQueuing: session.metadata.isQueuing,
        isAppointments: session.metadata.isAppointments,
        customerEmail: session.customer_details.email,
        customerName: session.customer_details.name,
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency,
        paymentIntentId: session.payment_intent,
        status: session.payment_status,
        products: products,
      };

      const isQueueing = session.metadata.isQueuing;
      const isAppointment = session.metadata.isAppointments;

      if (isQueueing === "true" && isAppointment === "false") {
        
        const salon = await getSalonBySalonId(session.metadata.salonId)

        const existingExpiryDate = parseInt(salon.queueingExpiryDate, 10); // Convert stored Unix timestamp to an integer
        const paymentDaysToAdd = parseInt(session.metadata.paymentExpiryDate, 10); // Number of days to add
      
        // Calculate the new expiry date
        const newExpiryDate = moment.unix(existingExpiryDate) // Convert existing Unix timestamp to a moment object
          .add(paymentDaysToAdd, 'days') // Add the payment expiry days
          .unix(); 

        const isQueuingValue = Boolean(session.metadata.isQueuing)
        await Salon.updateOne(
          { salonId: session.metadata.salonId },
          {
            $set: {
              isQueuing: isQueuingValue,
              queueingExpiryDate: newExpiryDate
            },
          }
        )

        // await SalonSettings.updateOne(
        //   { salonId: session.metadata.salonId },
        //   {
        //     $set: {
        //       isQueuing: isQueuingValue,
        //       queueingExpiryDate: session.metadata.paymentExpiryDate
        //     },
        //   }
        // )

      await salonPayments(paymentData)

      // const salon = await getSalonBySalonId(session.metadata.salonId)

      const emailSubject = ` Payment Confirmation - ${salon.salonName}`;
      const emailBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto&display=swap" rel="stylesheet">

        <style>
        body {
               font-family: 'Poppins', sans-serif;
               margin: 0;
               padding: 0;
               background-color: #f9f9f9;
               color: #000,
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo img {
                max-width: 150px;
                border-radius: 50%;
                width: 150px;
                height: 150px;
                object-fit: cover;
            }
            .email-content {
                padding: 20px;
                background-color: #f8f8f8;
                font-size: 1rem;
                border-radius: 10px;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 8px;
            }
            p {
                line-height: 1.6;
            }
            .footer {
                margin-top: 20px;
                font-size: 0.9em;
                text-align: center;
                color: #888888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-content">
            <div class="header">
                <h1>Payment Confirmation</h1>
            </div>
                <p>Dear ${session.customer_details.name},</p>
                <p>Thank you for your payment at <strong>${salon.salonName}</strong>. Below are the details of your transaction:</p>
                <ul>
                    <li><strong>Purchase Date:</strong> ${moment.unix(session.metadata.purchaseDate).format('YYYY-MM-DD')}</li>
                    <li><strong>Expiry Date:</strong> ${moment.unix(newExpiryDate).format('YYYY-MM-DD')}</li>
                    <li><strong>Total Amount Paid:</strong> ${session.currency.toUpperCase()} ${session.amount_total / 100}</li>
                    <li><strong>Products Purchased:</strong> ${products.map(product => product.name).join(', ')}</li>
                </ul>
                <p>If you have any questions or need further assistance, feel free to contact us.</p>
                <p>Best regards,</p>
                <p>
                    <strong>IQueueBook</strong><br>
                    <strong>support@iqueuebarbers.com</strong> 
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} IQueueBook. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

      try {
        sendPaymentSuccesEmail(session.customer_details.email, emailSubject, emailBody, invoice, paymentData, products);
        console.log("Payment Email Sent")
        return
      } catch (error) {
        console.error('Error sending email:', error);
        return
      }
      }

      if (isAppointment === "true" && isQueueing === "false") {

        const salon = await getSalonBySalonId(session.metadata.salonId)

        const existingExpiryDate = parseInt(salon.appointmentExpiryDate, 10); // Convert stored Unix timestamp to an integer
        const paymentDaysToAdd = parseInt(session.metadata.paymentExpiryDate, 10); // Number of days to add
      
        // Calculate the new expiry date
        const newExpiryDate = moment.unix(existingExpiryDate) // Convert existing Unix timestamp to a moment object
          .add(paymentDaysToAdd, 'days') // Add the payment expiry days
          .unix(); 


        const isAppointmentValue = Boolean(session.metadata.isAppointments)

        await Salon.updateOne(
          { salonId: session.metadata.salonId },
          {
            $set: {
              isAppointments: isAppointmentValue,
              appointmentExpiryDate: newExpiryDate
            },
          }
        )

        // await SalonSettings.updateOne(
        //   { salonId: session.metadata.salonId },
        //   {
        //     $set: {
        //       isAppointments: isAppointmentValue,
        //       appointmentExpiryDate: session.metadata.paymentExpiryDate
        //     },
        //   }
        // )

      await salonPayments(paymentData)

      // const salon = await getSalonBySalonId(session.metadata.salonId)

      const emailSubject = ` Payment Confirmation - ${salon.salonName}`;
      const emailBody = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto&display=swap" rel="stylesheet">

        <style>
        body {
               font-family: 'Poppins', sans-serif;
               margin: 0;
               padding: 0;
               background-color: #f9f9f9;
               color: #000,
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .logo img {
                max-width: 150px;
                border-radius: 50%;
                width: 150px;
                height: 150px;
                object-fit: cover;
            }
            .email-content {
                padding: 20px;
                background-color: #f8f8f8;
                font-size: 1rem;
                border-radius: 10px;
            }
            ul {
                padding-left: 20px;
            }
            li {
                margin-bottom: 8px;
            }
            p {
                line-height: 1.6;
            }
            .footer {
                margin-top: 20px;
                font-size: 0.9em;
                text-align: center;
                color: #888888;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="email-content">
            <div class="header">
                <h1>Payment Confirmation</h1>
            </div>
                <p>Dear ${session.customer_details.name},</p>
                <p>Thank you for your payment at <strong>${salon.salonName}</strong>. Below are the details of your transaction:</p>
                <ul>
                    <li><strong>Purchase Date:</strong> ${moment.unix(session.metadata.purchaseDate).format('YYYY-MM-DD')}</li>
                    <li><strong>Expiry Date:</strong> ${moment.unix(newExpiryDate).format('YYYY-MM-DD')}</li>
                    <li><strong>Total Amount Paid:</strong> ${session.currency.toUpperCase()} ${session.amount_total / 100}</li>
                    <li><strong>Products Purchased:</strong> ${products.map(product => product.name).join(', ')}</li>
                </ul>
                <p>If you have any questions or need further assistance, feel free to contact us.</p>
                <p>Best regards,</p>
                <p>
                    <strong>IQueueBook</strong><br>
                    <strong>support@iqueuebarbers.com</strong> 
                </p>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} IQueueBook. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

      try {
        sendPaymentSuccesEmail(session.customer_details.email, emailSubject, emailBody, invoice, paymentData, products);
        console.log("Payment Email Sent")
        return
      } catch (error) {
        console.error('Error sending email:', error);
        return
      }
      }

      if (isAppointment === "true" && isQueueing === "true") {

        const salon = await getSalonBySalonId(session.metadata.salonId)

        const existingAppointmentExpiryDate = parseInt(salon.appointmentExpiryDate, 10); // Convert stored Unix timestamp to an integer
        const existingQueuingExpiryDate = parseInt(salon.queueingExpiryDate, 10); // Convert stored Unix timestamp to an integer
        const paymentDaysToAdd = parseInt(session.metadata.paymentExpiryDate, 10); // Number of days to add
      
        // Calculate the new expiry date
        const newAppointmentExpiryDate = moment.unix(existingAppointmentExpiryDate) // Convert existing Unix timestamp to a moment object
          .add(paymentDaysToAdd, 'days') // Add the payment expiry days
          .unix(); 

            // Calculate the new expiry date
        const newQueuingExpiryDate = moment.unix(existingQueuingExpiryDate) // Convert existing Unix timestamp to a moment object
        .add(paymentDaysToAdd, 'days') // Add the payment expiry days
        .unix(); 



        const isQueuingValue = Boolean(session.metadata.isQueuing)
        const isAppointmentValue = Boolean(session.metadata.isAppointments)

        await Salon.updateOne(
          { salonId: session.metadata.salonId },
          {
            $set: {
              isQueuing: isQueuingValue,
              isAppointments: isAppointmentValue,
              queueingExpiryDate: newQueuingExpiryDate,
              appointmentExpiryDate: newAppointmentExpiryDate
            },
          }
        )

        await salonPayments(paymentData)

        // const salon = await getSalonBySalonId(session.metadata.salonId)
  
        const emailSubject = ` Payment Confirmation - ${salon.salonName}`;
        const emailBody = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmation</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@600&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Roboto&display=swap" rel="stylesheet">
  
          <style>
          body {
                 font-family: 'Poppins', sans-serif;
                 margin: 0;
                 padding: 0;
                 background-color: #f9f9f9;
                 color: #000,
              }
              .container {
                  max-width: 600px;
                  margin: 20px auto;
                  padding: 20px;
                  background-color: #ffffff;
                  border-radius: 10px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              }
              .header {
                  text-align: center;
                  margin-bottom: 20px;
              }
              .logo img {
                  max-width: 150px;
                  border-radius: 50%;
                  width: 150px;
                  height: 150px;
                  object-fit: cover;
              }
              .email-content {
                  padding: 20px;
                  background-color: #f8f8f8;
                  font-size: 1rem;
                  border-radius: 10px;
              }
              ul {
                  padding-left: 20px;
              }
              li {
                  margin-bottom: 8px;
              }
              p {
                  line-height: 1.6;
              }
              .footer {
                  margin-top: 20px;
                  font-size: 0.9em;
                  text-align: center;
                  color: #888888;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="email-content">
              <div class="header">
                  <h1>Payment Confirmation</h1>
              </div>
                  <p>Dear ${session.customer_details.name},</p>
                  <p>Thank you for your payment at <strong>${salon.salonName}</strong>. Below are the details of your transaction:</p>
                  <ul>
                      <li><strong>Purchase Date:</strong> ${moment.unix(session.metadata.purchaseDate).format('YYYY-MM-DD')}</li>
                      <li><strong>Queueing Expiry Date:</strong> ${moment.unix(newQueuingExpiryDate).format('YYYY-MM-DD')}</li>
                      <li><strong>Appointment Expiry Date:</strong> ${moment.unix(newAppointmentExpiryDate).format('YYYY-MM-DD')}</li>
                      <li><strong>Total Amount Paid:</strong> ${session.currency.toUpperCase()} ${session.amount_total / 100}</li>
                      <li><strong>Products Purchased:</strong> ${products.map(product => product.name).join(', ')}</li>
                  </ul>
                  <p>If you have any questions or need further assistance, feel free to contact us.</p>
                  <p>Best regards,</p>
                  <p>
                      <strong>IQueueBook</strong><br>
                      <strong>support@iqueuebarbers.com</strong> 
                  </p>
              </div>
              <div class="footer">
                  &copy; ${new Date().getFullYear()} IQueueBook. All rights reserved.
              </div>
          </div>
      </body>
      </html>
      `;
  
        try {
          sendPaymentSuccesEmail(session.customer_details.email, emailSubject, emailBody, invoice, paymentData, products);
          console.log("Payment Email Sent")
          return
        } catch (error) {
          console.error('Error sending email:', error);
          return
        }

        // await SalonSettings.updateOne(
        //   { salonId: session.metadata.salonId },
        //   {
        //     $set: {
        //       isQueuing: isQueuingValue,
        //       isAppointments: isAppointmentValue,
        //       queueingExpiryDate: session.metadata.paymentExpiryDate,
        //       appointmentExpiryDate: session.metadata.paymentExpiryDate
        //     },
        //   }
        // )
      }
    }
  }
  response.status(200).json({ received: true });
});

const saveAccountEndpointSecret = "whsec_DI2vfnOkeWPhrsuIpX1S3gzNf5mw2ArF"

app.post('/api/saveaccountid', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;

  try {
    // Verify the webhook signature to ensure it's from Stripe
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(req.body, signature, saveAccountEndpointSecret);
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }


  if (event.type === 'account.updated') {
    const account = event.data.object;

    if (
      account.requirements.currently_due.length === 0 && // No remaining requirements
      account.capabilities.transfers === 'active' // Account is fully activated for transfers
    ) {

      const vendorEmail = account.email
      const vendorAccountId = account.id
      const vendorCountry = account.country
      const vendorCurrency = account.default_currency
      const vendorCardPaymentStatus = account.capabilities.card_payments
      const vendorTransferStatus = account.capabilities.transfers


      const updatedAdminVendorDetails = await Admin.findOneAndUpdate(
        { email: vendorEmail }, // Match condition
        {
          $set: {
            "vendorAccountDetails.vendorEmail": vendorEmail,
            "vendorAccountDetails.vendorAccountId": vendorAccountId,
            "vendorAccountDetails.vendorCountry": vendorCountry,
            "vendorAccountDetails.vendorCurrency": vendorCurrency,
            "vendorAccountDetails.vendorCardPaymentStatus": vendorCardPaymentStatus,
            "vendorAccountDetails.vendorTransferStatus": vendorTransferStatus
          }
        },
        { new: true, upsert: true } // Options to return updated document and insert if not found
      );

      return
    }

    return res.status(200).send('Webhook processed');
  } else {
    // Ignore other events
    return res.status(200).send('Event ignored');
  }

});



// app.post('/api/save-vendor-customer', express.raw({ type: 'application/json' }), async (request, response) => {
//   const sig = request.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(request.body, sig, "whsec_rgrNdI1jsnC3FbGqY6Ki2uEwEpXByZbD");
//   } catch (err) {
//     console.error('Webhook signature verification failed:', err.message);
//     return response.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object;

//     console.log("Customer Session ", session)

//   }

//   response.status(200).json({ received: true });
// });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// app.use(helmet()); 




// // Initialize Firebase Admin SDK
const serviceAccount = jsonFile.readFileSync('./notification_push_service_key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cookieParser())
app.use(rateLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))


//Image upload =============
if (process.env.NODE_ENV != "production") {
  app.use(morgan("dev"));
}

app.use(fileUpload({
  debug: true,
  useTempFiles: true,
}));
app.use(express.static("uploads"));

app.use(logMiddleware);

app.use("/logger", loggerRoutes)

app.use((req, res, next) => {
  if (Object.keys(req.query).length > 0) {
    logger.info("Request Query Parameters:", req.query);
  }
  if (req.body && Object.keys(req.body).length > 0) {
    logger.info("Request Body:", req.body);
  }

  const oldSend = res.send;
  res.send = function (data) {
    try {
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      logger.info("Response Data:", parsedData);
    } catch (error) {
      logger.error("Response Data (Raw):", data);
      logger.error("Error parsing response data:", error);
    }
    return oldSend.apply(res, arguments);
  };

  next();
})


//Kiosk base routes
app.use("/kiosk", kioskRoutes)

//Tv app base routes
app.use("/tvAppRoutes", tvappRoutes)

//Mobile base routes
app.use("/api/customer", customerRoutes)
app.use("/api/mobileRoutes", mobileRoutes)

//Web base routes
app.use("/api/admin", adminRoutes)
app.use("/api/salon", salonRoutes)
app.use("/api/barber", barberRoutes)
app.use("/api/customers", customerRoutesWeb)
app.use("/api/queue", queueRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/advertisement", advertisementRoutes)
app.use("/api/salonSettings", salonSettingsRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/ratings", ratingRoutes)
app.use("/api/icons", iconRoutes)
app.use("/api/country", countryRoutes)
app.use("/api/bulkMessageAndEmails", bulkMessageAndEmailsRoutes)
app.use("/api/reports", reports)
app.use("/api/queueHistory", queuehistoryRoutes)
app.use("/api/barberDayOff", barberDayOffRoutes)
app.use("/api/barberAppointmentDays", barberAppointmentDays)
app.use('/api/salonPayments', salonPaymentRoutes);





// app.use(express.json());
// app.use(bodyParser.raw({ type: "application/json" })); // For Stripe webhooks


// Create Checkout Session Endpoint
// app.post("/api/create-checkout-session", async (req, res) => {
//   try {
//     // const productsArray = req.body.products;

//     // const productInfo = {
//     //   salonId,
//     //   adminEmail,
//     //   paymentType: "Free",
//     //   paymentExpiryDate: new Date(),
//     //   products
//     // }

//     const productInfo = req.body.productInfo

//     console.log("Working B")

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"], // Types of card (Visa, MasterCard, etc.)
//       mode: "payment",
//       // line_items: productsArray.map((item) => ({
//       //   price_data: {
//       //     currency: item.currency,
//       //     product_data: {
//       //       name: item.name,
//       //     },
//       //     unit_amount: item.price * 100, // Amount in cents
//       //   },
//       //   quantity: item.unit,
//       // })),
//       line_items: [
//         {
//           price_data: {
//             currency: 'usd',
//             product_data: {
//               name: 'T-shirt',
//             },
//             unit_amount: 2000, // Price in cents
//           },
//           quantity: 1, // Add quantity here
//         },
//       ],
//       success_url: "https://iqb-final.netlify.app/admin-salon",
//       cancel_url: "https://iqb-final.netlify.app/admin-salon",
//     });

//     res.status(200).json({
//       success: true,
//       session,
//     });
//   } catch (error) {
//     console.log("Payment Check-Out Failed ", error)
//   }
// });

app.post("/api/create-checkout-session", async (req, res) => {
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
        success_url: "https://iqb-final.netlify.app/admin-salon",
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
});

app.post("/api/onboard-vendor-account", async (req, res, next) => {
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
});


app.post("/api/vendor-loginlink", async (req, res) => {
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
  }
})

// Vendor Check Out Session
app.post("/api/vendor-create-checkout-session", async (req, res) => {
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
});


//////////////////////////////////////////
// Global Error Handler
app.use(GlobalErrorHandler)


const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) =>
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'))
);

const PORT = 8001;

//CRON-JOBS
updateCustomers()
checkQueuingAndAppointmentExpire()
checkPaymentsExpiry()
salonShutdown()

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
