import { response } from "express";
import { changeSeenStatus, findNotificationUserByEmail } from "../../services/mobile/notificationService.js";
import { findCustomerByEmail } from "../../services/mobile/customerService.js";

//DESC: GET ALL NOTIFICATION BY EMAIL
export const getAllNotificationsByCustomerEmail = async (req, res) => {
  const { email } = req.body;
  try {

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Proper Email Id required'
      });
    }

    const notifications = await findNotificationUserByEmail(email);

    const getcustomer = await findCustomerByEmail(email)

    if (!notifications) {
      return res.status(200).json({
        success: true,
        message: 'No notifications found for this email',
        response: []
      });
    }

    // Reverse the order of notifications
// Reverse the order of notifications and attach customer profile to each
const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
  ...notification.toObject(),  // Convert Mongoose document to plain object
  customerProfile: getcustomer.profile  // Attach customer details
}));
    res.status(200).json({
      success: true,
      message: "Notifications retrieved successfully",
      response: latestnotifications

    });
  } catch (error) {
    next(error);
  }
};


export const changeNotificationSeenStatus = async (req, res, next) => {
  try {
    const { _id, email } = req.body;

    const updatedNotifications = await changeSeenStatus(email, _id)

    if (!updatedNotifications) {
      return res.status(201).json({ status: false, message: "Notification not found" });
    }

    return res.status(200).json({ status: true, message: "Notification marked as seen", response: updatedNotifications });
  }
  catch (error) {
    next(error);
  }
}