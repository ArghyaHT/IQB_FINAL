import express from "express";
import {  handleProtectedRoute } from "../../../middlewares/web/middlewares.js";
import { getAllNotifications, multiplesendNotification, sendNotification } from "../../../controllers/web/notifications/notificationsController.js";

const router = express.Router();

// Endpoint for sending notifications for web
router.route("/send-notification").post( sendNotification)

//Send Multiple Notification
router.route("/send-multiple-notification").post( multiplesendNotification)

// // Endpoint for sending notifications for web
// router.route("/send-notification-android").post(sendNotificationToAndroid)

//Get All Notifications
router.route("/getAllNotifications").post(handleProtectedRoute, getAllNotifications)


export default router;