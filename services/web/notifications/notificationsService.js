import Notification from "../../../models/notificationModel.js";

//FIND USER BY EMAIL
export const findUserByEmail = async(email) => {
    const user = await Notification.findOne({ email: email });
    return user;
}

//IF USER DONT EXIST IN DATABASE
export const createNewUserDoc = async(email, title, body) => {
    const user =  await Notification.create({ email: email, sentNotifications: [{ title, body }] });
    return user;
}

//IF USER EXISTS PUSH NOTIFICATION TO USER
export const pushNotificationExistingUser = async(email, title, body) => {
    const user =  await Notification.findOneAndUpdate(
        { email: email },
        { $push: { sentNotifications: { title, body } } }
      );
      return user;
    }