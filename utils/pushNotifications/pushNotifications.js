import axios from "axios";
import admin from "firebase-admin"
import { createNewUserNotification, findNotificationUserByEmail, pushNotificationExistingUser } from "../../services/mobile/notificationService.js";

export const sendQueueNotification = async(Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage, customerEmail) => {

    const deviceToken = `ExponentPushToken[${Token.trim()}]`;

    let messageBody = `${SalonName} queue update!\n`;
    if (Token) {
        messageBody += `${FirstLastName}:${notificationMessage} ${Current}.`;
    }
    const title = "Queue Position Update";
    const additionalData = {
        DeviceType: DeviceType,
        QueuePosition: Current,
    };

    const response = await sendExpoPushNotification(deviceToken, title, messageBody, additionalData);

    const time = new Date()
    const type = "Queueing"

    const existingUser = await findNotificationUserByEmail(customerEmail)


    if (existingUser) {
        // Email already exists, update the existing document
        await pushNotificationExistingUser(existingUser.email, title, messageBody, time, type);
      } else {
      // Email doesn't exist, create a new document
       await createNewUserNotification(customerEmail, title, messageBody, time, type)
      }

    // const responseFirebase = await sendFCMPushNotification(deviceToken, title, messageBody, additionalData);


    console.log("expo notification fired", response)

    // console.log("firebase notification fired", responseFirebase)


    // Check the response from Expo
    // Return the response instead of using res.json()
    if (response.data && response.data.status === "ok") {

        console.log(response.data)
        return {
            StatusCode: 200,
            Response: { NotificationID: response.data.id},
            StatusMessage: "Notification sent successfully",
        };
    } else {
        return {
            StatusCode: 201,
            Response: response || responseFirebase,
            StatusMessage: "Notification failed",
        };
    }
}

export const sendAppointmentNotification = async(Token, SalonName, FirstLastName, DeviceType, notificationMessage, customerEmail, startTime, appointmentDate) => {
    const deviceToken = `ExponentPushToken[${Token.trim()}]`;

    let messageBody = `${SalonName} Appointment update!\n`;
    if (Token) {
        messageBody += `${FirstLastName}:${notificationMessage} on ${appointmentDate} at ${startTime}.`;
    }
    const title = "Appointment Update";
    const additionalData = {
        DeviceType: DeviceType,
    };

    const response = await sendExpoPushNotification(deviceToken, title, messageBody, additionalData);

    const time = new Date()
    const type = "Appointment"

    const existingUser = await findNotificationUserByEmail(customerEmail)

    console.log(existingUser)

    console.log("expo notification fired", response)

    if (existingUser) {
        // Email already exists, update the existing document
        await pushNotificationExistingUser(existingUser.email, title, messageBody, time, type);
      } else {
      // Email doesn't exist, create a new document
       await createNewUserNotification(customerEmail, title, messageBody, time, type)
      }

    // Check the response from Expo
    // Return the response instead of using res.json()
    if (response.data && response.data.status === "ok") {
        return {
            StatusCode: 200,
            Response: { NotificationID: response.data.id },
            StatusMessage: "Notification sent successfully",
        };
    } else {
        return {
            StatusCode: 400,
            Response: response,
            StatusMessage: "Notification failed",
        };
    }
}

// Function to send Expo push notifications
export const sendExpoPushNotification = async(deviceToken, title, body, additionalData) =>  {

    console.log("Expo notification data",deviceToken, title, body, additionalData)

    const url = "https://exp.host/--/api/v2/push/send";
    
    const message = {
        to: deviceToken,
        sound: "default",
        title: title,
        body: body,
        data: additionalData,
    };
    console.log(message)

    try {
        const response = await axios.post(url, message, {
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                "Content-Type": "application/json",
            },
        });

        return response.data;
    } catch (error) {
        console.error("Expo Push Notification Error:", error);
        return { error: error.message };
    }
}


export const sendFCMPushNotification = async (deviceToken, title, body, additionalData) => {
    console.log("FCM notification data", deviceToken, title, body, additionalData);

    const message = {
        token: deviceToken, // FCM token instead of Expo token
        notification: {
            title: title,
            body: body,
        },
        data: additionalData, // Additional payload data
        android: {
            priority: "high",
            notification: {
                sound: "default",
            },
        },
        apns: {
            payload: {
                aps: {
                    sound: "default",
                },
            },
        },
    };

    console.log("Sending message:", message);

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log("FCM Push Notification Sent:", response);
        return { success: true, messageId: response };
    } catch (error) {
        console.error("FCM Push Notification Error:", error);
        return { error: error.message };
    }
};

export const checkPushNotifications = async(req, res, next) => {
    try{
        const { Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage, customerEmail} = req.body;

      const response = await sendQueueNotification(Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage, customerEmail)

      if(response){
        return res.status(200).json({
            success:true,
            message: "Notification Success"
           })
      }
        // const deviceToken = `ExponentPushToken[${Token.trim()}]`;

        // let messageBody = `${SalonName} queue update!\n`;
        // if (Token) {
        //     messageBody += `${FirstLastName}:${notificationMessage} ${Current}.`;
        // }
        // const title = "Queue Position Update";
        // const additionalData = {
        //     DeviceType: DeviceType,
        //     QueuePosition: Current,
        // };
    
        // const response = await sendExpoPushNotification(deviceToken, title, messageBody, additionalData);

        // if (response.data && response.data.status === "ok") {

        //     console.log(response.data)
        //     return {
        //         StatusCode: 200,
        //         Response: { NotificationID: response.data.id},
        //         StatusMessage: "Notification sent successfully",
        //     };
        // } else {
        //     return {
        //         StatusCode: 201,
        //         Response: response || responseFirebase,
        //         StatusMessage: "Notification failed",
        //     };
        // }
    }
    catch (error) {
        next(error);
    }
}