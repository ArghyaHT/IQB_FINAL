import Notification from "../../models/notificationModel.js";

//FIND USER BY EMAIL
export const findNotificationUserByEmail = async(email) => {
    const user = await Notification.findOne({ email: email });
    return user;
}

//IF USER DONT EXIST IN DATABASE
export const createNewUserNotification = async(email, title, body, time, type) => {
    const user =  await Notification.create({ email: email, sentNotifications: [{ title, body, time, type }] });
    return user;
}

//IF USER EXISTS PUSH NOTIFICATION TO USER
export const pushNotificationExistingUser = async(email, title, body, time, type) => {
    const user =  await Notification.findOneAndUpdate(
        { email: email },
        { $push: { sentNotifications: { title, body, time, type } } }
      );
      return user;
    }