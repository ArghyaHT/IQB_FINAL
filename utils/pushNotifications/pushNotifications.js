import axios from "axios";

export const sendQueueNotification = async(Token, SalonName, Current, FirstLastName, DeviceType, notificationMessage) => {
    const deviceToken = `ExponentPushToken[${Token.trim()}]`;

    let messageBody = `${SalonName} queue update!\n`;
    if (Token) {
        messageBody += `${FirstLastName}:${notificationMessage} ${Current}.`;
    } else {
        messageBody += `Your queue position has changed to ${Current}.`;
    }

    const title = "Queue Position Update";
    const additionalData = {
        DeviceType: DeviceType,
        QueuePosition: Current,
    };

    const response = await sendExpoPushNotification(deviceToken, title, messageBody, additionalData);

    // Check the response from Expo
    if (response.data && response.data.status === "ok") {
        res.json({
            StatusCode: 200,
            Response: { NotificationID: response.data.id },
            StatusMessage: "Notification sent successfully",
        });
    } else {
        res.json({
            StatusCode: 201,
            Response: response,
            StatusMessage: "Notification failed",
        });
    }
}

// Function to send Expo push notifications
export const sendExpoPushNotification = async(deviceToken, title, body, additionalData) =>  {
    const url = "https://exp.host/--/api/v2/push/send";
    
    const message = {
        to: deviceToken,
        sound: "default",
        title: title,
        body: body,
        data: additionalData,
    };

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