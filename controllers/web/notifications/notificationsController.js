import admin from "firebase-admin";
import { getMultipleUserTokens, getUserTokens } from "../../../services/web/userTokenRegister/userTokenRegister.js";
import { createNewUserDoc, findUserByEmail, pushNotificationExistingUser } from "../../../services/web/notifications/notificationsService.js";

//DESC: SEND WEB NOTIFICATION
export const sendNotification = async (req, res, next) => {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ 
        success: false,
        message: 'Title and body are required' });
    }
    try {
      const users = await getUserTokens();
      const registrationTokens = users.reduce((tokens, user) => {
        if (user.webFcmToken) tokens.push(user.webFcmToken);
        if (user.androidFcmToken) tokens.push(user.androidFcmToken);
        if (user.iosFcmToken) tokens.push(user.iosFcmToken);
        return tokens;
      }, []);
  
      const message = {
        notification: {
          title,
          body,
        },
        tokens: registrationTokens, // Pass tokens as an array
      };
  
      const response = await admin.messaging().sendEachForMulticast(message);
  
      for (const user of users) {
        const existingNotification = await findUserByEmail(user.email)
  
        if (existingNotification) {
          // Email already exists, update the existing document
          await pushNotificationExistingUser(user.email, title, body);
        } else {
          // Email doesn't exist, create a new document
         await createNewUserDoc(user.email, title, body)
        }
      }
  
     return res.status(200).json({
        success: true,
        message: 'Notification sent and saved successfully'
      });
    } catch (error) {
        next(error);
    }
  }
  
  
 //DESC: SEND MULTIPLE WEB NOTIFICATION
  export const multiplesendNotification = async(req, res) =>{
    const { title, body, emails } = req.body;
  
    if (!title || !body || !emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Title, body, and valid emails array are required' });
    }
  
    try {
      const users = await getMultipleUserTokens(emails)
      const registrationTokens = users.reduce((tokens, user) => {
        if (user.webFcmToken) tokens.push(user.webFcmToken);
        if (user.androidFcmToken) tokens.push(user.androidFcmToken);
        if (user.iosFcmToken) tokens.push(user.iosFcmToken);
        return tokens;
      }, []);
  
      const message = {
        notification: {
          title,
          body,
        },
        tokens: registrationTokens, // Pass tokens as an array
      };
  
      const response = await admin.messaging().sendEachForMulticast(message);
  
      for (const user of users) {
        const existingNotification = await findUserByEmail(user.email)
        if (existingNotification) {
          // Email already exists, update the existing document
          await pushNotificationExistingUser(user.email, title, body);
        } else {
        // Email doesn't exist, create a new document
         await createNewUserDoc(user.email, title, body)
        }
      }
  
      res.status(200).json({
        success: true,
        message: 'Notifications sent and saved successfully'
      });
    } catch (error) {
        next(error);
    }
  }
  
  //DESC: GET ALL NOTIFICATION BY EMAIL
  export const getAllNotifications = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Proper Email Id required' });
    }
    try {
      const notifications = await findUserByEmail(email);
  
      if (!notifications) {
        return res.status(404).json({ 
          success: false,
          message: 'No notifications found for this email' });
      }
     // Reverse the order of notifications
    const latestnotifications = notifications.sentNotifications.reverse();
      res.status(200).json({
        success: true,
        message: "Notifications retrieved successfully",
        response:{
          _id: notifications._id,
          email: notifications.email,
          sentNotifications: latestnotifications
        }
       });
    } catch (error) {
        next(error);
    }
  };
