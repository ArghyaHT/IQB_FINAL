import { changeSeenStatus, findNotificationUserByEmail } from "../../services/mobile/notificationService.js";
import { findCustomerByEmail } from "../../services/mobile/customerService.js";
import { findSalonBySalonId } from "../../services/mobile/salonServices.js";
import { io } from "../../utils/socket/socket.js";

//DESC: GET ALL NOTIFICATION BY EMAIL
export const getAllNotificationsByCustomerEmail = async (req, res, next) => {
  let { email } = req.body;

  email = email.trim().toLowerCase();

  try {

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Proper Email Id required'
      });
    }

    const notifications = await findNotificationUserByEmail(email);

    const getcustomer = await findCustomerByEmail(email)

    const customerSalon = await findSalonBySalonId(getcustomer.salonId)

    if (!notifications) {
      return res.status(200).json({
        success: true,
        message: 'No notifications found for this email',
        response: []
      });
    }

        // Define a default logo
    const defaultSalonLogo = [{
      url: "https://res.cloudinary.com/dpynxkjfq/image/upload/v1743597098/iqb_borderless_ivi965.jpg", // Replace with your actual default logo URL
    }];

    const salonLogo = customerSalon?.salonLogo || defaultSalonLogo;

    // Reverse the order of notifications and attach customer profile to each
    const latestnotifications = notifications.sentNotifications.reverse().map(notification => ({
      ...notification.toObject(),  // Convert Mongoose document to plain object
      salonLogo: salonLogo  // Attach customer details
    }));


    await io.to(`customer_${getcustomer.salonId}_${email}`).emit("receiveNotifications", latestnotifications);

    return res.status(200).json({
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
      return res.status(400).json({ status: false, message: "Notification not found" });
    }

    return res.status(200).json({ status: true, message: "Notification marked as seen", response: updatedNotifications });
  }
  catch (error) {
    next(error);
  }
}