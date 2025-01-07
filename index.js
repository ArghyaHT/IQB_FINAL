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
// import salonPaymentRoutes from "./routes/web/salonPayment/salonPaymentGatewayRoutes.js"

// import { setupCronJobs } from "./triggers/cronJobs.js";
// import { storeCountries } from "./utils/countries.js";


import loggerRoutes from "./routes/loggerRoutes.js"
import logger from "./utils/logger/logger.js";
import { GlobalErrorHandler } from "./middlewares/GlobalErrorHandler.js";
import { logMiddleware } from "./controllers/loggerController.js";
import { updateCustomers } from "./triggers/cronjobs.js";
import Stripe from "stripe";
import SalonPayments from "./models/paymentGatewayModel.js";

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
  "http://127.0.0.1:5173",
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
const stripe = Stripe("sk_test_51QdUcgJJY2GyQI9MG1P9ZNELM63wZn7fEpDw2x8BfnSLsjUA7amARck1wCu63ZbX4s02hfKOS7iB0KTt49MY3m8w00wi9WMXMi")

const endpointSecret = "whsec_DHdgxBkr9Q3LxPngNylgMs00eTyZXxqi"; // Replace with your actual webhook secret

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  let event;

  try {
    // Construct the event using the raw body and the signature header
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

    const products = lineItems.data.map((item) => ({
      name: item.description,
      quantity: item.quantity,
      price: item.amount_total / 100, // Amount in dollars (converted from cents)
      currency: session.currency,
    }));

    // Save payment details to MongoDB
    const paymentData = {
      customerEmail: session.customer_details.email,
      customerName: session.customer_details.name,
      amount: session.amount_total, // Convert from cents to dollars
      currency: session.currency,
      paymentIntentId: session.payment_intent,
      status: session.payment_status,
      products: products,
    };

    console.log("Working A")
    // Convert amount based on currency
    if (session.currency !== 'jpy' && session.currency !== 'krw') {
      paymentData.amount = paymentData.amount / 100; // Convert to main currency unit
    } else {
      // For JPY, KRW or other currencies that don't need division by 100
      paymentData.amount = paymentData.amount; // Keep it as is
    }

    SalonPayments.create(paymentData)
      .then(() => console.log("Payment saved to database"))
      .catch((err) => console.error("Error saving payment to database:", err));

  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    console.log("Payment Failed ", paymentIntent)
    // It can happen example:
    // If user card has insufficient balance.
    // Here i can send a email to the user that he/she has insufficient balance for that the payment is not completed.
  }
  response.status(200).json({ received: true });
});


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
// app.use('/api/salonPayments', salonPaymentRoutes);





// app.use(express.json());
// app.use(bodyParser.raw({ type: "application/json" })); // For Stripe webhooks


// Create Checkout Session Endpoint
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const productsArray = req.body.products;

    console.log("Working B")

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"], // Types of card (Visa, MasterCard, etc.)
      mode: "payment",
      line_items: productsArray.map((item) => ({
        price_data: {
          currency: item.currency,
          product_data: {
            name: item.name,
          },
          unit_amount: item.price * 100, // Amount in cents
        },
        quantity: item.unit,
      })),
      success_url: "https://productstripe.netlify.app/success",
      cancel_url: "https://productstripe.netlify.app/cancel",
    });

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    console.log("Payment Check-Out Failed ", error)
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

updateCustomers()

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
