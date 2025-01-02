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

// import { setupCronJobs } from "./triggers/cronJobs.js";
// import { storeCountries } from "./utils/countries.js";


import loggerRoutes from "./routes/loggerRoutes.js"
import logger from "./utils/logger/logger.js";
import { GlobalErrorHandler } from "./middlewares/GlobalErrorHandler.js";
import { logMiddleware } from "./controllers/loggerController.js";
import { updateCustomers } from "./triggers/cronjobs.js";

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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// app.use(helmet()); 

app.use(cookieParser())

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://iqb-kiosk.netlify.app",
  "https://iqb-final.onrender.com",
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
