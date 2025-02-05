import axios from "axios";
import admin from "firebase-admin"

export const sendQueueNotification = async(Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage) => {

    console.log("Notification console",Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage)

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

    const responseFirebase = await sendFCMPushNotification(deviceToken, title, messageBody, additionalData);


    console.log("expo notification fired", response)

    console.log("firebase notification fired", responseFirebase)


    // Check the response from Expo
    // Return the response instead of using res.json()
    if (response.data && response.data.status === "ok" || responseFirebase.data && responseFirebase.data.status === "ok") {

        console.log(response.data || responseFirebase.data)
        return {
            StatusCode: 200,
            Response: { NotificationID: response.data.id || responseFirebase.data.id },
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


export const sendAppointmentNotification = async(Token, SalonName, FirstLastName, DeviceType, notificationMessage) => {
    const deviceToken = `ExponentPushToken[${Token.trim()}]`;

    let messageBody = `${SalonName} Appointment update!\n`;
    if (Token) {
        messageBody += `${FirstLastName}:${notificationMessage}.`;
    }
    const title = "Appointment Update";
    const additionalData = {
        DeviceType: DeviceType,
    };

    const response = await sendExpoPushNotification(deviceToken, title, messageBody, additionalData);

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
            StatusCode: 201,
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